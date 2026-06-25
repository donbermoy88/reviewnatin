-- Community safety & moderation: guidelines acceptance, generalized reports
-- (post/comment/image/user), user blocking, moderation_status lifecycle with
-- auto-escalation, and admin RPCs for the moderation queue. Extends the
-- community_reports table from 20260625120000_community_feature.sql rather
-- than recreating it — see plan notes for why (preserves existing rows/FKs).

-- ---------------------------------------------------------------------------
-- Admin check helper — narrower than is_staff_user(); trust-and-safety
-- actions are a different trust boundary than exam-content QA.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_community_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- users: guidelines acceptance + community_status
-- ---------------------------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS community_guidelines_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS community_guidelines_version TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS community_status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_community_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_community_status_check
      CHECK (community_status IN ('active', 'muted', 'suspended', 'banned'));
  END IF;
END $$;

-- Extend the existing self-update guard (previously protected only id/role) so a
-- muted/suspended/banned user can't just UPDATE their own row back to 'active' —
-- the blanket users_update_own RLS policy (auth.uid() = id) would otherwise allow it.
CREATE OR REPLACE FUNCTION public.guard_users_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot change user id';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_staff_user() THEN
    NEW.role := OLD.role;
  END IF;

  IF NEW.community_status IS DISTINCT FROM OLD.community_status AND NOT public.is_community_admin() THEN
    NEW.community_status := OLD.community_status;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- community_report_reason: add the 4 missing reasons (9 total)
-- ---------------------------------------------------------------------------

ALTER TYPE community_report_reason ADD VALUE IF NOT EXISTS 'hate_or_abusive';
ALTER TYPE community_report_reason ADD VALUE IF NOT EXISTS 'violence_or_harmful';
ALTER TYPE community_report_reason ADD VALUE IF NOT EXISTS 'copyrighted_or_leaked';
ALTER TYPE community_report_reason ADD VALUE IF NOT EXISTS 'personal_information';

-- ---------------------------------------------------------------------------
-- community_reports: generalize to target_type/target_id (post/comment/image/user)
-- ---------------------------------------------------------------------------

ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE community_reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;

UPDATE community_reports SET target_type = 'post', target_id = post_id
WHERE post_id IS NOT NULL AND target_type IS NULL;
UPDATE community_reports SET target_type = 'comment', target_id = comment_id
WHERE comment_id IS NOT NULL AND target_type IS NULL;

-- Backfill reported_user_id from the target's author for existing rows.
UPDATE community_reports r SET reported_user_id = p.author_id
FROM community_posts p WHERE r.post_id = p.id AND r.reported_user_id IS NULL;
UPDATE community_reports r SET reported_user_id = c.author_id
FROM community_comments c WHERE r.comment_id = c.id AND r.reported_user_id IS NULL;

ALTER TABLE community_reports ALTER COLUMN target_type SET NOT NULL;
ALTER TABLE community_reports ALTER COLUMN target_id SET NOT NULL;

ALTER TABLE community_reports DROP CONSTRAINT IF EXISTS community_reports_exactly_one_target;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_reports_target_type_check'
  ) THEN
    ALTER TABLE community_reports ADD CONSTRAINT community_reports_target_type_check
      CHECK (target_type IN ('post', 'comment', 'image', 'user'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_reports_target_consistency'
  ) THEN
    ALTER TABLE community_reports ADD CONSTRAINT community_reports_target_consistency CHECK (
      (target_type = 'post' AND post_id = target_id AND comment_id IS NULL) OR
      (target_type = 'comment' AND comment_id = target_id AND post_id IS NULL) OR
      (target_type = 'image' AND post_id = target_id AND comment_id IS NULL) OR
      (target_type = 'user' AND post_id IS NULL AND comment_id IS NULL AND reported_user_id = target_id)
    );
  END IF;
END $$;

-- Dedup any pre-existing rows before adding the no-duplicate-report constraint.
DELETE FROM community_reports a
USING community_reports b
WHERE a.id < b.id
  AND a.reporter_id = b.reporter_id
  AND a.target_type = b.target_type
  AND a.target_id = b.target_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_reports_no_dup'
  ) THEN
    ALTER TABLE community_reports ADD CONSTRAINT community_reports_no_dup
      UNIQUE (reporter_id, target_type, target_id);
  END IF;
