-- Local db reset seed — canonical catalog data
-- Inlined from supabase/sql/catalog_seed.sql (psql \ir metacommand not supported by supabase CLI batch executor)

-- ReviewNatin Phase 1 catalog seed (canonical — single source of truth)
-- Run AFTER 20260523120000_mvp_schema.sql
-- Used by: supabase db reset (via seed/001_catalog.sql), npm run db:seed-catalog

-- Categories
INSERT INTO exam_categories (id, slug, name, sort_order, is_active) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'civil-service', 'Civil Service', 1, true),
  ('a0000001-0001-4000-8000-000000000002', 'prc', 'PRC Board Exams', 2, true)
ON CONFLICT (slug) DO NOTHING;

-- Exam types
INSERT INTO exam_types (id, category_id, slug, name, description, official_registration_url, is_active, phase) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', 'cse-professional', 'CSE Professional', 'Career Service Examination — Professional Level', 'https://www.csc.gov.ph', true, 1),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', 'cse-subprofessional', 'CSE Subprofessional', 'Career Service Examination — Subprofessional Level', 'https://www.csc.gov.ph', true, 1),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000002', 'let-elementary', 'LET Elementary', 'Licensure Examination for Teachers — Elementary', 'https://online.prc.gov.ph', true, 1),
  ('b0000001-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000002', 'let-secondary', 'LET Secondary', 'Licensure Examination for Teachers — Secondary', 'https://online.prc.gov.ph', true, 1),
  ('b0000001-0001-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000002', 'pnle', 'PNLE (Nursing)', 'Philippine Nurse Licensure Examination', 'https://www.prc.gov.ph', true, 1)
ON CONFLICT (slug) DO NOTHING;

-- Blueprints v1.0.0
INSERT INTO exam_blueprints (exam_type_id, version, effective_date, topic_weights, mock_exam_config, content_targets, official_source_url) VALUES
  ('b0000001-0001-4000-8000-000000000001', '1.0.0', '2026-05-01',
   '{"verbal":25,"analytical":25,"numerical":25,"general-info":25}'::jsonb,
   '{"item_count":170,"duration_seconds":11400,"allow_back_navigation":false}'::jsonb,
   '{"min_questions":500,"min_mocks":3}'::jsonb,
   'https://www.csc.gov.ph'),
  ('b0000001-0001-4000-8000-000000000002', '1.0.0', '2026-05-01',
   '{"verbal":30,"numerical":30,"clerical":20,"general-info":20}'::jsonb,
   '{"item_count":165,"duration_seconds":9600,"allow_back_navigation":false}'::jsonb,
   '{"min_questions":500,"min_mocks":3}'::jsonb,
   'https://www.csc.gov.ph'),
  ('b0000001-0001-4000-8000-000000000003', '1.0.0', '2026-05-01',
   '{"gen-ed":40,"prof-ed":60}'::jsonb,
   '{"components":[{"subject":"gen-ed","item_count":150},{"subject":"prof-ed","item_count":150}]}'::jsonb,
   '{"min_questions":800}'::jsonb,
   'https://www.prc.gov.ph'),
  ('b0000001-0001-4000-8000-000000000004', '1.0.0', '2026-05-01',
   '{"gen-ed":20,"prof-ed":40,"major":40}'::jsonb,
   '{"components":[{"subject":"gen-ed","item_count":150},{"subject":"prof-ed","item_count":150},{"subject":"major","item_count":150}]}'::jsonb,
   '{"min_questions":600}'::jsonb,
   'https://www.prc.gov.ph'),
  ('b0000001-0001-4000-8000-000000000005', '1.0.0', '2026-05-01',
   '{"np1-community":20,"np2-maternal-child":16,"np3-alterations-a":21,"np4-alterations-b":21,"np5-alterations-c":22}'::jsonb,
   '{"item_count":500,"duration_seconds":36000,"min_part_score_display":60}'::jsonb,
   '{"min_questions":1500,"min_mocks":3}'::jsonb,
   'https://www.prc.gov.ph')
ON CONFLICT (exam_type_id, version) DO NOTHING;

