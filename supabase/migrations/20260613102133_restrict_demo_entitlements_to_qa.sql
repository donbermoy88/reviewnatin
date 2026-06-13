-- Restrict dev/demo entitlement grants to explicit QA accounts by default.
-- This keeps the public authenticated grant RPC usable for simulator QA while
-- avoiding a broad free-Plus path if the demo flag is accidentally enabled on a
-- shared database.

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
  v_email TEXT;
  v_allow_all BOOLEAN := coalesce(current_setting('app.demo_entitlements_allow_all', true), 'false') = 'true';
  v_allowed_emails TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF coalesce(current_setting('app.demo_entitlements_enabled', true), 'false') <> 'true' THEN
    RAISE EXCEPTION 'Demo entitlements are disabled on this environment';
  END IF;

  SELECT lower(u.email)
  INTO v_email
  FROM public.users u
  WHERE u.id = auth.uid();

  SELECT coalesce(array_agg(trim(email)), ARRAY[]::TEXT[])
  INTO v_allowed_emails
  FROM unnest(string_to_array(lower(coalesce(current_setting('app.demo_entitlement_emails', true), '')), ',')) AS email
  WHERE trim(email) <> '';

  IF NOT v_allow_all AND NOT (v_email = ANY(v_allowed_emails)) THEN
    RAISE EXCEPTION 'Demo entitlements are restricted to QA accounts';
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
