-- Admin content QA workflow: severity, assignment, duplicate grouping, and audit history.

ALTER TABLE public.content_reports
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS triage_labels TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duplicate_group_key TEXT GENERATED ALWAYS AS (
    content_type || ':' || COALESCE(question_id::text, flashcard_id::text, review_material_id::text)
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_content_reports_workflow_queue
  ON public.content_reports(status, severity, assigned_to, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_reports_duplicate_group
  ON public.content_reports(duplicate_group_key, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.content_report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.content_reports(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('created', 'assigned', 'severity_changed', 'status_changed', 'note_added', 'labels_changed')
  ),
  from_value TEXT,
  to_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_report_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_content_report_events_report_created
  ON public.content_report_events(report_id, created_at DESC);

GRANT SELECT, INSERT ON public.content_report_events TO authenticated;

DROP POLICY IF EXISTS "content_report_events_staff_select" ON public.content_report_events;
CREATE POLICY "content_report_events_staff_select"
  ON public.content_report_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'content_reviewer', 'content_author')
    )
  );

DROP POLICY IF EXISTS "content_report_events_staff_insert" ON public.content_report_events;
CREATE POLICY "content_report_events_staff_insert"
  ON public.content_report_events
  FOR INSERT
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'content_reviewer', 'content_author')
    )
  );

CREATE OR REPLACE FUNCTION public.update_content_report_workflow(
  p_report_id UUID,
  p_severity TEXT DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_assign_to_self BOOLEAN DEFAULT false,
  p_labels TEXT[] DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_before public.content_reports%ROWTYPE;
  v_after public.content_reports%ROWTYPE;
  v_assignee UUID;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer', 'content_author') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF p_severity IS NOT NULL AND p_severity NOT IN ('low', 'medium', 'high', 'critical') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_severity');
  END IF;

  SELECT * INTO v_before
  FROM public.content_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  v_assignee := CASE WHEN p_assign_to_self THEN auth.uid() ELSE p_assigned_to END;

  IF v_assignee IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_assignee
      AND role IN ('admin', 'content_reviewer', 'content_author')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_assignee');
  END IF;

  UPDATE public.content_reports
  SET
    severity = COALESCE(p_severity, severity),
    assigned_to = COALESCE(v_assignee, assigned_to),
    triage_labels = COALESCE(p_labels, triage_labels),
    admin_notes = COALESCE(NULLIF(trim(COALESCE(p_note, '')), ''), admin_notes),
    last_reviewed_at = now(),
    updated_at = now()
  WHERE id = p_report_id
  RETURNING * INTO v_after;

  IF p_severity IS NOT NULL AND p_severity <> v_before.severity THEN
    INSERT INTO public.content_report_events(report_id, actor_id, event_type, from_value, to_value)
    VALUES (p_report_id, auth.uid(), 'severity_changed', v_before.severity, p_severity);
  END IF;

  IF v_assignee IS NOT NULL AND v_assignee IS DISTINCT FROM v_before.assigned_to THEN
    INSERT INTO public.content_report_events(report_id, actor_id, event_type, from_value, to_value)
    VALUES (p_report_id, auth.uid(), 'assigned', v_before.assigned_to::text, v_assignee::text);
  END IF;

  IF p_labels IS NOT NULL AND p_labels IS DISTINCT FROM v_before.triage_labels THEN
    INSERT INTO public.content_report_events(report_id, actor_id, event_type, from_value, to_value)
    VALUES (p_report_id, auth.uid(), 'labels_changed', array_to_string(v_before.triage_labels, ','), array_to_string(p_labels, ','));
  END IF;

  IF NULLIF(trim(COALESCE(p_note, '')), '') IS NOT NULL THEN
    INSERT INTO public.content_report_events(report_id, actor_id, event_type, note)
    VALUES (p_report_id, auth.uid(), 'note_added', trim(p_note));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', v_after.id,
    'severity', v_after.severity,
    'assigned_to', v_after.assigned_to
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_content_report_workflow(UUID, TEXT, UUID, BOOLEAN, TEXT[], TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_content_report(
  p_report_id UUID,
  p_status public.report_status,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_before public.content_reports%ROWTYPE;
BEGIN
  IF p_status NOT IN ('triaged', 'fixed', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer', 'content_author') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_before
  FROM public.content_reports
  WHERE id = p_report_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  UPDATE public.content_reports
  SET
    status = p_status,
    admin_notes = COALESCE(NULLIF(trim(p_admin_notes), ''), admin_notes),
    resolved_by = auth.uid(),
    resolved_at = now(),
    last_reviewed_at = now(),
    updated_at = now()
  WHERE id = p_report_id;

  INSERT INTO public.content_report_events(report_id, actor_id, event_type, from_value, to_value, note)
  VALUES (p_report_id, auth.uid(), 'status_changed', v_before.status::text, p_status::text, NULLIF(trim(COALESCE(p_admin_notes, '')), ''));

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_content_report(UUID, public.report_status, TEXT) TO authenticated;
