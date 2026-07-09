-- Remove implicit RPC exposure from public-schema functions.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default. In Supabase,
-- that can expose SECURITY DEFINER functions through PostgREST even when a
-- migration only intended authenticated/service-role execution. Explicit grants
-- to anon/authenticated/service_role remain in effect.

BEGIN;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMIT;
