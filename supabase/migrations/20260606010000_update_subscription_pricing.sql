-- Update subscription pricing / product catalog.
--
-- exam_pass products FK-reference exam_types, whose rows live in seed data
-- (seed/001_catalog.sql) which loads AFTER migrations. On the remote database
-- those rows already existed when this migration first ran, but a from-scratch
-- rebuild (supabase db reset / start) applies migrations before seed, so a plain
-- INSERT here fails the foreign key. Insert exam_pass rows only when their
-- exam_type is already present; plus rows (NULL exam_type) always insert. The
-- seed file re-asserts the full catalog afterwards, so the end state is
-- identical and this is reproducible on a virgin database.
INSERT INTO subscription_products (sku, tier, exam_type_id, price_php, duration_days, store)
SELECT v.sku, v.tier::subscription_tier, v.exam_type_id, v.price_php, v.duration_days, v.store
FROM (
  VALUES
    ('com.reviewnatin.exampass.cse_pro', 'exam_pass', 'b0000001-0001-4000-8000-000000000001'::uuid, 599, 180, 'both'),
    ('com.reviewnatin.exampass.cse_sub', 'exam_pass', 'b0000001-0001-4000-8000-000000000002'::uuid, 599, 180, 'both'),
    ('com.reviewnatin.exampass.let_elem', 'exam_pass', 'b0000001-0001-4000-8000-000000000003'::uuid, 699, 180, 'both'),
    ('com.reviewnatin.exampass.let_sec', 'exam_pass', 'b0000001-0001-4000-8000-000000000004'::uuid, 699, 180, 'both'),
    ('com.reviewnatin.exampass.pnle', 'exam_pass', 'b0000001-0001-4000-8000-000000000005'::uuid, 799, 180, 'both'),
    ('com.reviewnatin.plus.monthly', 'plus', NULL::uuid, 159, 30, 'both'),
    ('com.reviewnatin.plus.yearly', 'plus', NULL::uuid, 1499, 365, 'both')
) AS v(sku, tier, exam_type_id, price_php, duration_days, store)
WHERE v.exam_type_id IS NULL
   OR EXISTS (SELECT 1 FROM exam_types et WHERE et.id = v.exam_type_id)
ON CONFLICT (sku) DO UPDATE SET
  tier = EXCLUDED.tier,
  exam_type_id = EXCLUDED.exam_type_id,
  price_php = EXCLUDED.price_php,
  duration_days = EXCLUDED.duration_days,
  store = EXCLUDED.store;
