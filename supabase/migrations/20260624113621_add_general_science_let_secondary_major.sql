-- Add General Science as a LET Secondary Area of Specialization major.

WITH major_sa AS (
  SELECT sa.id
  FROM public.subject_areas sa
  JOIN public.exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'let-secondary'
    AND sa.slug = 'major'
)
INSERT INTO public.topics (subject_area_id, slug, name, sort_order)
SELECT major_sa.id, 'general-science', 'General Science', 5
FROM major_sa
ON CONFLICT (subject_area_id, slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

WITH major_sa AS (
  SELECT sa.id
  FROM public.subject_areas sa
  JOIN public.exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'let-secondary'
    AND sa.slug = 'major'
)
UPDATE public.topics t
SET sort_order = CASE t.slug
  WHEN 'biological-science' THEN 6
  WHEN 'physical-science' THEN 7
  WHEN 'values-education' THEN 8
  WHEN 'mapeh' THEN 9
  WHEN 'tle' THEN 10
  ELSE t.sort_order
END
FROM major_sa
WHERE t.subject_area_id = major_sa.id
  AND t.slug IN (
    'biological-science',
    'physical-science',
    'values-education',
    'mapeh',
    'tle'
  );

WITH target_topic AS (
  SELECT t.id
  FROM public.topics t
  JOIN public.subject_areas sa ON sa.id = t.subject_area_id
  JOIN public.exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'let-secondary'
    AND sa.slug = 'major'
    AND t.slug = 'general-science'
),
review_topic AS (
  SELECT t.id
  FROM public.topics t
  JOIN public.subject_areas sa ON sa.id = t.subject_area_id
  JOIN public.exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'let-secondary'
    AND sa.slug = 'major'
    AND t.slug = 'science-review-needed'
)
UPDATE public.questions q
SET topic_id = target_topic.id,
    major = 'General Science',
    major_slug = 'general-science',
    sub_tag = NULL,
    sub_tag_slug = NULL,
    needs_review = false,
    review_reason = NULL,
    tags = array(
      SELECT DISTINCT tag
      FROM unnest(
        array_remove(
          coalesce(q.tags, '{}') || ARRAY[
            'major:general-science',
            'general-science',
            'let-secondary-major-taxonomy-2026'
          ],
          'major:science-review-needed'
        )
      ) AS tag
      ORDER BY tag
    ),
    updated_at = now()
FROM target_topic, review_topic
WHERE q.topic_id = review_topic.id
  AND q.major_slug = 'science-review-needed'
  AND q.source_note ILIKE '%BSED General Science%';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.topics t
    JOIN public.subject_areas sa ON sa.id = t.subject_area_id
    JOIN public.exam_types et ON et.id = sa.exam_type_id
    WHERE et.slug = 'let-secondary'
      AND sa.slug = 'major'
      AND t.slug = 'general-science'
  ) THEN
    RAISE EXCEPTION 'LET Secondary major topic general-science was not created';
  END IF;
END $$;
