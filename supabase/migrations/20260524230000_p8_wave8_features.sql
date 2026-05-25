-- Wave 8: Report triage workflow (staff-only)

CREATE OR REPLACE FUNCTION public.resolve_reported_question(
  p_report_id UUID,
  p_status report_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  IF p_status NOT IN ('triaged', 'fixed', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer', 'content_author') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  UPDATE reported_questions
  SET
    status = p_status,
    details = COALESCE(p_notes, details),
    resolved_by = auth.uid(),
    resolved_at = now()
  WHERE id = p_report_id AND status = 'open';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_reported_question(UUID, report_status, TEXT) TO authenticated;
