-- ---------------------------------------------------------------------------
-- Add subject_slug to get_session_review so the result screen's "Score by
-- subject" breakdown can offer a 'Practice your weakest subject' CTA that routes
-- to the subject hub (/study/[subjectSlug]). Return signature changes, so
-- drop + recreate.
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
  subject_name TEXT,
  subject_slug TEXT
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
    sa.name AS subject_name,
    sa.slug AS subject_slug
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
