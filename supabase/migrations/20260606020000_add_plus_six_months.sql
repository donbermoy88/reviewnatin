INSERT INTO subscription_products (sku, tier, exam_type_id, price_php, duration_days, store) VALUES
  ('com.reviewnatin.plus.monthly', 'plus', NULL, 159, 30, 'both'),
  ('com.reviewnatin.plus.six_months', 'plus', NULL, 699, 180, 'both'),
  ('com.reviewnatin.plus.yearly', 'plus', NULL, 1499, 365, 'both')
ON CONFLICT (sku) DO UPDATE SET
  tier = EXCLUDED.tier,
  exam_type_id = EXCLUDED.exam_type_id,
  price_php = EXCLUDED.price_php,
  duration_days = EXCLUDED.duration_days,
  store = EXCLUDED.store;
