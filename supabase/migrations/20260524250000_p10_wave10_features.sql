-- Wave 10: Staff checkout queue RPC

CREATE OR REPLACE FUNCTION public.get_pending_web_checkouts(p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  reference_code TEXT,
  status TEXT,
  provider TEXT,
  amount_php NUMERIC,
  user_email TEXT,
  sku TEXT,
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
