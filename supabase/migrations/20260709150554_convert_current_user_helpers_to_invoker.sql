-- These helpers only inspect the caller's own user/entitlement rows.
-- The underlying tables already have authenticated self-read RLS policies, so
-- they do not need SECURITY DEFINER privileges.

ALTER FUNCTION public.is_staff_user()
  SECURITY INVOKER;

ALTER FUNCTION public.is_community_admin()
  SECURITY INVOKER;

ALTER FUNCTION public.user_has_content_access(UUID)
  SECURITY INVOKER;
