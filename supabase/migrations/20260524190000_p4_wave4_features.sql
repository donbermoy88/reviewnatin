-- Wave 4: Exam calendar, achievements, announcements, mock history, badge awards

-- ---------------------------------------------------------------------------
-- Achievement badges
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏅',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_achievement_badges" ON achievement_badges;
CREATE POLICY "public_read_achievement_badges" ON achievement_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_badges_own" ON user_badges;
CREATE POLICY "user_badges_own" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

INSERT INTO achievement_badges (slug, title, description, emoji, sort_order) VALUES
  ('first_quiz', 'First steps', 'Complete your first quiz session', '🎯', 1),
  ('streak_3', '3-day streak', 'Study 3 days in a row', '🔥', 2),
  ('streak_7', 'Week warrior', '7-day study streak', '⚡', 3),
  ('mock_complete', 'Mock taker', 'Finish a mock exam', '📝', 4),
  ('perfect_score', 'Perfect score', 'Score 100% on a 10+ item quiz', '💯', 5),
  ('barkada_member', 'Barkada', 'Join a study group', '👥', 6)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Award badges (idempotent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_user_badges(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := coalesce(p_user_id, auth.uid());
  v_new JSONB := '[]'::jsonb;
  v_badge achievement_badges%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RETURN '[]'::jsonb; END IF;

  -- first_quiz
  IF EXISTS (SELECT 1 FROM quiz_sessions WHERE user_id = v_uid AND completed_at IS NOT NULL LIMIT 1) THEN
    INSERT INTO user_badges (user_id, badge_id)
    SELECT v_uid, ab.id FROM achievement_badges ab WHERE ab.slug = 'first_quiz'
    ON CONFLICT DO NOTHING;
  END IF;

  -- streak badges
  IF EXISTS (SELECT 1 FROM users u WHERE u.id = v_uid AND u.streak_count >= 3) THEN
    INSERT INTO user_badges (user_id, badge_id)
    SELECT v_uid, ab.id FROM achievement_badges ab WHERE ab.slug = 'streak_3'
    ON CONFLICT DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM users u WHERE u.id = v_uid AND u.streak_count >= 7) THEN
    INSERT INTO user_badges (user_id, badge_id)
    SELECT v_uid, ab.id FROM achievement_badges ab WHERE ab.slug = 'streak_7'
    ON CONFLICT DO NOTHING;
  END IF;

  -- mock_complete
  IF EXISTS (
    SELECT 1 FROM quiz_sessions qs
    WHERE qs.user_id = v_uid AND qs.mode = 'mock' AND qs.completed_at IS NOT NULL
    LIMIT 1
  ) THEN
    INSERT INTO user_badges (user_id, badge_id)
    SELECT v_uid, ab.id FROM achievement_badges ab WHERE ab.slug = 'mock_complete'
    ON CONFLICT DO NOTHING;
  END IF;

  -- perfect_score
  IF EXISTS (
    SELECT 1 FROM quiz_sessions qs
    WHERE qs.user_id = v_uid
      AND qs.completed_at IS NOT NULL
      AND qs.item_count >= 10
      AND qs.score_percent >= 100
    LIMIT 1
  ) THEN
    INSERT INTO user_badges (user_id, badge_id)
    SELECT v_uid, ab.id FROM achievement_badges ab WHERE ab.slug = 'perfect_score'
    ON CONFLICT DO NOTHING;
  END IF;

  -- barkada_member
  IF EXISTS (SELECT 1 FROM barkada_members bm WHERE bm.user_id = v_uid LIMIT 1) THEN
    INSERT INTO user_badges (user_id, badge_id)
    SELECT v_uid, ab.id FROM achievement_badges ab WHERE ab.slug = 'barkada_member'
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'slug', ab.slug,
    'title', ab.title,
    'emoji', ab.emoji
  ) ORDER BY ab.sort_order), '[]'::jsonb)
  INTO v_new
  FROM user_badges ub
  JOIN achievement_badges ab ON ab.id = ub.badge_id
  WHERE ub.user_id = v_uid
    AND ub.earned_at >= now() - interval '5 seconds';

  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_user_badges(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  description TEXT,
  emoji TEXT,
  earned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR (auth.uid() IS NOT NULL AND p_user_id <> auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ab.slug, ab.title, ab.description, ab.emoji, ub.earned_at
  FROM user_badges ub
  JOIN achievement_badges ab ON ab.id = ub.badge_id
  WHERE ub.user_id = p_user_id
  ORDER BY ub.earned_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_badges(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Exam schedules RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_exam_schedules_by_exam(p_exam_slug TEXT)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_date DATE,
  source_url TEXT,
  notes TEXT,
  days_until INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
  SELECT et.id INTO v_exam_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active = true;

  IF v_exam_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    es.id,
    es.event_type,
    es.event_date,
    es.source_url,
    es.notes,
    (es.event_date - v_today)::int AS days_until
  FROM exam_schedules es
  WHERE es.exam_type_id = v_exam_id
    AND es.event_date >= v_today - interval '30 days'
  ORDER BY es.event_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_schedules_by_exam(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- App announcements
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_app_announcements(
  p_exam_slug TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
BEGIN
  IF p_exam_slug IS NOT NULL THEN
    SELECT et.id INTO v_exam_id FROM exam_types et WHERE et.slug = p_exam_slug AND et.is_active = true;
  END IF;

  RETURN QUERY
  SELECT a.id, a.title, a.body, a.published_at
  FROM announcements a
  WHERE a.exam_type_id IS NULL OR a.exam_type_id = v_exam_id
  ORDER BY a.published_at DESC
  LIMIT greatest(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_announcements(TEXT, INT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mock exam history
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mock_exam_history(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  session_id UUID,
  mock_title TEXT,
  score_percent NUMERIC,
  item_count INT,
  duration_seconds INT,
  completed_at TIMESTAMPTZ,
  passed BOOLEAN
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

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    qs.id,
    coalesce(me.title, 'Mock exam'),
    qs.score_percent,
    qs.item_count,
    qs.duration_seconds,
    qs.completed_at,
    coalesce(qs.score_percent, 0) >= 75 AS passed
  FROM quiz_sessions qs
  LEFT JOIN mock_exams me ON me.id = qs.mock_exam_id
  WHERE qs.user_id = v_user_id
    AND qs.exam_type_id = v_exam_id
    AND qs.mode = 'mock'
    AND qs.completed_at IS NOT NULL
  ORDER BY qs.completed_at DESC
  LIMIT greatest(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mock_exam_history(TEXT, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed exam schedules (verify on official sites before exam day)
-- ---------------------------------------------------------------------------

INSERT INTO exam_schedules (exam_type_id, event_type, event_date, source_url, notes)
SELECT et.id, seed.event_type, seed.event_date::date, seed.source_url, seed.notes
FROM exam_types et
CROSS JOIN (
  VALUES
    ('cse-professional', 'application_opens', '2026-03-01', 'https://www.csc.gov.ph', 'Verify application window on CSC website'),
    ('cse-professional', 'examination', '2026-03-15', 'https://www.csc.gov.ph', 'Pen & paper schedule — confirm with CSC advisory'),
    ('cse-professional', 'examination', '2026-08-16', 'https://www.csc.gov.ph', 'Second CSE window (typical Aug slot — verify)'),
    ('cse-subprofessional', 'examination', '2026-03-15', 'https://www.csc.gov.ph', 'Usually same date as Professional — verify'),
    ('let-elementary', 'examination', '2026-03-29', 'https://www.prc.gov.ph', 'LET schedule varies — check PRC advisory'),
    ('let-secondary', 'examination', '2026-03-29', 'https://www.prc.gov.ph', 'LET schedule varies — check PRC advisory'),
    ('pnle', 'examination', '2026-05-17', 'https://www.prc.gov.ph', 'PNLE dates set by PRC — verify before planning')
) AS seed(exam_slug, event_type, event_date, source_url, notes)
WHERE et.slug = seed.exam_slug
  AND NOT EXISTS (
    SELECT 1 FROM exam_schedules es
    WHERE es.exam_type_id = et.id
      AND es.event_type = seed.event_type
      AND es.event_date = seed.event_date::date
  );

-- ---------------------------------------------------------------------------
-- Seed launch announcements
-- ---------------------------------------------------------------------------

INSERT INTO announcements (title, body, exam_type_id, published_at)
SELECT seed.title, seed.body, et.id, now()
FROM (
  VALUES
    (
      'CSE content expanding',
      'We''re importing more Civil Service Professional questions weekly. Check Study → Notes for new cheat sheets.',
      'cse-professional'
    ),
    (
      'Welcome to ReviewNatin',
      'PasaPath, Barkada mode, and GCash/Maya checkout are live. Mag-login para ma-save ang progress mo.',
      NULL::text
    )
) AS seed(title, body, exam_slug)
LEFT JOIN exam_types et ON et.slug = seed.exam_slug
WHERE NOT EXISTS (
  SELECT 1 FROM announcements a
  WHERE a.title = seed.title
);

INSERT INTO content_changelog (title, body, exam_type_id, published_at)
SELECT seed.title, seed.body, et.id, now()
FROM (
  VALUES
    ('cse-professional', 'Wave 4: Exam calendar', 'Official-style exam dates + in-app reminders. Always verify on CSC/PRC sites.'),
    ('cse-professional', 'Achievement badges', 'Earn badges for streaks, mocks, and Barkada milestones on your Profile tab.')
) AS seed(exam_slug, title, body)
JOIN exam_types et ON et.slug = seed.exam_slug
WHERE NOT EXISTS (
  SELECT 1 FROM content_changelog cc WHERE cc.title = seed.title AND cc.exam_type_id = et.id
);
