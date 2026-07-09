-- Restrict anonymous RPC execution to an explicit allowlist.
--
-- Earlier migrations granted many SECURITY DEFINER functions to authenticated
-- users, but default/explicit anon grants also made several authenticated-only
-- mutation/admin/payment RPCs callable before sign-in. Revoke anonymous access
-- broadly, then restore only public read and pre-auth helper RPCs.

BEGIN;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Public catalog/content reads.
GRANT EXECUTE ON FUNCTION public.get_content_counts(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_practice_questions(TEXT, INT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_mock_exam_questions(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_content_changelog(TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_exam_schedules_by_exam(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_app_announcements(TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_review_materials_by_exam(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_review_materials_by_exam(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_topic_question_counts(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_question_hint(UUID, TEXT) TO anon;

-- Public community reads.
GRANT EXECUTE ON FUNCTION public.get_community_feed(TEXT, TIMESTAMPTZ, UUID, INT, TEXT, TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_community_post(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_community_comments(UUID, TIMESTAMPTZ, UUID, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_community_profile(UUID) TO anon;

-- Pre-auth and public checkout helpers.
GRANT EXECUTE ON FUNCTION public.get_web_checkout_status(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.patch_web_checkout_attribution(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_client_login_rate_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_client_otp_resend_rate_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.log_auth_login_attempt(UUID, TEXT, BOOLEAN, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_domain_blocked(TEXT) TO anon;

COMMIT;
