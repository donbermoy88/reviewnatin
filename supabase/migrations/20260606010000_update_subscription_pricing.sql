INSERT INTO subscription_products (sku, tier, exam_type_id, price_php, duration_days, store) VALUES
  ('com.reviewnatin.exampass.cse_pro', 'exam_pass', 'b0000001-0001-4000-8000-000000000001', 599, 180, 'both'),
  ('com.reviewnatin.exampass.cse_sub', 'exam_pass', 'b0000001-0001-4000-8000-000000000002', 599, 180, 'both'),
  ('com.reviewnatin.exampass.let_elem', 'exam_pass', 'b0000001-0001-4000-8000-000000000003', 699, 180, 'both'),
  ('com.reviewnatin.exampass.let_sec', 'exam_pass', 'b0000001-0001-4000-8000-000000000004', 699, 180, 'both'),
  ('com.reviewnatin.exampass.pnle', 'exam_pass', 'b0000001-0001-4000-8000-000000000005', 799, 180, 'both'),
  ('com.reviewnatin.plus.monthly', 'plus', NULL, 159, 30, 'both'),
  ('com.reviewnatin.plus.yearly', 'plus', NULL, 1499, 365, 'both')
ON CONFLICT (sku) DO UPDATE SET
  tier = EXCLUDED.tier,
  exam_type_id = EXCLUDED.exam_type_id,
  price_php = EXCLUDED.price_php,
  duration_days = EXCLUDED.duration_days,
  store = EXCLUDED.store;
