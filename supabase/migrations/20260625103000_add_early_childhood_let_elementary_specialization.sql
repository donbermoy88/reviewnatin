-- Add Early Childhood Education as a LET Elementary Area of Specialization.

WITH elementary_exam AS (
  SELECT id
  FROM public.exam_types
  WHERE slug = 'let-elementary'
)
INSERT INTO public.subject_areas (exam_type_id, slug, name, weight_percent, sort_order)
SELECT elementary_exam.id, 'major', 'Area of Specialization', 0, 3
FROM elementary_exam
ON CONFLICT (exam_type_id, slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

WITH major_sa AS (
  SELECT sa.id
  FROM public.subject_areas sa
  JOIN public.exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'let-elementary'
    AND sa.slug = 'major'
)
INSERT INTO public.topics (subject_area_id, slug, name, sort_order)
SELECT major_sa.id, 'early-childhood-education', 'Early Childhood Education', 1
FROM major_sa
ON CONFLICT (subject_area_id, slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.topics t
    JOIN public.subject_areas sa ON sa.id = t.subject_area_id
    JOIN public.exam_types et ON et.id = sa.exam_type_id
    WHERE et.slug = 'let-elementary'
      AND sa.slug = 'major'
      AND t.slug = 'early-childhood-education'
  ) THEN
    RAISE EXCEPTION 'LET Elementary specialization topic early-childhood-education was not created';
  END IF;
END $$;
