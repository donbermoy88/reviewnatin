-- Rate limiting infrastructure
-- 2026-05-29 — Phase 18 of the pre-publication hardening pass.
--
-- Stores rolling-window counters for sensitive operations (IAP verify,
-- admin login attempts, password resets, etc.). Each row represents one
-- attempt by a given actor key inside a given action namespace.

CREATE TABLE IF NOT EXISTS public.rate_limit_checks (
    id            BIGSERIAL PRIMARY KEY,
    actor_key     TEXT        NOT NULL,
    action        TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    succeeded     BOOLEAN     NOT NULL DEFAULT true,
    metadata      JSONB
);

CREATE INDEX IF NOT EXISTS rate_limit_checks_lookup_idx
    ON public.rate_limit_checks (action, actor_key, created_at DESC);

CREATE INDEX IF NOT EXISTS rate_limit_checks_cleanup_idx
    ON public.rate_limit_checks (created_at);

ALTER TABLE public.rate_limit_checks ENABLE ROW LEVEL SECURITY;

-- No client roles read or write this table directly — only service role.
-- Block all anon/authenticated access. (RLS is enabled, no policy = deny.)

-- Helper: count attempts inside a sliding window.
CREATE OR REPLACE FUNCTION public.count_rate_limit_attempts(
    p_actor_key TEXT,
    p_action    TEXT,
    p_window    INTERVAL
) RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.rate_limit_checks
    WHERE actor_key = p_actor_key
      AND action    = p_action
      AND created_at > (now() - p_window);
$$;

-- Helper: record an attempt.
CREATE OR REPLACE FUNCTION public.record_rate_limit_attempt(
    p_actor_key TEXT,
    p_action    TEXT,
    p_succeeded BOOLEAN DEFAULT true,
    p_metadata  JSONB   DEFAULT NULL
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.rate_limit_checks (actor_key, action, succeeded, metadata)
    VALUES (p_actor_key, p_action, p_succeeded, p_metadata);
$$;

-- Optional housekeeping: clean rows older than 7 days. Schedule via cron.
CREATE OR REPLACE FUNCTION public.purge_old_rate_limit_checks() RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.rate_limit_checks
    WHERE created_at < (now() - INTERVAL '7 days');
$$;

REVOKE ALL ON FUNCTION public.count_rate_limit_attempts(TEXT, TEXT, INTERVAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_rate_limit_attempt(TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_rate_limit_checks() FROM PUBLIC;
