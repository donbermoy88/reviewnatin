-- Wave 11: Checkout attribution, PasaPath week view, staff checkout source column

ALTER TABLE web_checkout_sessions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'mobile_app',
  ADD COLUMN IF NOT EXISTS utm_source TEXT;

COMMENT ON COLUMN web_checkout_sessions.source IS 'Checkout origin: mobile_app, mobile_subscribe, marketing, etc.';
COMMENT ON COLUMN web_checkout_sessions.utm_source IS 'Optional UTM / campaign source for attribution';

-- ---------------------------------------------------------------------------
-- Web checkout: optional source + utm on session create
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_web_checkout_session(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_web_checkout_session(
  p_sku TEXT,
  p_provider TEXT,
  p_source TEXT DEFAULT 'mobile_app',
  p_utm_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product subscription_products%ROWTYPE;
  v_ref TEXT;
  v_session_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_provider NOT IN ('gcash', 'maya') THEN
    RAISE EXCEPTION 'invalid_provider';
  END IF;

  SELECT * INTO v_product FROM subscription_products WHERE sku = p_sku;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown_sku';
  END IF;

  v_ref := 'RN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO web_checkout_sessions (
    user_id, product_id, provider, reference_code, amount_php, source, utm_source
  )
  VALUES (
    v_user_id,
    v_product.id,
    p_provider::payment_provider,
    v_ref,
    v_product.price_php,
    COALESCE(NULLIF(trim(p_source), ''), 'mobile_app'),
    NULLIF(trim(p_utm_source), '')
  )
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'reference_code', v_ref,
    'amount_php', v_product.price_php,
    'sku', v_product.sku,
    'tier', v_product.tier,
    'provider', p_provider,
    'source', COALESCE(NULLIF(trim(p_source), ''), 'mobile_app'),
    'utm_source', NULLIF(trim(p_utm_source), ''),
    'expires_at', (now() + interval '24 hours')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_web_checkout_session(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Staff checkout queue (includes attribution)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_pending_web_checkouts(INT);

CREATE OR REPLACE FUNCTION public.get_pending_web_checkouts(p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  reference_code TEXT,
  status TEXT,
  provider TEXT,
  amount_php NUMERIC,
  user_email TEXT,
  sku TEXT,
  source TEXT,
  utm_source TEXT,
  created_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.reference_code,
    w.status::text,
    w.provider::text,
    w.amount_php,
    u.email,
    sp.sku,
    w.source,
    w.utm_source,
    w.created_at,
    w.submitted_at
  FROM web_checkout_sessions w
  JOIN users u ON u.id = w.user_id
  JOIN subscription_products sp ON sp.id = w.product_id
  WHERE w.status IN ('pending', 'submitted')
    AND w.expires_at > now()
  ORDER BY w.submitted_at DESC NULLS LAST, w.created_at DESC
  LIMIT greatest(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_web_checkouts(INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- PasaPath: 7-day progress strip (Manila calendar days, ending today)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_pasapath_week(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
  v_start DATE := v_today - 6;
  v_days JSONB := '[]'::jsonb;
  v_date DATE;
  v_plan JSONB;
  v_tasks JSONB;
  v_total INT;
  v_done INT;
  v_task JSONB;
  v_today_plan JSONB;
BEGIN
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN NULL; END IF;

  v_today_plan := public.get_today_pasapath(p_exam_slug);

  FOR v_date IN
    SELECT d::date
    FROM generate_series(v_start, v_today, interval '1 day') AS d
    ORDER BY d
  LOOP
    v_plan := NULL;
    v_total := 0;
    v_done := 0;

    IF v_date = v_today AND v_today_plan IS NOT NULL THEN
      v_plan := v_today_plan;
    ELSE
      SELECT sp.plan_json INTO v_plan
      FROM study_plans sp
      WHERE sp.user_id = v_user_id
        AND sp.exam_type_id = v_exam_id
        AND sp.is_active = true
        AND (sp.plan_json->>'date')::date = v_date
      ORDER BY sp.generated_at DESC
      LIMIT 1;
    END IF;

    IF v_plan IS NOT NULL AND v_plan ? 'tasks' THEN
      v_tasks := v_plan->'tasks';
      v_total := jsonb_array_length(v_tasks);
      FOR v_task IN SELECT * FROM jsonb_array_elements(v_tasks)
      LOOP
        IF COALESCE((v_task->>'completed')::boolean, false) THEN
          v_done := v_done + 1;
        END IF;
      END LOOP;
    END IF;

    v_days := v_days || jsonb_build_array(
      jsonb_build_object(
        'date', v_date::text,
        'is_today', v_date = v_today,
        'daily_minutes', v_plan->'daily_minutes',
        'days_until_exam', v_plan->'days_until_exam',
        'readiness_hint', v_plan->'readiness_hint',
        'tasks_total', v_total,
        'tasks_completed', v_done,
        'tasks', CASE WHEN v_date = v_today THEN v_plan->'tasks' ELSE NULL END
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'exam_slug', p_exam_slug,
    'start_date', v_start::text,
    'end_date', v_today::text,
    'days', v_days
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pasapath_week(TEXT) TO authenticated;
