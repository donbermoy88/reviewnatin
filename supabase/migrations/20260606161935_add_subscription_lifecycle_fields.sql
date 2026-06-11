-- Subscription lifecycle metadata for professional Plus management.
-- Additive only: existing entitlement access continues to use expires_at.

DO $$
BEGIN
  CREATE TYPE public.entitlement_status AS ENUM (
    'active',
    'cancelled',
    'expired',
    'billing_retry',
    'grace_period',
    'refunded',
    'revoked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS status public.entitlement_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS auto_renew_status BOOLEAN,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_product_id TEXT,
  ADD COLUMN IF NOT EXISTS original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

UPDATE public.user_entitlements
SET
  current_period_end = COALESCE(current_period_end, expires_at),
  store_product_id = COALESCE(store_product_id, transaction_id),
  last_verified_at = COALESCE(last_verified_at, created_at),
  status = CASE
    WHEN revoked_at IS NOT NULL THEN 'revoked'::public.entitlement_status
    WHEN expires_at IS NOT NULL AND expires_at <= now() THEN 'expired'::public.entitlement_status
    ELSE status
  END;

CREATE INDEX IF NOT EXISTS idx_user_entitlements_status_period
  ON public.user_entitlements(user_id, status, current_period_end);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_original_transaction
  ON public.user_entitlements(original_transaction_id)
  WHERE original_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_entitlements_store_product
  ON public.user_entitlements(store_product_id)
  WHERE store_product_id IS NOT NULL;

COMMENT ON COLUMN public.user_entitlements.status IS 'Store lifecycle status. Access still depends on expires_at/current_period_end until production webhooks are fully wired.';
COMMENT ON COLUMN public.user_entitlements.auto_renew_status IS 'True when store reports subscription will renew; false when user cancelled renewal but access may remain active until period end.';
COMMENT ON COLUMN public.user_entitlements.current_period_end IS 'Current paid access period end from App Store, Google Play, web checkout, or demo grant.';
COMMENT ON COLUMN public.user_entitlements.original_transaction_id IS 'Stable store subscription identifier for future Apple/Google notification reconciliation.';
