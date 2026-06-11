-- Generalized user reports for any study content surfaced in the app.
-- Keeps legacy reported_questions intact while allowing flashcards/materials to be triaged.

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('question', 'flashcard', 'review_material')),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
  review_material_id UUID REFERENCES public.review_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason public.report_reason NOT NULL,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_reports_exactly_one_target CHECK (
    (CASE WHEN question_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN flashcard_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN review_material_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  CONSTRAINT content_reports_target_matches_type CHECK (
    (content_type = 'question' AND question_id IS NOT NULL AND flashcard_id IS NULL AND review_material_id IS NULL) OR
    (content_type = 'flashcard' AND flashcard_id IS NOT NULL AND question_id IS NULL AND review_material_id IS NULL) OR
    (content_type = 'review_material' AND review_material_id IS NOT NULL AND question_id IS NULL AND flashcard_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_content_reports_open_created
  ON public.content_reports(created_at DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_content_reports_question_id
  ON public.content_reports(question_id)
  WHERE question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_reports_flashcard_id
  ON public.content_reports(flashcard_id)
  WHERE flashcard_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_reports_review_material_id
  ON public.content_reports(review_material_id)
  WHERE review_material_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_reports_open_question
  ON public.content_reports(user_id, question_id)
  WHERE status = 'open' AND question_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_reports_open_flashcard
  ON public.content_reports(user_id, flashcard_id)
  WHERE status = 'open' AND flashcard_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_reports_open_review_material
  ON public.content_reports(user_id, review_material_id)
  WHERE status = 'open' AND review_material_id IS NOT NULL;

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;

DROP POLICY IF EXISTS "content_reports_insert_own" ON public.content_reports;
CREATE POLICY "content_reports_insert_own"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "content_reports_select_own" ON public.content_reports;
CREATE POLICY "content_reports_select_own"
  ON public.content_reports
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "content_reports_update_own_open" ON public.content_reports;
CREATE POLICY "content_reports_update_own_open"
  ON public.content_reports
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open')
  WITH CHECK (auth.uid() = user_id AND status = 'open');

INSERT INTO public.content_reports (
  content_type,
  question_id,
  user_id,
  reason,
  details,
  status,
  resolved_by,
  resolved_at,
  created_at,
  updated_at
)
SELECT
  'question',
  rq.question_id,
  rq.user_id,
  rq.reason,
  rq.details,
  rq.status,
  rq.resolved_by,
  rq.resolved_at,
  rq.created_at,
  COALESCE(rq.resolved_at, rq.created_at)
FROM public.reported_questions rq
ON CONFLICT DO NOTHING;

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
BEGIN
  IF p_status NOT IN ('triaged', 'fixed', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer', 'content_author') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  UPDATE public.content_reports
  SET
    status = p_status,
    admin_notes = COALESCE(NULLIF(trim(p_admin_notes), ''), admin_notes),
    resolved_by = auth.uid(),
    resolved_at = now(),
    updated_at = now()
  WHERE id = p_report_id AND status = 'open';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_content_report(UUID, public.report_status, TEXT) TO authenticated;
