-- CSE Professional — full Phase 1 topic tree (all four subject areas)
-- Run after catalog_seed.sql: npm run db:seed-cse-topics

INSERT INTO topics (subject_area_id, slug, name, sort_order)
SELECT sa.id, t.slug, t.name, t.ord
FROM subject_areas sa
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional' AND sa.slug = 'verbal'
CROSS JOIN (VALUES
  ('grammar', 'Grammar and Correct Usage', 1),
  ('vocabulary', 'Vocabulary', 2),
  ('paragraph-org', 'Paragraph Organization', 3),
  ('reading-comp', 'Reading Comprehension', 4),
  ('verbal-comprehension', 'Verbal Comprehension', 5)
) AS t(slug, name, ord)
ON CONFLICT (subject_area_id, slug) DO NOTHING;

INSERT INTO topics (subject_area_id, slug, name, sort_order)
SELECT sa.id, t.slug, t.name, t.ord
FROM subject_areas sa
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional' AND sa.slug = 'analytical'
CROSS JOIN (VALUES
  ('word-association', 'Word Association', 1),
  ('assumptions-conclusions', 'Identifying Assumptions and Conclusions', 2),
  ('logic', 'Logic and Reasoning', 3),
  ('data-interpretation', 'Data Interpretation', 4)
) AS t(slug, name, ord)
ON CONFLICT (subject_area_id, slug) DO NOTHING;

INSERT INTO topics (subject_area_id, slug, name, sort_order)
SELECT sa.id, t.slug, t.name, t.ord
FROM subject_areas sa
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional' AND sa.slug = 'numerical'
CROSS JOIN (VALUES
  ('basic-operations', 'Basic Operations', 1),
  ('number-series', 'Number Series', 2),
  ('word-problems', 'Word Problems', 3)
) AS t(slug, name, ord)
ON CONFLICT (subject_area_id, slug) DO NOTHING;

INSERT INTO topics (subject_area_id, slug, name, sort_order)
SELECT sa.id, t.slug, t.name, t.ord
FROM subject_areas sa
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional' AND sa.slug = 'general-info'
CROSS JOIN (VALUES
  ('constitution', 'Philippine Constitution', 1),
  ('ra-6713', 'RA 6713 — Code of Conduct', 2),
  ('peace-human-rights', 'Peace and Human Rights', 3),
  ('environment', 'Environment Management', 4)
) AS t(slug, name, ord)
ON CONFLICT (subject_area_id, slug) DO NOTHING;
