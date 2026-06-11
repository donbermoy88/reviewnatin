-- Dedicated keepalive table polled by the GitHub Actions keepalive workflow so
-- the free-tier Supabase project is not paused for inactivity.
--
-- Recovered into the repo to reconcile migration drift: this migration was
-- applied to the remote database (version 20260606043948) but its file was
-- missing locally. Content is reproduced verbatim from the remote migration
-- history. Fully idempotent, so it is safe on both fresh and existing databases.

CREATE TABLE IF NOT EXISTS public.keepalive_pings (
  id smallint PRIMARY KEY DEFAULT 1,
  label text NOT NULL DEFAULT 'github-actions',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.keepalive_pings (id, label)
VALUES (1, 'github-actions')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.keepalive_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_keepalive_pings ON public.keepalive_pings;
CREATE POLICY public_read_keepalive_pings
  ON public.keepalive_pings
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.keepalive_pings TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
