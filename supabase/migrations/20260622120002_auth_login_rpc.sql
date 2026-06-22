-- Client-callable login audit RPC (hashed email only, no PII)

CREATE OR REPLACE FUNCTION public.log_auth_login_attempt(
    p_user_id        UUID,
    p_email_hash     TEXT,
    p_success        BOOLEAN,
    p_device_info    TEXT DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.auth_login_events (
        user_id, email_hash, success, device_info, failure_reason
    ) VALUES (
        p_user_id, p_email_hash, p_success, p_device_info, p_failure_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.log_auth_login_attempt(UUID, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_auth_login_attempt(UUID, TEXT, BOOLEAN, TEXT, TEXT) TO anon, authenticated;
