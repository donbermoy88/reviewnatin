-- Fix grant_demo_entitlement: ON CONFLICT requires a unique constraint (none existed)

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
  VALUES (
    auth.uid(),
    p_product_id,
    p_exam_type_id,
    'demo',
    now() + interval '180 days'
  );
END;
$$;
