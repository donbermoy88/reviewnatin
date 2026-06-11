-- Store server-to-server subscription lifecycle ingestion.
-- App-initiated purchase verification creates entitlements; these webhook
-- events keep them correct when the user renews, cancels, enters billing
-- retry/grace, expires, or gets refunded outside the app.

CREATE TABLE IF NOT EXISTS public.store_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider NOT NULL,
  event_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subtype TEXT,
  original_transaction_id TEXT,
  transaction_id TEXT,
  purchase_token TEXT,
  sku TEXT,
  status public.entitlement_status,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  entitlement_id UUID REFERENCES public.user_entitlements(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

ALTER TABLE public.store_subscription_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_store_subscription_events_original
  ON public.store_subscription_events(provider, original_transaction_id, event_time DESC)
  WHERE original_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_subscription_events_purchase_token
  ON public.store_subscription_events(provider, purchase_token, event_time DESC)
  WHERE purchase_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_subscription_events_unprocessed
  ON public.store_subscription_events(provider, created_at DESC)
  WHERE processed_at IS NULL;

CREATE OR REPLACE FUNCTION public.apply_store_subscription_lifecycle(
  p_provider public.payment_provider,
  p_event_id TEXT,
  p_notification_type TEXT,
  p_subtype TEXT DEFAULT NULL,
  p_original_transaction_id TEXT DEFAULT NULL,
  p_transaction_id TEXT DEFAULT NULL,
  p_purchase_token TEXT DEFAULT NULL,
  p_sku TEXT DEFAULT NULL,
  p_status public.entitlement_status DEFAULT NULL,
  p_auto_renew_status BOOLEAN DEFAULT NULL,
  p_current_period_start TIMESTAMPTZ DEFAULT NULL,
  p_current_period_end TIMESTAMPTZ DEFAULT NULL,
  p_grace_period_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_cancellation_reason TEXT DEFAULT NULL,
  p_revoked_at TIMESTAMPTZ DEFAULT NULL,
  p_event_time TIMESTAMPTZ DEFAULT now(),
  p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.store_subscription_events%ROWTYPE;
  v_product public.subscription_products%ROWTYPE;
  v_entitlement_id UUID;
  v_effective_end TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_revoked_at TIMESTAMPTZ;
BEGIN
  IF p_provider IS NULL THEN
    RAISE EXCEPTION 'provider required';
  END IF;
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'event_id required';
  END IF;
  IF p_notification_type IS NULL OR length(trim(p_notification_type)) = 0 THEN
    RAISE EXCEPTION 'notification_type required';
  END IF;

  INSERT INTO public.store_subscription_events (
    provider,
    event_id,
    notification_type,
    subtype,
    original_transaction_id,
    transaction_id,
    purchase_token,
    sku,
    status,
    event_time,
    raw_payload
  )
  VALUES (
    p_provider,
    p_event_id,
    p_notification_type,
    NULLIF(trim(COALESCE(p_subtype, '')), ''),
    NULLIF(trim(COALESCE(p_original_transaction_id, '')), ''),
    NULLIF(trim(COALESCE(p_transaction_id, '')), ''),
    NULLIF(trim(COALESCE(p_purchase_token, '')), ''),
    NULLIF(trim(COALESCE(p_sku, '')), ''),
    p_status,
    COALESCE(p_event_time, now()),
    COALESCE(p_raw_payload, '{}'::jsonb)
  )
  ON CONFLICT (provider, event_id) DO NOTHING
  RETURNING * INTO v_event;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  IF p_status IS NULL THEN
    UPDATE public.store_subscription_events
    SET processed_at = now()
    WHERE id = v_event.id;
    RETURN jsonb_build_object('success', true, 'ignored', true, 'event_id', p_event_id);
  END IF;

  IF p_sku IS NOT NULL THEN
    SELECT * INTO v_product
    FROM public.subscription_products
    WHERE sku = p_sku;
  END IF;

  v_effective_end := COALESCE(p_grace_period_expires_at, p_current_period_end);
  v_revoked_at := CASE
    WHEN p_status IN ('refunded', 'revoked') THEN COALESCE(p_revoked_at, p_event_time, now())
    ELSE p_revoked_at
  END;
  v_expires_at := CASE
    WHEN p_status IN ('refunded', 'revoked') THEN COALESCE(v_revoked_at, now())
    WHEN p_status = 'expired' THEN COALESCE(p_current_period_end, p_event_time, now())
    ELSE v_effective_end
  END;

  WITH candidate AS (
    SELECT ue.id
    FROM public.user_entitlements ue
    WHERE ue.source = 'iap'
      AND (
        (p_original_transaction_id IS NOT NULL AND ue.original_transaction_id = p_original_transaction_id)
        OR (p_transaction_id IS NOT NULL AND ue.transaction_id = p_transaction_id)
        OR (p_purchase_token IS NOT NULL AND ue.original_transaction_id = p_purchase_token)
        OR (p_purchase_token IS NOT NULL AND ue.transaction_id = p_purchase_token)
      )
    ORDER BY ue.created_at DESC
    LIMIT 1
  )
  UPDATE public.user_entitlements ue
  SET
    product_id = COALESCE(v_product.id, ue.product_id),
    exam_type_id = COALESCE(v_product.exam_type_id, ue.exam_type_id),
    expires_at = COALESCE(v_expires_at, ue.expires_at),
    status = p_status,
    auto_renew_status = COALESCE(p_auto_renew_status, ue.auto_renew_status),
    current_period_start = COALESCE(p_current_period_start, ue.current_period_start),
    current_period_end = COALESCE(p_current_period_end, ue.current_period_end),
    store_product_id = COALESCE(p_sku, ue.store_product_id),
    original_transaction_id = COALESCE(p_original_transaction_id, p_purchase_token, ue.original_transaction_id),
    cancellation_reason = CASE
      WHEN p_status IN ('cancelled', 'billing_retry', 'expired', 'refunded', 'revoked')
        THEN COALESCE(p_cancellation_reason, ue.cancellation_reason)
      ELSE NULL
    END,
    cancelled_at = CASE
      WHEN p_status = 'cancelled' THEN COALESCE(ue.cancelled_at, p_event_time, now())
      WHEN p_status = 'active' THEN NULL
      ELSE ue.cancelled_at
    END,
    grace_period_expires_at = CASE
      WHEN p_status = 'grace_period' THEN COALESCE(p_grace_period_expires_at, ue.grace_period_expires_at)
      ELSE p_grace_period_expires_at
    END,
    revoked_at = v_revoked_at,
    last_verified_at = now()
  FROM candidate
  WHERE ue.id = candidate.id
  RETURNING ue.id INTO v_entitlement_id;

  UPDATE public.store_subscription_events
  SET
    entitlement_id = v_entitlement_id,
    processed_at = now()
  WHERE id = v_event.id;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', p_event_id,
    'entitlement_id', v_entitlement_id,
    'entitlement_found', v_entitlement_id IS NOT NULL,
    'status', p_status,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_store_subscription_lifecycle(
  public.payment_provider,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.entitlement_status,
  BOOLEAN,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  TEXT,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.apply_store_subscription_lifecycle(
  public.payment_provider,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.entitlement_status,
  BOOLEAN,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  TEXT,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  JSONB
) TO service_role;
