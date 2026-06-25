-- Community feature: exam-scoped social feed (posts, comments, likes, follows,
-- reports) plus user avatar storage. Free + premium feature — no premium gating;
-- guests can read but all writes require auth.uid() (enforced both at RLS and
-- inside each SECURITY DEFINER RPC, since RPCs bypass RLS for their own queries).

-- ---------------------------------------------------------------------------
-- Avatar support on users
-- ---------------------------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TYPE community_report_reason AS ENUM ('spam', 'harassment', 'wrong_info', 'inappropriate', 'other');

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  image_url TEXT,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_feed
  ON community_posts (exam_type_id, created_at DESC, id DESC)
  WHERE is_deleted = false AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_community_posts_author
  ON community_posts (author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post
  ON community_comments (post_id, created_at ASC, id ASC)
  WHERE is_deleted = false AND is_hidden = false;

CREATE TABLE IF NOT EXISTS community_post_likes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user
  ON community_post_likes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT community_follows_no_self CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_followee
  ON community_follows (followee_id);

CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  reason community_report_reason NOT NULL DEFAULT 'other',
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_reports_exactly_one_target CHECK (
    (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_community_reports_open
  ON community_reports (created_at DESC)
  WHERE status = 'open';

-- ---------------------------------------------------------------------------
-- Counter-maintenance triggers (avoid COUNT(*) on every feed page)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._community_post_likes_count_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_post_likes_count ON community_post_likes;
CREATE TRIGGER trg_community_post_likes_count
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION public._community_post_likes_count_trigger();

CREATE OR REPLACE FUNCTION public._community_comments_count_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE community_posts SET comment_count = greatest(comment_count - 1, 0) WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_comments_count ON community_comments;
CREATE TRIGGER trg_community_comments_count
AFTER INSERT OR UPDATE ON community_comments
FOR EACH ROW EXECUTE FUNCTION public._community_comments_count_trigger();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts_public_read" ON community_posts;
CREATE POLICY "community_posts_public_read" ON community_posts
  FOR SELECT USING (is_deleted = false AND is_hidden = false);

DROP POLICY IF EXISTS "community_posts_owner_write" ON community_posts;
CREATE POLICY "community_posts_owner_write" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community_posts_owner_update" ON community_posts;
CREATE POLICY "community_posts_owner_update" ON community_posts
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community_comments_public_read" ON community_comments;
CREATE POLICY "community_comments_public_read" ON community_comments
  FOR SELECT USING (is_deleted = false AND is_hidden = false);

DROP POLICY IF EXISTS "community_comments_owner_write" ON community_comments;
CREATE POLICY "community_comments_owner_write" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community_comments_owner_update" ON community_comments;
CREATE POLICY "community_comments_owner_update" ON community_comments
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community_post_likes_read" ON community_post_likes;
CREATE POLICY "community_post_likes_read" ON community_post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_post_likes_own_write" ON community_post_likes;
CREATE POLICY "community_post_likes_own_write" ON community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_post_likes_own_delete" ON community_post_likes;
CREATE POLICY "community_post_likes_own_delete" ON community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_follows_read" ON community_follows;
CREATE POLICY "community_follows_read" ON community_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_follows_own_write" ON community_follows;
CREATE POLICY "community_follows_own_write" ON community_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "community_follows_own_delete" ON community_follows;
CREATE POLICY "community_follows_own_delete" ON community_follows
  FOR DELETE USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "community_reports_own_insert" ON community_reports;
CREATE POLICY "community_reports_own_insert" ON community_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "community_reports_own_read" ON community_reports;
CREATE POLICY "community_reports_own_read" ON community_reports
  FOR SELECT USING (auth.uid() = reporter_id);

GRANT SELECT, INSERT, UPDATE ON community_posts TO authenticated;
GRANT SELECT ON community_posts TO anon;
GRANT SELECT, INSERT, UPDATE ON community_comments TO authenticated;
GRANT SELECT ON community_comments TO anon;
GRANT SELECT, INSERT, DELETE ON community_post_likes TO authenticated;
GRANT SELECT ON community_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON community_follows TO authenticated;
GRANT SELECT ON community_follows TO anon;
GRANT SELECT, INSERT ON community_reports TO authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Feed, keyset-paginated, scoped to an exam. Guests (anon) can read.
CREATE OR REPLACE FUNCTION public.get_community_feed(
  p_exam_slug TEXT,
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
  v_exam_id UUID;
  v_exam_name TEXT;
  v_user_id UUID := auth.uid();
  v_limit INT := greatest(1, least(p_limit, 50));
  v_items JSONB;
BEGIN
  SELECT id, name INTO v_exam_id, v_exam_name FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN
    RETURN jsonb_build_object('items', '[]'::jsonb, 'next_cursor', NULL, 'exam_slug', p_exam_slug, 'exam_name', NULL);
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
      (p.author_id = v_user_id) AS is_own
    FROM community_posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.exam_type_id = v_exam_id
      AND p.is_deleted = false
      AND p.is_hidden = false
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
    'exam_slug', p_exam_slug,
    'exam_name', v_exam_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_feed(TEXT, TIMESTAMPTZ, UUID, INT) TO anon, authenticated;

-- Single-post fetch (post detail screen / future deep links). Same row shape as the feed.
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

-- Exam scope is resolved server-side from the caller's active goal — never trust
-- a client-supplied exam_type_id for "what exam is this post in."
CREATE OR REPLACE FUNCTION public.create_community_post(
  p_body TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_body TEXT := trim(p_body);
  v_post_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF char_length(v_body) = 0 THEN RAISE EXCEPTION 'empty_post'; END IF;
  IF char_length(v_body) > 2000 THEN RAISE EXCEPTION 'post_too_long'; END IF;

  SELECT exam_type_id INTO v_exam_id
  FROM user_exam_goals
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_exam_id IS NULL THEN RAISE EXCEPTION 'no_active_exam_goal'; END IF;

  INSERT INTO community_posts (author_id, exam_type_id, body, image_url)
  VALUES (v_user_id, v_exam_id, v_body, p_image_url)
  RETURNING id, created_at INTO v_post_id, v_created_at;

  RETURN jsonb_build_object('id', v_post_id, 'created_at', v_created_at);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_community_post(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_community_like(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_liked BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM community_post_likes WHERE post_id = p_post_id AND user_id = v_user_id) THEN
    DELETE FROM community_post_likes WHERE post_id = p_post_id AND user_id = v_user_id;
    v_liked := false;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM community_posts WHERE id = p_post_id AND is_deleted = false) THEN
      RAISE EXCEPTION 'post_not_found';
    END IF;
    INSERT INTO community_post_likes (post_id, user_id) VALUES (p_post_id, v_user_id)
    ON CONFLICT DO NOTHING;
    v_liked := true;
  END IF;

  RETURN jsonb_build_object('liked', v_liked);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_community_like(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_community_comment(
  p_post_id UUID,
  p_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_body TEXT := trim(p_body);
  v_comment_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF char_length(v_body) = 0 THEN RAISE EXCEPTION 'empty_comment'; END IF;
  IF char_length(v_body) > 1000 THEN RAISE EXCEPTION 'comment_too_long'; END IF;

  IF NOT EXISTS (SELECT 1 FROM community_posts WHERE id = p_post_id AND is_deleted = false) THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  INSERT INTO community_comments (post_id, author_id, body)
  VALUES (p_post_id, v_user_id, v_body)
  RETURNING id, created_at INTO v_comment_id, v_created_at;

  RETURN jsonb_build_object('id', v_comment_id, 'created_at', v_created_at);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_community_comment(UUID, TEXT) TO authenticated;

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
      c.body,
      c.created_at
    FROM community_comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = p_post_id
      AND c.is_deleted = false
      AND c.is_hidden = false
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

GRANT EXECUTE ON FUNCTION public.get_community_comments(UUID, TIMESTAMPTZ, UUID, INT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.toggle_community_follow(p_followee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_following BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_followee_id = v_user_id THEN RAISE EXCEPTION 'cannot_follow_self'; END IF;

  IF EXISTS (SELECT 1 FROM community_follows WHERE follower_id = v_user_id AND followee_id = p_followee_id) THEN
    DELETE FROM community_follows WHERE follower_id = v_user_id AND followee_id = p_followee_id;
    v_following := false;
  ELSE
    INSERT INTO community_follows (follower_id, followee_id) VALUES (v_user_id, p_followee_id)
    ON CONFLICT DO NOTHING;
    v_following := true;
  END IF;

  RETURN jsonb_build_object('following', v_following);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_community_follow(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.report_community_content(
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_reason community_report_reason DEFAULT 'other',
  p_details TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_report_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF (p_post_id IS NOT NULL)::int + (p_comment_id IS NOT NULL)::int <> 1 THEN
    RAISE EXCEPTION 'must_target_exactly_one';
  END IF;

  INSERT INTO community_reports (reporter_id, post_id, comment_id, reason, details)
  VALUES (v_user_id, p_post_id, p_comment_id, p_reason, p_details)
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object('id', v_report_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_community_content(UUID, UUID, community_report_reason, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.soft_delete_community_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE community_posts SET is_deleted = true
  WHERE id = p_post_id AND author_id = v_user_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'not_found_or_forbidden'; END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_community_post(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.soft_delete_community_comment(p_comment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE community_comments SET is_deleted = true
  WHERE id = p_comment_id AND author_id = v_user_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'not_found_or_forbidden'; END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_community_comment(UUID) TO authenticated;

-- Public profile view: display name, avatar, post count, follower/following counts,
-- and whether the caller already follows this user. Bypasses the restrictive
-- users_select_own RLS policy via SECURITY DEFINER, same pattern as get_my_barkada.
CREATE OR REPLACE FUNCTION public.get_community_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_user users%ROWTYPE;
  v_post_count INT;
  v_follower_count INT;
  v_following_count INT;
  v_is_following BOOLEAN := false;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_post_count FROM community_posts
  WHERE author_id = p_user_id AND is_deleted = false AND is_hidden = false;

  SELECT count(*) INTO v_follower_count FROM community_follows WHERE followee_id = p_user_id;
  SELECT count(*) INTO v_following_count FROM community_follows WHERE follower_id = p_user_id;

  IF v_caller IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM community_follows WHERE follower_id = v_caller AND followee_id = p_user_id
    ) INTO v_is_following;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_user.id,
    'display_name', coalesce(v_user.display_name, split_part(v_user.email, '@', 1)),
    'avatar_url', v_user.avatar_url,
    'post_count', v_post_count,
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'is_following', v_is_following,
    'is_self', v_caller = p_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_profile(UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Avatar storage bucket
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read avatars'
  ) THEN
    CREATE POLICY "Public read avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users upload own avatar'
  ) THEN
    CREATE POLICY "Users upload own avatar"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own avatar'
  ) THEN
    CREATE POLICY "Users update own avatar"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own avatar'
  ) THEN
    CREATE POLICY "Users delete own avatar"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
