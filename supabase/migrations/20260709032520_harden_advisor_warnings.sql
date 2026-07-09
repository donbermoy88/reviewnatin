-- Follow-up Security Advisor hardening.
--
-- These changes preserve the app's current behavior while removing broad
-- listing/RPC surfaces flagged by Supabase advisors.

BEGIN;

-- Public buckets can still serve objects by public URL without a broad
-- storage.objects SELECT policy. The app uses getPublicUrl(), not list().
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read question images" ON storage.objects;

-- Trigger/helper functions should not inherit caller-controlled search_path.
ALTER FUNCTION public._generate_barkada_code()
  SET search_path = public;

ALTER FUNCTION public._community_post_likes_count_trigger()
  SET search_path = public;

ALTER FUNCTION public._community_comments_count_trigger()
  SET search_path = public;

ALTER FUNCTION public._community_reports_escalate_trigger()
  SET search_path = public;

-- These helpers are invoked by trusted database code/triggers, not by clients.
REVOKE ALL ON FUNCTION public._generate_barkada_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._community_post_likes_count_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._community_comments_count_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._community_reports_escalate_trigger() FROM PUBLIC, anon, authenticated;

-- Keep public waitlist signups working, but make the RLS check bounded instead
-- of effectively bypassing RLS with WITH CHECK (true).
DROP POLICY IF EXISTS "anon_insert_waitlist" ON public.waitlist_signups;

CREATE POLICY "anon_insert_waitlist" ON public.waitlist_signups
  FOR INSERT TO anon
  WITH CHECK (
    email = lower(trim(email))
    AND char_length(email) BETWEEN 3 AND 320
    AND email ~* '^[A-Z0-9._%+''-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND coalesce(char_length(platform), 0) <= 32
    AND coalesce(char_length(exam_interest), 0) <= 120
  );

CREATE POLICY "authenticated_insert_waitlist" ON public.waitlist_signups
  FOR INSERT TO authenticated
  WITH CHECK (
    email = lower(trim(email))
    AND char_length(email) BETWEEN 3 AND 320
    AND email ~* '^[A-Z0-9._%+''-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND coalesce(char_length(platform), 0) <= 32
    AND coalesce(char_length(exam_interest), 0) <= 120
  );

COMMIT;
