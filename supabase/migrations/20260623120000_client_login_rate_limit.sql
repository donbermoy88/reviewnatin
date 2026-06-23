-- Client-callable login rate limit (uses rate_limit_checks via check_auth_rate_limit).
-- Complements Supabase Auth OTP limits and the mobile client lockout (login-lockout.ts).

CREATE OR REPLACE FUNCTION public.check_client_login_rate_limit(p_email_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email_hash IS NULL OR length(trim(p_email_hash)) = 0 THEN
    RETURN true;
  END IF;
  RETURN public.check_auth_rate_limit(
    trim(p_email_hash),
    'login_attempt',
    10,
    interval '15 minutes'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_client_login_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_client_login_rate_limit(TEXT) TO anon, authenticated;
