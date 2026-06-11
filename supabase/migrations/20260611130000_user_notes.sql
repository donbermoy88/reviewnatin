-- ---------------------------------------------------------------------------
-- Study notes: per-user freeform notes. Owner-only access via RLS, queried
-- directly from the client (same pattern as the bookmarks table).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_type_id UUID REFERENCES public.exam_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_updated
  ON public.user_notes (user_id, updated_at DESC);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notes_select_own ON public.user_notes;
CREATE POLICY user_notes_select_own ON public.user_notes
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_notes_insert_own ON public.user_notes;
CREATE POLICY user_notes_insert_own ON public.user_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_notes_update_own ON public.user_notes;
CREATE POLICY user_notes_update_own ON public.user_notes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_notes_delete_own ON public.user_notes;
CREATE POLICY user_notes_delete_own ON public.user_notes
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;

NOTIFY pgrst, 'reload schema';
