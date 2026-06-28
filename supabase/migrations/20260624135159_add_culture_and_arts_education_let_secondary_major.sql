-- Add Culture and Arts Education as a LET Secondary Area of Specialization major.

WITH major_sa AS (
  SELECT sa.id
  FROM public.subject_areas sa
  JOIN public.exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'let-secondary'
    AND sa.slug = 'major'
)
INSERT INTO public.topics (subject_area_id, slug, name, sort_order)
SELECT major_sa.id, 'culture-and-arts-education', 'Culture and Arts Education', 6
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
  WHEN 'biological-science' THEN 7
  WHEN 'physical-science' THEN 8
  WHEN 'values-education' THEN 9
  WHEN 'mapeh' THEN 10
  WHEN 'tle' THEN 11
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

-- Integrity check. Gated on the exam-type catalog being present so this is a
-- safe no-op on catalog-less builds (e.g. CI `db reset --no-seed`); on a real
-- catalog it still catches a silently-failed topic insert.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.exam_types WHERE slug = 'let-secondary'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.topics t
    JOIN public.subject_areas sa ON sa.id = t.subject_area_id
    JOIN public.exam_types et ON et.id = sa.exam_type_id
    WHERE et.slug = 'let-secondary'
      AND sa.slug = 'major'
      AND t.slug = 'culture-and-arts-education'
  ) THEN
    RAISE EXCEPTION 'LET Secondary major topic culture-and-arts-education was not created';
  END IF;
END $$;
