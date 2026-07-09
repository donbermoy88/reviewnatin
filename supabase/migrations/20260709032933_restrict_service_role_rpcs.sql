-- Restrict service-only maintenance/fulfillment RPCs.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.apply_store_subscription_lifecycle(
  payment_provider, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  entitlement_status, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ,
  TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.fulfill_iap_purchase(UUID, TEXT, TEXT, payment_provider, JSONB)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.fulfill_web_checkout(TEXT, BOOLEAN)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.iap_product_is_subscription(TEXT)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, TEXT, INTEGER, INTERVAL)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.count_rate_limit_attempts(TEXT, TEXT, INTERVAL)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.record_rate_limit_attempt(TEXT, TEXT, BOOLEAN, JSONB)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.purge_old_rate_limit_checks()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.record_auth_login_event(UUID, TEXT, BOOLEAN, TEXT, TEXT, TEXT)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.recompute_readiness_batch(INT)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.recompute_user_readiness_for(UUID, TEXT)
  FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_store_subscription_lifecycle(
  payment_provider, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  entitlement_status, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ,
  TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB
) TO service_role;

GRANT EXECUTE ON FUNCTION public.fulfill_iap_purchase(UUID, TEXT, TEXT, payment_provider, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_web_checkout(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.iap_product_is_subscription(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, TEXT, INTEGER, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_rate_limit_attempts(TEXT, TEXT, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_rate_limit_attempt(TEXT, TEXT, BOOLEAN, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_rate_limit_checks() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_auth_login_event(UUID, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_readiness_batch(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_user_readiness_for(UUID, TEXT) TO service_role;

COMMIT;
