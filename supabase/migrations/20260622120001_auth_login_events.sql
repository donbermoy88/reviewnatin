-- Login activity logging for security audit trail

CREATE TABLE IF NOT EXISTS public.auth_login_events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_hash   TEXT NOT NULL,
    success      BOOLEAN NOT NULL DEFAULT false,
    device_info  TEXT,
    ip_hash      TEXT,
    failure_reason TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_login_events_user_idx
    ON public.auth_login_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_login_events_email_hash_idx
    ON public.auth_login_events (email_hash, created_at DESC);

ALTER TABLE public.auth_login_events ENABLE ROW LEVEL SECURITY;

-- Only service role inserts; staff can read via admin later.
CREATE OR REPLACE FUNCTION public.record_auth_login_event(
    p_user_id        UUID,
    p_email_hash     TEXT,
    p_success        BOOLEAN,
    p_device_info    TEXT DEFAULT NULL,
    p_ip_hash        TEXT DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.auth_login_events (
        user_id, email_hash, success, device_info, ip_hash, failure_reason
    ) VALUES (
        p_user_id, p_email_hash, p_success, p_device_info, p_ip_hash, p_failure_reason
    );
$$;

REVOKE ALL ON FUNCTION public.record_auth_login_event(UUID, TEXT, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_auth_login_event(UUID, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;
