-- Internal trigger/job helpers should not be callable as public RPC endpoints.
-- Keep service_role access for backend maintenance while trigger execution
-- continues through the owning table/trigger definitions.

REVOKE ALL ON FUNCTION public.guard_users_profile_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_users_profile_update() TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.handle_session_completed() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_session_completed() TO service_role;

REVOKE ALL ON FUNCTION public.quiz_answers_apply_grading() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quiz_answers_apply_grading() TO service_role;

REVOKE ALL ON FUNCTION public.replenish_hints() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replenish_hints() TO service_role;
