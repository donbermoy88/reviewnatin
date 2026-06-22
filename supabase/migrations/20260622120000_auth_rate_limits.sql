-- Auth rate limiting RPCs and login event logging
-- Extends rate_limit_checks for OTP send/verify and login attempts.

-- Check rate limit and record attempt atomically. Returns true if allowed.
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
    p_actor_key TEXT,
    p_action    TEXT,
    p_max_attempts INTEGER,
    p_window    INTERVAL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    v_count := public.count_rate_limit_attempts(p_actor_key, p_action, p_window);
    IF v_count >= p_max_attempts THEN
        RETURN false;
    END IF;
    PERFORM public.record_rate_limit_attempt(p_actor_key, p_action, true, NULL);
    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_auth_rate_limit(TEXT, TEXT, INTEGER, INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, TEXT, INTEGER, INTERVAL) TO service_role;

-- Disposable email domain blocklist
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
    domain     TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

INSERT INTO public.blocked_email_domains (domain) VALUES
    ('mailinator.com'),
    ('guerrillamail.com'),
    ('tempmail.com'),
    ('throwaway.email'),
    ('yopmail.com'),
    ('10minutemail.com'),
    ('sharklasers.com'),
    ('trashmail.com')
ON CONFLICT (domain) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_email_domain_blocked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.blocked_email_domains b
        WHERE lower(split_part(p_email, '@', 2)) = b.domain
    );
$$;

REVOKE ALL ON FUNCTION public.is_email_domain_blocked(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_domain_blocked(TEXT) TO service_role;
