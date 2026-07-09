-- Harden internal LET Secondary taxonomy audit tables.
--
-- These tables were created as rollback/manual-review artifacts by
-- 20260624000000_normalize_let_secondary_major_taxonomy.sql. They contain
-- question snapshots and review notes, and are not part of the client API.

BEGIN;

ALTER TABLE IF EXISTS public.let_secondary_major_taxonomy_2026_backup
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.let_secondary_major_taxonomy_2026_manual_review
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.let_secondary_major_taxonomy_2026_backup
  FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.let_secondary_major_taxonomy_2026_manual_review
  FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.let_secondary_major_taxonomy_2026_backup
  FROM anon, authenticated;

REVOKE ALL ON TABLE public.let_secondary_major_taxonomy_2026_manual_review
  FROM anon, authenticated;

COMMENT ON TABLE public.let_secondary_major_taxonomy_2026_backup IS
  'Internal rollback snapshot table for LET Secondary major taxonomy migration. RLS forced; no anon/authenticated client access.';

COMMENT ON TABLE public.let_secondary_major_taxonomy_2026_manual_review IS
  'Internal manual-review table for LET Secondary major taxonomy migration. RLS forced; no anon/authenticated client access.';

-- Prevent future tables created by the migration owner in public from
-- inheriting blanket client-role privileges before RLS/policies are reviewed.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

COMMIT;
