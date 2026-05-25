-- Wave 12: Marketing checkout attribution patch, IAP tier lookup helper

-- Allow marketing site to attach UTM/source to an existing checkout ref (anon-safe: ref-only)
CREATE OR REPLACE FUNCTION public.patch_web_checkout_attribution(
  p_reference_code TEXT,
  p_utm_source TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT := upper(trim(p_reference_code));
  v_updated INT;
BEGIN
  IF v_ref IS NULL OR v_ref = '' OR v_ref !~ '^RN-[A-Z0-9]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_reference');
  END IF;

  UPDATE web_checkout_sessions
  SET
    utm_source = COALESCE(NULLIF(trim(p_utm_source), ''), utm_source),
    source = COALESCE(NULLIF(trim(p_source), ''), source)
  WHERE reference_code = v_ref
    AND status IN ('pending', 'submitted')
    AND expires_at > now();

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', v_updated > 0,
    'updated', v_updated > 0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patch_web_checkout_attribution(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Resolve whether a SKU is a subscription (for Google Play API path selection)
CREATE OR REPLACE FUNCTION public.iap_product_is_subscription(p_sku TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier = 'plus' FROM subscription_products WHERE sku = p_sku LIMIT 1),
    p_sku LIKE '%plus.%' OR p_sku LIKE '%monthly%' OR p_sku LIKE '%yearly%'
  );
$$;

GRANT EXECUTE ON FUNCTION public.iap_product_is_subscription(TEXT) TO service_role;
