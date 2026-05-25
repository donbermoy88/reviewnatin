-- P2 Payments: server-side IAP fulfillment, paywall enforcement in RPCs

-- ---------------------------------------------------------------------------
-- Payment idempotency
-- ---------------------------------------------------------------------------

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS store_transaction_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tx_store_id
  ON payment_transactions (store_transaction_id, provider)
  WHERE store_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_tx
  ON user_entitlements (transaction_id)
  WHERE transaction_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Fulfill IAP (service_role / edge function only)
-- ---------------------------------------------------------------------------

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

  INSERT INTO payment_transactions (
    user_id, product_id, amount_php, provider, status, raw_receipt, store_transaction_id
  )
  VALUES (
    p_user_id, v_product.id, v_product.price_php, p_provider, 'completed', p_raw_receipt, p_transaction_id
  );

  INSERT INTO user_entitlements (user_id, product_id, exam_type_id, source, transaction_id, expires_at)
  VALUES (
    p_user_id,
    v_product.id,
    v_product.exam_type_id,
    'iap',
    p_transaction_id,
    v_expires
  )
  ON CONFLICT (transaction_id) WHERE transaction_id IS NOT NULL DO UPDATE
    SET expires_at = EXCLUDED.expires_at
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

-- ---------------------------------------------------------------------------
-- Demo entitlements: revoke on production (re-enable locally via scripts/enable-demo-iap.mjs)
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.grant_demo_entitlement(UUID, UUID) FROM authenticated;