-- Subject areas (idempotent per exam + slug)
INSERT INTO subject_areas (exam_type_id, slug, name, weight_percent, sort_order) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'verbal', 'Verbal Ability', 25, 1),
  ('b0000001-0001-4000-8000-000000000001', 'analytical', 'Analytical Ability', 25, 2),
  ('b0000001-0001-4000-8000-000000000001', 'numerical', 'Numerical Ability', 25, 3),
  ('b0000001-0001-4000-8000-000000000001', 'general-info', 'General Information', 25, 4),
  ('b0000001-0001-4000-8000-000000000002', 'verbal', 'Verbal Ability', 30, 1),
  ('b0000001-0001-4000-8000-000000000002', 'numerical', 'Numerical Ability', 30, 2),
  ('b0000001-0001-4000-8000-000000000002', 'clerical', 'Clerical Ability', 20, 3),
  ('b0000001-0001-4000-8000-000000000002', 'general-info', 'General Information', 20, 4),
  ('b0000001-0001-4000-8000-000000000003', 'gen-ed', 'General Education', 40, 1),
  ('b0000001-0001-4000-8000-000000000003', 'prof-ed', 'Professional Education', 60, 2),
  ('b0000001-0001-4000-8000-000000000003', 'major', 'Area of Specialization', 0, 3),
  ('b0000001-0001-4000-8000-000000000004', 'gen-ed', 'General Education', 20, 1),
  ('b0000001-0001-4000-8000-000000000004', 'prof-ed', 'Professional Education', 40, 2),
  ('b0000001-0001-4000-8000-000000000004', 'major', 'Area of Specialization', 40, 3),
  ('b0000001-0001-4000-8000-000000000005', 'np1-community', 'Nursing Practice I — Community Health', 20, 1),
  ('b0000001-0001-4000-8000-000000000005', 'np2-maternal-child', 'Nursing Practice II — Maternal & Child', 16, 2),
  ('b0000001-0001-4000-8000-000000000005', 'np3-alterations-a', 'Nursing Practice III — Alterations A', 21, 3),
  ('b0000001-0001-4000-8000-000000000005', 'np4-alterations-b', 'Nursing Practice IV — Alterations B', 21, 4),
  ('b0000001-0001-4000-8000-000000000005', 'np5-alterations-c', 'Nursing Practice V — Alterations C', 22, 5)
ON CONFLICT (exam_type_id, slug) DO NOTHING;

-- LET Elementary specialization topics
INSERT INTO topics (subject_area_id, slug, name, sort_order)
SELECT sa.id, t.slug, t.name, t.ord
FROM subject_areas sa
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'let-elementary' AND sa.slug = 'major'
CROSS JOIN (VALUES
  ('early-childhood-education', 'Early Childhood Education', 1),
  ('special-needs-education', 'Special Needs Education', 2)
) AS t(slug, name, ord)
ON CONFLICT (subject_area_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Sample topics (CSE Pro verbal)
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

-- Full CSE Professional topic tree (analytical, numerical, general-info):
-- Run supabase/sql/cse_professional_topics.sql or npm run db:seed-cse-topics

-- Subscription products (IAP reference)
INSERT INTO subscription_products (sku, tier, exam_type_id, price_php, duration_days, store) VALUES
  ('com.reviewnatin.exampass.cse_pro', 'exam_pass', 'b0000001-0001-4000-8000-000000000001', 599, 180, 'both'),
  ('com.reviewnatin.exampass.cse_sub', 'exam_pass', 'b0000001-0001-4000-8000-000000000002', 599, 180, 'both'),
  ('com.reviewnatin.exampass.let_elem', 'exam_pass', 'b0000001-0001-4000-8000-000000000003', 699, 180, 'both'),
  ('com.reviewnatin.exampass.let_sec', 'exam_pass', 'b0000001-0001-4000-8000-000000000004', 699, 180, 'both'),
  ('com.reviewnatin.exampass.pnle', 'exam_pass', 'b0000001-0001-4000-8000-000000000005', 799, 180, 'both'),
  ('com.reviewnatin.plus.monthly', 'plus', NULL, 159, 30, 'both'),
  ('com.reviewnatin.plus.six_months', 'plus', NULL, 699, 180, 'both'),
  ('com.reviewnatin.plus.yearly', 'plus', NULL, 1499, 365, 'both')
ON CONFLICT (sku) DO UPDATE SET
  tier = EXCLUDED.tier,
  exam_type_id = EXCLUDED.exam_type_id,
  price_php = EXCLUDED.price_php,
  duration_days = EXCLUDED.duration_days,
  store = EXCLUDED.store;

-- Sample published question (demo — skip if already present)
INSERT INTO questions (topic_id, stem, choices, correct_choice_id, explanation_en, explanation_fil, difficulty, status, is_verified, source_note)
SELECT t.id,
  'ReviewNatin demo: Which branch of government enacts laws in the Philippines?',
  '[{"id":"a","text":"Executive"},{"id":"b","text":"Legislative"},{"id":"c","text":"Judicial"},{"id":"d","text":"Local Government"}]'::jsonb,
  'b',
  'The Legislative branch (Congress) enacts laws under the Philippine Constitution.',
  'Ang Legislative branch (Kongreso) ang gumagawa ng batas sa ilalim ng Konstitusyon.',
  2, 'published', true, 'Original — ReviewNatin demo'
FROM topics t
JOIN subject_areas sa ON sa.id = t.subject_area_id
JOIN exam_types et ON et.id = sa.exam_type_id
WHERE et.slug = 'cse-professional' AND sa.slug = 'verbal' AND t.slug = 'grammar'
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.topic_id = t.id
      AND q.stem = 'ReviewNatin demo: Which branch of government enacts laws in the Philippines?'
  )
LIMIT 1;
