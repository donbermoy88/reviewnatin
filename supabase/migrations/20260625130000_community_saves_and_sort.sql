-- Community feature follow-up: saved posts + sortable/scoped feed.
-- Adds a saves table mirroring community_post_likes, and extends
-- get_community_feed with scope (all/mine/saved) and sort (latest/
-- most_liked/most_commented/unanswered). The default call shape
-- (scope='all', sort='latest') preserves the exact keyset-pagination
-- behavior the feed already relied on.

-- ---------------------------------------------------------------------------
-- Saved posts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_post_saves (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_saves_user
  ON community_post_saves (user_id, created_at DESC);

ALTER TABLE community_post_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_post_saves_read" ON community_post_saves;
CREATE POLICY "community_post_saves_read" ON community_post_saves FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_post_saves_own_write" ON community_post_saves;
CREATE POLICY "community_post_saves_own_write" ON community_post_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_post_saves_own_delete" ON community_post_saves;
CREATE POLICY "community_post_saves_own_delete" ON community_post_saves
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON community_post_saves TO authenticated;
GRANT SELECT ON community_post_saves TO anon;

CREATE OR REPLACE FUNCTION public.toggle_community_save(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_saved BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM community_post_saves WHERE post_id = p_post_id AND user_id = v_user_id) THEN
    DELETE FROM community_post_saves WHERE post_id = p_post_id AND user_id = v_user_id;
    v_saved := false;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM community_posts WHERE id = p_post_id AND is_deleted = false) THEN
      RAISE EXCEPTION 'post_not_found';
    END IF;
    INSERT INTO community_post_saves (post_id, user_id) VALUES (p_post_id, v_user_id)
    ON CONFLICT DO NOTHING;
    v_saved := true;
  END IF;

  RETURN jsonb_build_object('saved', v_saved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_community_save(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Sort-supporting indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_community_posts_feed_likes
  ON community_posts (exam_type_id, like_count DESC, created_at DESC, id DESC)
  WHERE is_deleted = false AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_community_posts_feed_comments
  ON community_posts (exam_type_id, comment_count DESC, created_at DESC, id DESC)
  WHERE is_deleted = false AND is_hidden = false;

-- ---------------------------------------------------------------------------
-- get_community_feed: scope ('all' | 'mine' | 'saved') + sort
-- ('latest' | 'unanswered' | 'most_liked' | 'most_commented')
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_community_feed(TEXT, TIMESTAMPTZ, UUID, INT);

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

  -- "mine"/"saved" scopes are meaningless for a guest — return an empty page
  -- rather than erroring, so those tabs just show the empty state.
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
        p.body,
        p.image_url,
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
      p.body,
      p.image_url,
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

GRANT EXECUTE ON FUNCTION public.get_community_feed(TEXT, TIMESTAMPTZ, UUID, INT, TEXT, TEXT, INT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_community_post: add saved_by_me
-- ---------------------------------------------------------------------------

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
    'body', p.body,
    'image_url', p.image_url,
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
  WHERE p.id = p_post_id AND p.is_deleted = false AND p.is_hidden = false;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_post(UUID) TO anon, authenticated;
