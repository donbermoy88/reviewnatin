-- Wave 6: Board exam mode enum, material bookmarks RPC, waitlist, leaderboard periods

-- ---------------------------------------------------------------------------
-- Extend quiz_mode enum (idempotent per value)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TYPE quiz_mode ADD VALUE IF NOT EXISTS 'weak_area';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE quiz_mode ADD VALUE IF NOT EXISTS 'barkada';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE quiz_mode ADD VALUE IF NOT EXISTS 'board';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Beta waitlist (marketing site)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  platform TEXT,
  exam_interest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_signups_email_unique UNIQUE (email)
);

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist_signups;
CREATE POLICY "anon_insert_waitlist" ON waitlist_signups
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_read_waitlist" ON waitlist_signups;
CREATE POLICY "service_read_waitlist" ON waitlist_signups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'content_reviewer')
    )
  );

-- ---------------------------------------------------------------------------
-- Bookmarked review materials
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_bookmarked_materials(p_exam_slug TEXT DEFAULT NULL)
RETURNS TABLE (
  material_id UUID,
  title TEXT,
  body TEXT,
  material_type TEXT,
  topic_name TEXT,
  subject_name TEXT,
  bookmarked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;

  IF p_exam_slug IS NOT NULL AND p_exam_slug <> '' THEN
    SELECT et.id INTO v_exam_id FROM exam_types et WHERE et.slug = p_exam_slug AND et.is_active = true;
  END IF;

  RETURN QUERY
  SELECT
    rm.id,
    rm.title,
    left(rm.body, 280) AS body,
    rm.material_type,
    t.name,
    sa.name,
    b.created_at
  FROM bookmarks b
  JOIN review_materials rm ON rm.id = b.review_material_id
  JOIN topics t ON t.id = rm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE b.user_id = v_user_id
    AND b.review_material_id IS NOT NULL
    AND (v_exam_id IS NULL OR et.id = v_exam_id)
  ORDER BY b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bookmarked_materials(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard: weekly or all-time
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_leaderboard(TEXT, INT);

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 50,
  p_period TEXT DEFAULT 'week'
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  xp INT,
  rank BIGINT,
  is_current_user BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      qs.user_id,
      COALESCE(SUM(qs.item_count), 0)::int AS xp
    FROM quiz_sessions qs
    JOIN exam_types et ON et.id = qs.exam_type_id
    WHERE et.slug = p_exam_slug
      AND qs.completed_at IS NOT NULL
      AND (
        p_period = 'all'
        OR qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila')
      )
    GROUP BY qs.user_id
  ),
  ranked AS (
    SELECT
      f.user_id,
      COALESCE(u.display_name, split_part(u.email, '@', 1), 'Reviewer') AS display_name,
      f.xp,
      ROW_NUMBER() OVER (ORDER BY f.xp DESC, f.user_id) AS rank
    FROM filtered f
    JOIN users u ON u.id = f.user_id
    WHERE f.xp > 0
  )
  SELECT
    r.user_id,
    r.display_name,
    r.xp,
    r.rank,
    (r.user_id = auth.uid()) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT, TEXT) TO anon, authenticated;
