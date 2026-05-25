-- P2 features: preferences, leaderboard, PasaPath, mistakes, mock/flashcard seed, review RPCs

-- ---------------------------------------------------------------------------
-- User preferences & push tokens
-- ---------------------------------------------------------------------------

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_hour SMALLINT NOT NULL DEFAULT 19 CHECK (reminder_hour BETWEEN 0 AND 23),
  reminder_minute SMALLINT NOT NULL DEFAULT 0 CHECK (reminder_minute BETWEEN 0 AND 59),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_own" ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_tokens_own" ON user_push_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookmarks: users manage own rows
DROP POLICY IF EXISTS "bookmarks_own" ON bookmarks;
CREATE POLICY "bookmarks_own" ON bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Mistake log + topic mastery (post-quiz)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_mistake_log(
  p_question_id UUID,
  p_wrong_choice_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  INSERT INTO mistake_logs (user_id, question_id, wrong_choice_id, times_wrong, last_wrong_at, next_review_at)
  VALUES (auth.uid(), p_question_id, p_wrong_choice_id, 1, now(), now() + interval '1 day')
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    wrong_choice_id = EXCLUDED.wrong_choice_id,
    times_wrong = mistake_logs.times_wrong + 1,
    last_wrong_at = now(),
    mastered_at = NULL,
    next_review_at = now() + (LEAST(mistake_logs.times_wrong + 1, 14) || ' days')::interval;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_topic_mastery(
  p_question_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_id UUID;
  v_accuracy NUMERIC;
  v_attempts INT;
  v_correct INT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT topic_id INTO v_topic_id FROM questions WHERE id = p_question_id;
  IF v_topic_id IS NULL THEN RETURN; END IF;

  INSERT INTO topic_mastery (user_id, topic_id, accuracy, attempts, correct_count, last_seen_at, next_review_at)
  VALUES (
    auth.uid(),
    v_topic_id,
    CASE WHEN p_is_correct THEN 100 ELSE 0 END,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    now(),
    now() + interval '1 day'
  )
  ON CONFLICT (user_id, topic_id) DO UPDATE SET
    attempts = topic_mastery.attempts + 1,
    correct_count = topic_mastery.correct_count + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    accuracy = ROUND(
      ((topic_mastery.correct_count + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::numeric /
       (topic_mastery.attempts + 1)::numeric) * 100,
      1
    ),
    last_seen_at = now(),
    next_review_at = CASE
      WHEN p_is_correct THEN now() + ((topic_mastery.interval_days * 1.5)::int || ' days')::interval
      ELSE now() + interval '1 day'
    END,
    interval_days = CASE
      WHEN p_is_correct THEN LEAST(topic_mastery.interval_days * 2, 30)
      ELSE 1
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_mistake_log(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_topic_mastery(UUID, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------------
-- Mock exam questions RPC (no answer keys)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mock_exam_questions(p_mock_exam_id UUID)
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT,
  sort_order INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug,
    meq.sort_order
  FROM mock_exam_questions meq
  JOIN questions q ON q.id = meq.question_id
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE meq.mock_exam_id = p_mock_exam_id
    AND q.status = 'published'
  ORDER BY meq.sort_order;
$$;

GRANT EXECUTE ON FUNCTION public.get_mock_exam_questions(UUID) TO anon, authenticated;

-- Fetch specific questions for mistake review (no answer keys)
CREATE OR REPLACE FUNCTION public.get_questions_by_ids(p_ids UUID[])
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE q.id = ANY(p_ids)
    AND q.status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.get_questions_by_ids(UUID[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Session answer review
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_session_review(p_session_id UUID)
RETURNS TABLE (
  question_id UUID,
  stem TEXT,
  choices JSONB,
  selected_choice_id TEXT,
  is_correct BOOLEAN,
  correct_choice_id TEXT,
  explanation_en TEXT,
  explanation_fil TEXT,
  time_spent_seconds INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id AS question_id,
    q.stem,
    q.choices,
    qa.selected_choice_id,
    qa.is_correct,
    q.correct_choice_id,
    q.explanation_en,
    q.explanation_fil,
    qa.time_spent_seconds
  FROM quiz_answers qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  JOIN questions q ON q.id = qa.question_id
  WHERE qa.session_id = p_session_id
    AND qs.user_id = auth.uid()
  ORDER BY qa.answered_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_session_review(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard (weekly XP from completed sessions)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 50
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
  WITH weekly AS (
    SELECT
      qs.user_id,
      COALESCE(SUM(qs.item_count), 0)::int AS xp
    FROM quiz_sessions qs
    JOIN exam_types et ON et.id = qs.exam_type_id
    WHERE et.slug = p_exam_slug
      AND qs.completed_at IS NOT NULL
      AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila')
    GROUP BY qs.user_id
  ),
  ranked AS (
    SELECT
      w.user_id,
      COALESCE(u.display_name, split_part(u.email, '@', 1), 'Reviewer') AS display_name,
      w.xp,
      ROW_NUMBER() OVER (ORDER BY w.xp DESC, w.user_id) AS rank
    FROM weekly w
    JOIN users u ON u.id = w.user_id
    WHERE w.xp > 0
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

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- PasaPath: generate / fetch today's plan
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_today_pasapath(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_goal RECORD;
  v_plan JSONB;
  v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
  v_days_left INT;
  v_daily_questions INT;
  v_weak_topic TEXT;
  v_mistake_count INT;
BEGIN
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_goal
  FROM user_exam_goals
  WHERE user_id = v_user_id AND exam_type_id = v_exam_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_goal IS NULL THEN RETURN NULL; END IF;

  SELECT plan_json INTO v_plan
  FROM study_plans
  WHERE user_id = v_user_id
    AND exam_type_id = v_exam_id
    AND is_active = true
    AND (plan_json->>'date')::date = v_today
  ORDER BY generated_at DESC
  LIMIT 1;

  IF v_plan IS NOT NULL THEN RETURN v_plan; END IF;

  v_days_left := GREATEST(COALESCE(v_goal.target_exam_date - v_today, 90), 1);
  v_daily_questions := GREATEST(floor(COALESCE(v_goal.daily_minutes, 30) / 1.5)::int, 5);

  SELECT t.name INTO v_weak_topic
  FROM topic_mastery tm
  JOIN topics t ON t.id = tm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE tm.user_id = v_user_id AND sa.exam_type_id = v_exam_id
  ORDER BY tm.accuracy ASC, tm.attempts DESC
  LIMIT 1;

  SELECT COUNT(*)::int INTO v_mistake_count
  FROM mistake_logs ml
  JOIN questions q ON q.id = ml.question_id
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE ml.user_id = v_user_id
    AND sa.exam_type_id = v_exam_id
    AND ml.mastered_at IS NULL;

  v_plan := jsonb_build_object(
    'date', v_today::text,
    'days_until_exam', v_days_left,
    'daily_minutes', COALESCE(v_goal.daily_minutes, 30),
    'readiness_hint', CASE
      WHEN v_mistake_count > 5 THEN 45
      WHEN v_weak_topic IS NOT NULL THEN 55
      ELSE 35
    END,
    'tasks', jsonb_build_array(
      jsonb_build_object(
        'id', 'weak-practice',
        'type', 'practice',
        'title', COALESCE('Practice: ' || v_weak_topic, 'Daily practice quiz'),
        'minutes', floor(COALESCE(v_goal.daily_minutes, 30) * 0.6)::int,
        'question_count', GREATEST(floor(v_daily_questions * 0.6)::int, 3),
        'completed', false
      ),
      jsonb_build_object(
        'id', 'mistake-review',
        'type', 'mistakes',
        'title', 'Review Mistake Bank',
        'minutes', floor(COALESCE(v_goal.daily_minutes, 30) * 0.25)::int,
        'question_count', LEAST(GREATEST(floor(v_daily_questions * 0.25)::int, 2), v_mistake_count),
        'completed', false
      ),
      jsonb_build_object(
        'id', 'flashcards',
        'type', 'flashcards',
        'title', 'Flashcard review',
        'minutes', floor(COALESCE(v_goal.daily_minutes, 30) * 0.15)::int,
        'question_count', 10,
        'completed', false
      )
    )
  );

  UPDATE study_plans SET is_active = false
  WHERE user_id = v_user_id AND exam_type_id = v_exam_id AND is_active = true;

  INSERT INTO study_plans (user_id, exam_type_id, source, target_date, daily_minutes, plan_json)
  VALUES (
    v_user_id,
    v_exam_id,
    'pasapath_engine',
    v_goal.target_exam_date,
    v_goal.daily_minutes,
    v_plan
  );

  RETURN v_plan;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_pasapath(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed: mini mock exams + flashcards (uses published questions)
-- ---------------------------------------------------------------------------

INSERT INTO mock_exams (id, exam_type_id, title, item_count, duration_seconds, is_active)
SELECT
  gen_random_uuid(),
  et.id,
  et.name || ' — Mini Mock',
  LEAST(5, (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN subject_areas sa ON sa.id = t.subject_area_id WHERE sa.exam_type_id = et.id AND q.status = 'published')),
  600,
  true
FROM exam_types et
WHERE et.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM mock_exams me WHERE me.exam_type_id = et.id AND me.title LIKE '%Mini Mock%'
  );

INSERT INTO mock_exam_questions (mock_exam_id, question_id, sort_order)
SELECT mock_id, question_id, rn FROM (
  SELECT
    me.id AS mock_id,
    q.id AS question_id,
    ROW_NUMBER() OVER (PARTITION BY me.id ORDER BY q.created_at) AS rn
  FROM mock_exams me
  JOIN exam_types et ON et.id = me.exam_type_id
  JOIN subject_areas sa ON sa.exam_type_id = et.id
  JOIN topics t ON t.subject_area_id = sa.id
  JOIN questions q ON q.topic_id = t.id AND q.status = 'published'
  WHERE me.title LIKE '%Mini Mock%'
) sub
WHERE rn <= 5;

INSERT INTO flashcards (topic_id, front, back, is_premium)
SELECT t.id, fc.front, fc.back, false
FROM topics t
JOIN subject_areas sa ON sa.id = t.subject_area_id
JOIN exam_types et ON et.id = sa.exam_type_id
CROSS JOIN (VALUES
  ('Constructivism', 'Learners build knowledge through experience and reflection.'),
  ('Behaviorism', 'Learning is shaped by stimulus and response reinforcement.'),
  ('Zone of Proximal Development', 'The gap between what a learner can do alone vs with guidance.')
) AS fc(front, back)
WHERE et.slug = 'cse-professional' AND t.slug = 'verbal-comprehension'
  AND NOT EXISTS (SELECT 1 FROM flashcards f WHERE f.topic_id = t.id LIMIT 1);