END $$;

-- Admins can view and resolve all reports; reporters keep their own-read-only access
-- (no owner update/delete policy exists or is added — reports are immutable to reporters).
DROP POLICY IF EXISTS "community_reports_admin_read" ON community_reports;
CREATE POLICY "community_reports_admin_read" ON community_reports
  FOR SELECT USING (public.is_community_admin());

DROP POLICY IF EXISTS "community_reports_admin_update" ON community_reports;
CREATE POLICY "community_reports_admin_update" ON community_reports
  FOR UPDATE USING (public.is_community_admin()) WITH CHECK (public.is_community_admin());

GRANT UPDATE ON community_reports TO authenticated;

-- ---------------------------------------------------------------------------
-- community_user_blocks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_user_id),
  CONSTRAINT community_user_blocks_no_self CHECK (blocker_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_user_blocks_blocker ON community_user_blocks (blocker_id);

ALTER TABLE community_user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_user_blocks_own_read" ON community_user_blocks;
CREATE POLICY "community_user_blocks_own_read" ON community_user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "community_user_blocks_own_write" ON community_user_blocks;
CREATE POLICY "community_user_blocks_own_write" ON community_user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "community_user_blocks_own_delete" ON community_user_blocks;
CREATE POLICY "community_user_blocks_own_delete" ON community_user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

GRANT SELECT, INSERT, DELETE ON community_user_blocks TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_community_user_block(p_blocked_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_blocked BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_blocked_user_id = v_user_id THEN RAISE EXCEPTION 'cannot_block_self'; END IF;

  IF EXISTS (SELECT 1 FROM community_user_blocks WHERE blocker_id = v_user_id AND blocked_user_id = p_blocked_user_id) THEN
    DELETE FROM community_user_blocks WHERE blocker_id = v_user_id AND blocked_user_id = p_blocked_user_id;
    v_blocked := false;
  ELSE
    INSERT INTO community_user_blocks (blocker_id, blocked_user_id) VALUES (v_user_id, p_blocked_user_id)
    ON CONFLICT DO NOTHING;
    v_blocked := true;
  END IF;

  RETURN jsonb_build_object('blocked', v_blocked);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_community_user_block(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.fetch_community_blocked_users()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'user_id', u.id,
    'display_name', coalesce(u.display_name, split_part(u.email, '@', 1)),
    'avatar_url', u.avatar_url,
    'blocked_at', b.created_at
  ) ORDER BY b.created_at DESC), '[]'::jsonb)
  FROM community_user_blocks b
  JOIN users u ON u.id = b.blocked_user_id
  WHERE b.blocker_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.fetch_community_blocked_users() TO authenticated;

-- ---------------------------------------------------------------------------
-- moderation_status lifecycle on posts/comments
-- ---------------------------------------------------------------------------

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_posts_moderation_status_check') THEN
    ALTER TABLE community_posts ADD CONSTRAINT community_posts_moderation_status_check
      CHECK (moderation_status IN ('visible', 'under_review', 'hidden', 'removed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_comments_moderation_status_check') THEN
    ALTER TABLE community_comments ADD CONSTRAINT community_comments_moderation_status_check
      CHECK (moderation_status IN ('visible', 'under_review', 'hidden', 'removed'));
  END IF;
END $$;

-- Auto-escalate to under_review after 3+ reports on the same target. Never
-- downgrades hidden/removed (those are admin-only decisions). Image-target
-- reports escalate the underlying post (the image lives on community_posts).
CREATE OR REPLACE FUNCTION public._community_reports_escalate_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NEW.target_type NOT IN ('post', 'comment', 'image') THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count
  FROM community_reports
  WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

  IF v_count >= 3 THEN
    IF NEW.target_type IN ('post', 'image') THEN
      UPDATE community_posts SET moderation_status = 'under_review'
      WHERE id = NEW.target_id AND moderation_status = 'visible';
    ELSE
      UPDATE community_comments SET moderation_status = 'under_review'
      WHERE id = NEW.target_id AND moderation_status = 'visible';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_reports_escalate ON community_reports;
CREATE TRIGGER trg_community_reports_escalate
AFTER INSERT ON community_reports
FOR EACH ROW EXECUTE FUNCTION public._community_reports_escalate_trigger();

-- Admins can change moderation_status on anyone's content (owners already have
-- their own update policy for body edits — this is additive, not a replacement).
DROP POLICY IF EXISTS "community_posts_admin_moderate" ON community_posts;
CREATE POLICY "community_posts_admin_moderate" ON community_posts
  FOR UPDATE USING (public.is_community_admin()) WITH CHECK (public.is_community_admin());

