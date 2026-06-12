-- ---------------------------------------------------------------------------
-- get_mock_subject_trends: per-subject score for the user's recent completed
-- mock/board attempts, so the Progress tab can show improvement over time.
-- Returns one row per (session, subject), oldest attempt first.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mock_subject_trends(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  session_id UUID,
  completed_at TIMESTAMPTZ,
  subject_name TEXT,
  subject_slug TEXT,
  correct INT,
  total INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent_sessions AS (
    SELECT qs.id, qs.completed_at
    FROM quiz_sessions qs
    JOIN exam_types et ON et.id = qs.exam_type_id
    WHERE et.slug = p_exam_slug
      AND qs.user_id = auth.uid()
      AND qs.mode IN ('mock', 'board')
      AND qs.completed_at IS NOT NULL
    ORDER BY qs.completed_at DESC
    LIMIT GREATEST(p_limit, 1)
  )
  SELECT
    rs.id AS session_id,
    rs.completed_at,
    sa.name AS subject_name,
    sa.slug AS subject_slug,
    COUNT(*) FILTER (WHERE qa.is_correct)::int AS correct,
    COUNT(*)::int AS total
  FROM recent_sessions rs
  JOIN quiz_answers qa ON qa.session_id = rs.id
  JOIN questions q ON q.id = qa.question_id
  LEFT JOIN topics t ON t.id = q.topic_id
  LEFT JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE sa.name IS NOT NULL
  GROUP BY rs.id, rs.completed_at, sa.name, sa.slug
  ORDER BY rs.completed_at ASC, sa.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_mock_subject_trends(TEXT, INT) TO authenticated;
