-- Client-callable OTP resend rate limit (uses rate_limit_checks via check_auth_rate_limit).
-- Server-enforces the resend cap that was previously only enforced client-side
-- (verify-email.tsx MAX_RESENDS_PER_DAY). Complements Supabase Auth's per-IP
-- email_sent limit by throttling per hashed email address.

CREATE OR REPLACE FUNCTION public.check_client_otp_resend_rate_limit(p_email_hash TEXT)
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
    'otp_send',
    5,
    interval '1 day'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_client_otp_resend_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_client_otp_resend_rate_limit(TEXT) TO anon, authenticated;