DROP POLICY IF EXISTS "community_comments_admin_moderate" ON community_comments;
CREATE POLICY "community_comments_admin_moderate" ON community_comments
  FOR UPDATE USING (public.is_community_admin()) WITH CHECK (public.is_community_admin());

-- Muted/suspended/banned users can't create new posts/comments — DB-level
-- enforcement, not just an app-level message.
DROP POLICY IF EXISTS "community_posts_owner_write" ON community_posts;
CREATE POLICY "community_posts_owner_write" ON community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND (SELECT community_status FROM users WHERE id = auth.uid()) = 'active'
  );

DROP POLICY IF EXISTS "community_comments_owner_write" ON community_comments;
CREATE POLICY "community_comments_owner_write" ON community_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND (SELECT community_status FROM users WHERE id = auth.uid()) = 'active'
  );

-- ---------------------------------------------------------------------------
-- report_community_content: generalize to target_type/target_id
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.report_community_content(UUID, UUID, community_report_reason, TEXT);

CREATE OR REPLACE FUNCTION public.report_community_content(
  p_target_type TEXT,
  p_target_id UUID,
  p_reason community_report_reason,
  p_details TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_post_id UUID;
  v_comment_id UUID;
  v_reported_user_id UUID;
  v_report_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF p_target_type IN ('post', 'image') THEN
    SELECT author_id INTO v_reported_user_id FROM community_posts WHERE id = p_target_id AND is_deleted = false;
    IF v_reported_user_id IS NULL THEN RAISE EXCEPTION 'target_not_found'; END IF;
    v_post_id := p_target_id;
  ELSIF p_target_type = 'comment' THEN
    SELECT author_id INTO v_reported_user_id FROM community_comments WHERE id = p_target_id AND is_deleted = false;
    IF v_reported_user_id IS NULL THEN RAISE EXCEPTION 'target_not_found'; END IF;
    v_comment_id := p_target_id;
  ELSIF p_target_type = 'user' THEN
    IF p_target_id = v_user_id THEN RAISE EXCEPTION 'cannot_report_self'; END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_target_id) THEN RAISE EXCEPTION 'target_not_found'; END IF;
    v_reported_user_id := p_target_id;
  ELSE
    RAISE EXCEPTION 'invalid_target_type';
  END IF;

  BEGIN
    INSERT INTO community_reports (reporter_id, post_id, comment_id, reported_user_id, target_type, target_id, reason, details)
    VALUES (v_user_id, v_post_id, v_comment_id, v_reported_user_id, p_target_type, p_target_id, p_reason, p_details)
    RETURNING id INTO v_report_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('duplicate', true);
  END;

  RETURN jsonb_build_object('id', v_report_id, 'duplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_community_content(TEXT, UUID, community_report_reason, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_community_feed / get_community_comments / get_community_post:
-- block-filtering + hidden-filtering + server-side redaction for non-visible content
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_community_feed(
  p_exam_slug TEXT,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_scope TEXT DEFAULT 'all',
  p_sort TEXT DEFAULT 'latest',
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_exam_name TEXT;
  v_user_id UUID := auth.uid();
  v_limit INT := greatest(1, least(p_limit, 50));
  v_offset INT := greatest(0, p_offset);
  v_items JSONB;
  v_offset_mode BOOLEAN := p_sort IN ('most_liked', 'most_commented');
BEGIN
  SELECT id, name INTO v_exam_id, v_exam_name FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN
    RETURN jsonb_build_object('items', '[]'::jsonb, 'next_cursor', NULL, 'next_offset', NULL, 'exam_slug', p_exam_slug, 'exam_name', NULL);
  END IF;

  IF p_scope IN ('mine', 'saved') AND v_user_id IS NULL THEN
    RETURN jsonb_build_object('items', '[]'::jsonb, 'next_cursor', NULL, 'next_offset', NULL, 'exam_slug', p_exam_slug, 'exam_name', v_exam_name);
  END IF;

  IF v_offset_mode THEN
    SELECT coalesce(jsonb_agg(row), '[]'::jsonb) INTO v_items
    FROM (
      SELECT
        p.id,
        p.author_id,
        coalesce(u.display_name, split_part(u.email, '@', 1)) AS author_display_name,
        u.avatar_url AS author_avatar_url,
        CASE p.moderation_status
          WHEN 'under_review' THEN 'This content is under review.'
          WHEN 'removed' THEN 'This content was removed.'
          ELSE p.body
        END AS body,
        CASE WHEN p.moderation_status IN ('under_review', 'removed') THEN NULL ELSE p.image_url END AS image_url,
        p.moderation_status,
        p.like_count,
        p.comment_count,
        p.created_at,
        (v_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = v_user_id
        )) AS liked_by_me,
        (v_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_post_saves s WHERE s.post_id = p.id AND s.user_id = v_user_id
        )) AS saved_by_me,
        (p.author_id = v_user_id) AS is_own
      FROM community_posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.exam_type_id = v_exam_id
        AND p.is_deleted = false
        AND p.is_hidden = false
        AND p.moderation_status <> 'hidden'
        AND (v_user_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM community_user_blocks bl WHERE bl.blocker_id = v_user_id AND bl.blocked_user_id = p.author_id
        ))
        AND (p_scope <> 'mine' OR p.author_id = v_user_id)
        AND (p_scope <> 'saved' OR EXISTS (
          SELECT 1 FROM community_post_saves s WHERE s.post_id = p.id AND s.user_id = v_user_id
        ))
      ORDER BY
        CASE WHEN p_sort = 'most_liked' THEN p.like_count ELSE p.comment_count END DESC,
        p.created_at DESC, p.id DESC
      LIMIT v_limit OFFSET v_offset
    ) row;

    RETURN jsonb_build_object(
      'items', v_items,
      'next_cursor', NULL,
      'next_offset', CASE WHEN jsonb_array_length(v_items) < v_limit THEN NULL ELSE v_offset + v_limit END,
      'exam_slug', p_exam_slug,
      'exam_name', v_exam_name
    );
  END IF;

  SELECT coalesce(jsonb_agg(row), '[]'::jsonb) INTO v_items
  FROM (
    SELECT
      p.id,
      p.author_id,
      coalesce(u.display_name, split_part(u.email, '@', 1)) AS author_display_name,
      u.avatar_url AS author_avatar_url,
      CASE p.moderation_status
        WHEN 'under_review' THEN 'This content is under review.'
        WHEN 'removed' THEN 'This content was removed.'
        ELSE p.body
      END AS body,
      CASE WHEN p.moderation_status IN ('under_review', 'removed') THEN NULL ELSE p.image_url END AS image_url,
      p.moderation_status,
      p.like_count,
      p.comment_count,
      p.created_at,
      (v_user_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = v_user_id
      )) AS liked_by_me,
      (v_user_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_post_saves s WHERE s.post_id = p.id AND s.user_id = v_user_id
      )) AS saved_by_me,
      (p.author_id = v_user_id) AS is_own
    FROM community_posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.exam_type_id = v_exam_id
      AND p.is_deleted = false
      AND p.is_hidden = false
      AND p.moderation_status <> 'hidden'
      AND (v_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM community_user_blocks bl WHERE bl.blocker_id = v_user_id AND bl.blocked_user_id = p.author_id
      ))
      AND (p_sort <> 'unanswered' OR p.comment_count = 0)
      AND (p_scope <> 'mine' OR p.author_id = v_user_id)
      AND (p_scope <> 'saved' OR EXISTS (
        SELECT 1 FROM community_post_saves s WHERE s.post_id = p.id AND s.user_id = v_user_id
      ))
      AND (
        p_cursor_created_at IS NULL
        OR (p.created_at, p.id) < (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT v_limit
  ) row;

  RETURN jsonb_build_object(
    'items', v_items,
    'next_cursor', CASE
      WHEN jsonb_array_length(v_items) < v_limit THEN NULL
      ELSE jsonb_build_object(
        'created_at', v_items -> (jsonb_array_length(v_items) - 1) ->> 'created_at',
        'id', v_items -> (jsonb_array_length(v_items) - 1) ->> 'id'
      )
    END,
    'next_offset', NULL,
    'exam_slug', p_exam_slug,
    'exam_name', v_exam_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'author_id', p.author_id,
    'author_display_name', coalesce(u.display_name, split_part(u.email, '@', 1)),
    'author_avatar_url', u.avatar_url,
    'body', CASE p.moderation_status
      WHEN 'under_review' THEN 'This content is under review.'
      WHEN 'removed' THEN 'This content was removed.'
      ELSE p.body
    END,
    'image_url', CASE WHEN p.moderation_status IN ('under_review', 'removed') THEN NULL ELSE p.image_url END,
    'moderation_status', p.moderation_status,
    'like_count', p.like_count,
    'comment_count', p.comment_count,
    'created_at', p.created_at,
    'liked_by_me', (v_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = v_user_id
    )),
    'saved_by_me', (v_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_post_saves s WHERE s.post_id = p.id AND s.user_id = v_user_id
    )),
    'is_own', (p.author_id = v_user_id),
    'exam_slug', et.slug,
    'exam_name', et.name
  ) INTO v_result
  FROM community_posts p
  JOIN users u ON u.id = p.author_id
  JOIN exam_types et ON et.id = p.exam_type_id
  WHERE p.id = p_post_id AND p.is_deleted = false AND p.is_hidden = false AND p.moderation_status <> 'hidden';

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_comments(
  p_post_id UUID,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_limit INT := greatest(1, least(p_limit, 50));
  v_items JSONB;
BEGIN
  SELECT coalesce(jsonb_agg(row), '[]'::jsonb) INTO v_items
  FROM (
    SELECT
      c.id,
      c.author_id,
      coalesce(u.display_name, split_part(u.email, '@', 1)) AS author_display_name,
      u.avatar_url AS author_avatar_url,
      CASE c.moderation_status
        WHEN 'under_review' THEN 'This content is under review.'
        WHEN 'removed' THEN 'This content was removed.'
        ELSE c.body
      END AS body,
      c.moderation_status,
      c.created_at
    FROM community_comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = p_post_id
      AND c.is_deleted = false
      AND c.is_hidden = false
      AND c.moderation_status <> 'hidden'
      AND (v_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM community_user_blocks bl WHERE bl.blocker_id = v_user_id AND bl.blocked_user_id = c.author_id
      ))
      AND (
        p_cursor_created_at IS NULL
        OR (c.created_at, c.id) > (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY c.created_at ASC, c.id ASC
    LIMIT v_limit
  ) row;

  RETURN jsonb_build_object(
    'items', v_items,
    'next_cursor', CASE
      WHEN jsonb_array_length(v_items) < v_limit THEN NULL
      ELSE jsonb_build_object(
        'created_at', v_items -> (jsonb_array_length(v_items) - 1) ->> 'created_at',
        'id', v_items -> (jsonb_array_length(v_items) - 1) ->> 'id'
      )
    END
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin moderation RPCs — client-side-callable (auth.uid() = the staff member's
-- own session), exactly like resolve_content_report's calling convention.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_community_report(
  p_report_id UUID,
  p_status report_status,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_community_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  IF p_status NOT IN ('triaged', 'fixed', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  UPDATE community_reports
  SET status = p_status,
      admin_notes = COALESCE(NULLIF(trim(p_admin_notes), ''), admin_notes),
      resolved_by = auth.uid(),
      resolved_at = now()
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_community_report(UUID, report_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_community_content_moderation(
  p_target_type TEXT,
  p_target_id UUID,
  p_moderation_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_community_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  IF p_moderation_status NOT IN ('visible', 'under_review', 'hidden', 'removed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  IF p_target_type IN ('post', 'image') THEN
    UPDATE community_posts SET moderation_status = p_moderation_status WHERE id = p_target_id;
  ELSIF p_target_type = 'comment' THEN
    UPDATE community_comments SET moderation_status = p_moderation_status WHERE id = p_target_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_target_type');
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_community_content_moderation(TEXT, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_community_user_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_community_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  IF p_status NOT IN ('active', 'muted', 'suspended', 'banned') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  UPDATE users SET community_status = p_status WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_community_user_status(UUID, TEXT) TO authenticated;
