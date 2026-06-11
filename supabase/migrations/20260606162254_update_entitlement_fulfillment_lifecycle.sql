CREATE OR REPLACE FUNCTION public.fulfill_iap_purchase(
  p_user_id UUID,
  p_sku TEXT,
  p_transaction_id TEXT,
  p_provider payment_provider,
  p_raw_receipt JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product subscription_products%ROWTYPE;
  v_expires TIMESTAMPTZ;
  v_entitlement_id UUID;
  v_original_transaction_id TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;
  IF p_transaction_id IS NULL OR length(trim(p_transaction_id)) = 0 THEN
    RAISE EXCEPTION 'transaction_id required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM payment_transactions pt
    WHERE pt.store_transaction_id = p_transaction_id
      AND pt.provider = p_provider
      AND pt.status = 'completed'
  ) THEN
    UPDATE user_entitlements
    SET last_verified_at = now()
    WHERE transaction_id = p_transaction_id;
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  SELECT * INTO v_product FROM subscription_products WHERE sku = p_sku;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown SKU: %', p_sku;
  END IF;

  v_expires := CASE
    WHEN v_product.duration_days IS NULL THEN NULL
    ELSE now() + (v_product.duration_days || ' days')::interval
  END;

  v_original_transaction_id := COALESCE(
    NULLIF(p_raw_receipt->>'originalTransactionId', ''),
    NULLIF(p_raw_receipt->>'original_transaction_id', ''),
    p_transaction_id
  );

  INSERT INTO payment_transactions (
    user_id, product_id, amount_php, provider, status, raw_receipt, store_transaction_id
  )
  VALUES (
    p_user_id, v_product.id, v_product.price_php, p_provider, 'completed', p_raw_receipt, p_transaction_id
  );

  INSERT INTO user_entitlements (
    user_id,
    product_id,
    exam_type_id,
    source,
    transaction_id,
    expires_at,
    status,
    auto_renew_status,
    current_period_start,
    current_period_end,
    store_product_id,
    original_transaction_id,
    last_verified_at
  )
  VALUES (
    p_user_id,
    v_product.id,
    v_product.exam_type_id,
    'iap',
    p_transaction_id,
    v_expires,
    'active',
    CASE WHEN v_product.tier = 'plus' THEN true ELSE false END,
    now(),
    v_expires,
    p_sku,
    v_original_transaction_id,
    now()
  )
  ON CONFLICT (transaction_id) WHERE transaction_id IS NOT NULL DO UPDATE
    SET
      expires_at = EXCLUDED.expires_at,
      status = 'active',
      auto_renew_status = EXCLUDED.auto_renew_status,
      current_period_end = EXCLUDED.current_period_end,
      store_product_id = EXCLUDED.store_product_id,
      original_transaction_id = EXCLUDED.original_transaction_id,
      revoked_at = NULL,
      last_verified_at = now()
  RETURNING id INTO v_entitlement_id;

  RETURN jsonb_build_object(
    'success', true,
    'entitlement_id', v_entitlement_id,
    'tier', v_product.tier,
    'sku', v_product.sku,
    'expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_iap_purchase(UUID, TEXT, TEXT, payment_provider, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_iap_purchase(UUID, TEXT, TEXT, payment_provider, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.grant_demo_entitlement(
  p_product_id UUID,
  p_exam_type_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires TIMESTAMPTZ := now() + interval '180 days';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF coalesce(current_setting('app.demo_entitlements_enabled', true), 'false') <> 'true' THEN
    RAISE EXCEPTION 'Demo entitlements are disabled on this environment';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM subscription_products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Invalid product';
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_entitlements ue
    WHERE ue.user_id = auth.uid()
      AND ue.product_id = p_product_id
      AND (ue.exam_type_id IS NOT DISTINCT FROM p_exam_type_id)
      AND (COALESCE(ue.grace_period_expires_at, ue.current_period_end, ue.expires_at) IS NULL
        OR COALESCE(ue.grace_period_expires_at, ue.current_period_end, ue.expires_at) > now())
      AND ue.status NOT IN ('refunded', 'revoked', 'expired')
  ) THEN
    RETURN;
  END IF;

  INSERT INTO user_entitlements (
    user_id,
    product_id,
    exam_type_id,
    source,
    expires_at,
    status,
    auto_renew_status,
    current_period_start,
    current_period_end,
    last_verified_at
  )
  VALUES (
    auth.uid(),
    p_product_id,
    p_exam_type_id,
    'demo',
    v_expires,
    'active',
    false,
    now(),
    v_expires,
    now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_demo_entitlement(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.fulfill_web_checkout(
  p_reference_code TEXT,
  p_auto_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session web_checkout_sessions%ROWTYPE;
  v_product subscription_products%ROWTYPE;
  v_expires TIMESTAMPTZ;
  v_entitlement_id UUID;
  v_tx_id TEXT;
BEGIN
  SELECT * INTO v_session
  FROM web_checkout_sessions
  WHERE reference_code = p_reference_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'checkout_not_found';
  END IF;

  IF v_session.status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  IF v_session.status = 'expired' OR v_session.expires_at < now() THEN
    UPDATE web_checkout_sessions SET status = 'expired' WHERE id = v_session.id;
    RAISE EXCEPTION 'checkout_expired';
  END IF;

  IF NOT p_auto_demo AND v_session.status <> 'submitted' THEN
    RAISE EXCEPTION 'checkout_not_submitted';
  END IF;

  SELECT * INTO v_product FROM subscription_products WHERE id = v_session.product_id;

  v_expires := CASE
    WHEN v_product.duration_days IS NULL THEN NULL
    ELSE now() + (v_product.duration_days || ' days')::interval
  END;

  v_tx_id := 'web:' || v_session.reference_code;

  IF EXISTS (
    SELECT 1 FROM payment_transactions pt
    WHERE pt.store_transaction_id = v_tx_id AND pt.provider = v_session.provider
  ) THEN
    UPDATE web_checkout_sessions SET status = 'paid', paid_at = now() WHERE id = v_session.id;
    UPDATE user_entitlements SET last_verified_at = now() WHERE transaction_id = v_tx_id;
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO payment_transactions (
    user_id, product_id, amount_php, provider, status, raw_receipt, store_transaction_id
  )
  VALUES (
    v_session.user_id,
    v_product.id,
    v_session.amount_php,
    v_session.provider,
    'completed',
    jsonb_build_object('reference_code', v_session.reference_code, 'auto_demo', p_auto_demo),
    v_tx_id
  );

  INSERT INTO user_entitlements (
    user_id,
    product_id,
    exam_type_id,
    source,
    transaction_id,
    expires_at,
    status,
    auto_renew_status,
    current_period_start,
    current_period_end,
    store_product_id,
    original_transaction_id,
    last_verified_at
  )
  VALUES (
    v_session.user_id,
    v_product.id,
    v_product.exam_type_id,
    'web_' || v_session.provider::text,
    v_tx_id,
    v_expires,
    'active',
    false,
    now(),
    v_expires,
    v_product.sku,
    v_tx_id,
    now()
  )
  ON CONFLICT (transaction_id) WHERE transaction_id IS NOT NULL DO UPDATE
    SET
      expires_at = EXCLUDED.expires_at,
      status = 'active',
      auto_renew_status = false,
      current_period_end = EXCLUDED.current_period_end,
      store_product_id = EXCLUDED.store_product_id,
      original_transaction_id = EXCLUDED.original_transaction_id,
      revoked_at = NULL,
      last_verified_at = now()
  RETURNING id INTO v_entitlement_id;

  UPDATE web_checkout_sessions
  SET status = 'paid', paid_at = now()
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'success', true,
    'entitlement_id', v_entitlement_id,
    'sku', v_product.sku,
    'expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_web_checkout(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_web_checkout(TEXT, BOOLEAN) TO service_role;
