-- ---------------------------------------------------------------------------
-- Add subject_name to get_session_review so the post-exam result screen can
-- show a per-subject score breakdown. Returning a new column changes the
-- function signature, so drop + recreate (CREATE OR REPLACE can't alter the
-- RETURNS TABLE shape).
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_session_review(UUID);

CREATE FUNCTION public.get_session_review(p_session_id UUID)
RETURNS TABLE (
  question_id UUID,
  stem TEXT,
  choices JSONB,
  selected_choice_id TEXT,
  is_correct BOOLEAN,
  correct_choice_id TEXT,
  explanation_en TEXT,
  explanation_fil TEXT,
  time_spent_seconds INT,
  subject_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id AS question_id,
    q.stem,
    q.choices,
    qa.selected_choice_id,
    qa.is_correct,
    q.correct_choice_id,
    q.explanation_en,
    q.explanation_fil,
    qa.time_spent_seconds,
    sa.name AS subject_name
  FROM quiz_answers qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  JOIN questions q ON q.id = qa.question_id
  LEFT JOIN topics t ON t.id = q.topic_id
  LEFT JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE qa.session_id = p_session_id
    AND qs.user_id = auth.uid()
  ORDER BY qa.answered_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_session_review(UUID) TO authenticated;
