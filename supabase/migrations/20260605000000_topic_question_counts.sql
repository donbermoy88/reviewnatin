-- Per-topic published-question counts for the Study → subject screen.
--
-- Questions are RLS-locked to staff (questions_staff_read), so the mobile app
-- (anon/authenticated) cannot count them with a direct query. This SECURITY
-- DEFINER function returns the published-question count per topic for a given
-- exam + subject so the UI can badge empty topics as "Coming soon" instead of
-- letting users tap into a dead-end quiz.
--
-- Mirrors the pattern of public.get_content_counts (per-exam totals).

CREATE OR REPLACE FUNCTION public.get_topic_question_counts(
  p_exam_slug TEXT,
  p_subject_slug TEXT
)
RETURNS TABLE (topic_slug TEXT, published_count INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.slug AS topic_slug,
         count(q.id) FILTER (WHERE q.status = 'published')::int AS published_count
  FROM topics t
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et    ON et.id = sa.exam_type_id
  LEFT JOIN questions q ON q.topic_id = t.id
  WHERE et.slug = p_exam_slug
    AND sa.slug = p_subject_slug
    AND et.is_active = true
  GROUP BY t.slug;
$$;

GRANT EXECUTE ON FUNCTION public.get_topic_question_counts(TEXT, TEXT) TO anon, authenticated;
