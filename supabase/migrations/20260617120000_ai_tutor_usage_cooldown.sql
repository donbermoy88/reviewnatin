-- AI tutor usage table + per-user cooldown support.
--
-- Two things this migration guarantees (both idempotent / non-destructive):
--   1. The ai_tutor_usage table exists. It is defined in the p5 wave-5 migration
--      (20260524200000) but was found missing in production (migration-history
--      divergence), which silently disabled the daily message cap. Re-assert it.
--   2. A last_message_at column for the per-user request cooldown (anti-burst /
--      abuse protection) added by the OpenAI GPT-4o-mini tutor.
--
-- The function reads/writes this table with the service role, so RLS is only a
-- defensive SELECT-own policy for any direct client access.

CREATE TABLE IF NOT EXISTS public.ai_tutor_usage (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ai_tutor_usage ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

ALTER TABLE public.ai_tutor_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_tutor_usage_own" ON public.ai_tutor_usage;
CREATE POLICY "ai_tutor_usage_own" ON public.ai_tutor_usage
  FOR SELECT USING (auth.uid() = user_id);