CREATE OR REPLACE FUNCTION public.grant_demo_entitlement(
  p_product_id UUID,
  p_exam_type_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      AND (ue.expires_at IS NULL OR ue.expires_at > now())
  ) THEN
    RETURN;
  END IF;

  INSERT INTO user_entitlements (user_id, product_id, exam_type_id, source, expires_at)
  VALUES (auth.uid(), p_product_id, p_exam_type_id, 'demo', now() + interval '180 days');
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_demo_entitlement(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Usage limits (client UX — enforcement is in content RPCs)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_usage_limits(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_premium BOOLEAN := false;
  v_answered_today INT := 0;
  v_mini_mock_used BOOLEAN := false;
BEGIN
  SELECT id INTO v_exam_type_id FROM exam_types WHERE slug = p_exam_slug AND is_active LIMIT 1;

  IF auth.uid() IS NULL OR v_exam_type_id IS NULL THEN
    RETURN jsonb_build_object(
      'daily_questions_limit', 20,
      'daily_questions_used', 0,
      'daily_questions_remaining', 20,
      'is_premium', false,
      'mistake_days', 7,
      'mini_mock_available', true
    );
  END IF;

  v_premium := user_has_content_access(v_exam_type_id);

  IF NOT v_premium THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    SELECT EXISTS (
      SELECT 1
      FROM quiz_sessions qs
      JOIN mock_exams me ON me.id = qs.mock_exam_id
      WHERE qs.user_id = auth.uid()
        AND qs.mode = 'mock'
        AND me.exam_type_id = v_exam_type_id
        AND lower(me.title) LIKE '%mini%'
        AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila')
    ) INTO v_mini_mock_used;
  END IF;

  RETURN jsonb_build_object(
    'daily_questions_limit', CASE WHEN v_premium THEN NULL ELSE 20 END,
    'daily_questions_used', v_answered_today,
    'daily_questions_remaining', CASE WHEN v_premium THEN NULL ELSE greatest(0, 20 - v_answered_today) END,
    'is_premium', v_premium,
    'mistake_days', CASE WHEN v_premium THEN NULL ELSE 7 END,
    'mini_mock_available', CASE WHEN v_premium THEN true ELSE NOT v_mini_mock_used END,
    'mock_preview_items', CASE WHEN v_premium THEN NULL ELSE 10 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_limits(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Practice questions: enforce 20/day free tier (authenticated)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_practice_questions(TEXT, INT, TEXT);

CREATE OR REPLACE FUNCTION public.get_practice_questions(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 12,
  p_topic_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_answered_today INT := 0;
  v_effective_limit INT;
BEGIN
  SELECT et.id INTO v_exam_type_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active;

  v_effective_limit := greatest(p_limit, 1);

  IF auth.uid() IS NOT NULL AND v_exam_type_id IS NOT NULL
     AND NOT user_has_content_access(v_exam_type_id) THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    IF v_answered_today >= 20 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;

    v_effective_limit := least(v_effective_limit, greatest(20 - v_answered_today, 0));
    IF v_effective_limit <= 0 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE q.status = 'published'
    AND et.slug = p_exam_slug
    AND et.is_active = true
    AND (p_topic_slug IS NULL OR t.slug = p_topic_slug)
  ORDER BY q.created_at
  LIMIT v_effective_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_questions(TEXT, INT, TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mock exams: preview (10Q) + mini-mock 1/week for free tier
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_mock_exam_questions(UUID);

CREATE OR REPLACE FUNCTION public.get_mock_exam_questions(p_mock_exam_id UUID)
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT,
  sort_order INT,
  is_preview BOOLEAN,
  preview_limit INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_item_count INT;
  v_title TEXT;
  v_premium BOOLEAN;
  v_is_mini BOOLEAN;
  v_limit INT;
BEGIN
  SELECT me.exam_type_id, me.item_count, me.title
  INTO v_exam_type_id, v_item_count, v_title
  FROM mock_exams me
  WHERE me.id = p_mock_exam_id AND me.is_active;

  IF v_exam_type_id IS NULL THEN
    RETURN;
  END IF;

  v_premium := auth.uid() IS NOT NULL AND user_has_content_access(v_exam_type_id);
  v_is_mini := lower(v_title) LIKE '%mini%';

  IF v_premium THEN
    v_limit := v_item_count;
  ELSIF v_is_mini THEN
    IF auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM quiz_sessions qs
      JOIN mock_exams me ON me.id = qs.mock_exam_id
      WHERE qs.user_id = auth.uid()
        AND qs.mode = 'mock'
        AND me.exam_type_id = v_exam_type_id
        AND lower(me.title) LIKE '%mini%'
        AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila')
    ) THEN
      RAISE EXCEPTION 'mini_mock_weekly_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows one mini-mock per week';
    END IF;
    v_limit := v_item_count;
  ELSE
    v_limit := least(v_item_count, 10);
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug,
    meq.sort_order,
    (NOT v_premium AND NOT v_is_mini) AS is_preview,
    CASE WHEN v_premium OR v_is_mini THEN NULL ELSE 10 END AS preview_limit
  FROM mock_exam_questions meq
  JOIN questions q ON q.id = meq.question_id
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE meq.mock_exam_id = p_mock_exam_id
    AND q.status = 'published'
  ORDER BY meq.sort_order
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mock_exam_questions(UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mistake bank: 7-day window enforced server-side for free tier
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mistake_bank(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 50,
  p_days_back INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question_id UUID,
  stem TEXT,
  subject_name TEXT,
  topic_name TEXT,
  times_wrong INT,
  last_wrong_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH exam AS (
    SELECT et.id AS exam_type_id
    FROM exam_types et
    WHERE et.slug = p_exam_slug AND et.is_active
    LIMIT 1
  ),
  effective_days AS (
    SELECT CASE
      WHEN auth.uid() IS NULL THEN p_days_back
      WHEN user_has_content_access((SELECT exam_type_id FROM exam)) THEN p_days_back
      ELSE 7
    END AS days_back
  )
  SELECT
    ml.id,
    ml.question_id,
    q.stem,
    sa.name AS subject_name,
    t.name AS topic_name,
    ml.times_wrong,
    ml.last_wrong_at,
    ml.next_review_at
  FROM mistake_logs ml
  JOIN questions q ON q.id = ml.question_id AND q.status = 'published'
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  CROSS JOIN effective_days ed
  WHERE ml.user_id = auth.uid()
    AND ml.mastered_at IS NULL
    AND et.slug = p_exam_slug
    AND et.is_active = true
    AND (ed.days_back IS NULL OR ml.last_wrong_at >= now() - (ed.days_back || ' days')::interval)
  ORDER BY ml.last_wrong_at DESC
  LIMIT greatest(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_mistake_bank(TEXT, INT, INT) TO authenticated;
