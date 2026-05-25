-- Wave 2: SM-2 flashcards, PasaPath completion, review materials, AI usage, offline pack

-- ---------------------------------------------------------------------------
-- Flashcard spaced repetition (per card, separate from topic_mastery)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30),
  interval_days INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due
  ON flashcard_reviews (user_id, next_review_at);

ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flashcard_reviews_own" ON flashcard_reviews;
CREATE POLICY "flashcard_reviews_own" ON flashcard_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AI explanation daily usage (5/day free tier)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_explanation_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Manila')::date,
  count INT NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE ai_explanation_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_explanation_usage_own" ON ai_explanation_usage;
CREATE POLICY "ai_explanation_usage_own" ON ai_explanation_usage
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Due flashcard count (Home badge)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_due_flashcard_count(p_exam_slug TEXT)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RETURN 0; END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN 0; END IF;

  RETURN (
    SELECT COUNT(*)::int
    FROM flashcards fc
    JOIN topics t ON t.id = fc.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    LEFT JOIN flashcard_reviews fr
      ON fr.flashcard_id = fc.id AND fr.user_id = v_user_id
    WHERE sa.exam_type_id = v_exam_id
      AND (fr.next_review_at IS NULL OR fr.next_review_at <= now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_due_flashcard_count(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Due flashcards deck (SM-2 queue)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_due_flashcards(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 20,
  p_topic_slug TEXT DEFAULT NULL,
  p_subject_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  front TEXT,
  back TEXT,
  topic_slug TEXT,
  topic_name TEXT,
  subject_name TEXT,
  repetitions INT,
  next_review_at TIMESTAMPTZ
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

  SELECT et.id INTO v_exam_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active = true;

  IF v_exam_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    fc.id,
    fc.front,
    fc.back,
    t.slug AS topic_slug,
    t.name AS topic_name,
    sa.name AS subject_name,
    COALESCE(fr.repetitions, 0) AS repetitions,
    fr.next_review_at
  FROM flashcards fc
  JOIN topics t ON t.id = fc.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  LEFT JOIN flashcard_reviews fr
    ON fr.flashcard_id = fc.id AND fr.user_id = v_user_id
  WHERE sa.exam_type_id = v_exam_id
    AND (p_topic_slug IS NULL OR t.slug = p_topic_slug)
    AND (p_subject_slug IS NULL OR sa.slug = p_subject_slug)
    AND (fr.next_review_at IS NULL OR fr.next_review_at <= now())
  ORDER BY fr.next_review_at NULLS FIRST, fc.id
  LIMIT GREATEST(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_due_flashcards(TEXT, INT, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Review a flashcard (rating 1=Again, 2=Hard, 3=Good, 4=Easy)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_flashcard(
  p_flashcard_id UUID,
  p_rating INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ease NUMERIC(4, 2) := 2.50;
  v_interval INT := 0;
  v_reps INT := 0;
  v_next TIMESTAMPTZ;
  v_quality INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_rating NOT BETWEEN 1 AND 4 THEN
    RAISE EXCEPTION 'invalid_rating';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM flashcards WHERE id = p_flashcard_id) THEN
    RAISE EXCEPTION 'flashcard_not_found';
  END IF;

  SELECT fr.ease_factor, fr.interval_days, fr.repetitions
  INTO v_ease, v_interval, v_reps
  FROM flashcard_reviews fr
  WHERE fr.user_id = v_user_id AND fr.flashcard_id = p_flashcard_id;

  v_ease := COALESCE(v_ease, 2.50);
  v_interval := COALESCE(v_interval, 0);
  v_reps := COALESCE(v_reps, 0);

  -- Map 1–4 to SM-2 quality 0–5
  v_quality := CASE p_rating
    WHEN 1 THEN 0
    WHEN 2 THEN 3
    WHEN 3 THEN 4
    WHEN 4 THEN 5
    ELSE 4
  END;

  IF v_quality < 3 THEN
    v_reps := 0;
    v_interval := 1;
    v_ease := GREATEST(1.30, v_ease - 0.20);
  ELSE
    IF v_reps = 0 THEN
      v_interval := 1;
    ELSIF v_reps = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := GREATEST(1, ROUND(v_interval * v_ease)::int);
    END IF;

    v_reps := v_reps + 1;
    v_ease := GREATEST(
      1.30,
      v_ease + (0.1 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02))
    );

    IF p_rating = 2 THEN
      v_interval := GREATEST(1, ROUND(v_interval * 1.2)::int);
      v_ease := GREATEST(1.30, v_ease - 0.15);
    ELSIF p_rating = 4 THEN
      v_interval := GREATEST(1, ROUND(v_interval * 1.3)::int);
    END IF;
  END IF;

  v_next := now() + (v_interval || ' days')::interval;

  INSERT INTO flashcard_reviews (
    user_id, flashcard_id, ease_factor, interval_days, repetitions, next_review_at, last_reviewed_at
  )
  VALUES (v_user_id, p_flashcard_id, v_ease, v_interval, v_reps, v_next, now())
  ON CONFLICT (user_id, flashcard_id) DO UPDATE SET
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    repetitions = EXCLUDED.repetitions,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at;

  RETURN jsonb_build_object(
    'interval_days', v_interval,
    'repetitions', v_reps,
    'next_review_at', v_next,
    'ease_factor', v_ease
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_flashcard(UUID, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- PasaPath: mark a daily task complete
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_pasapath_task(
  p_exam_slug TEXT,
  p_task_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_plan_id UUID;
  v_plan JSONB;
  v_tasks JSONB;
  v_updated_tasks JSONB := '[]'::jsonb;
  v_task JSONB;
  v_i INT;
  v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
  IF v_user_id IS NULL OR p_task_id IS NULL OR p_task_id = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN NULL; END IF;

  SELECT sp.id, sp.plan_json INTO v_plan_id, v_plan
  FROM study_plans sp
  WHERE sp.user_id = v_user_id
    AND sp.exam_type_id = v_exam_id
    AND sp.is_active = true
    AND (sp.plan_json->>'date')::date = v_today
  ORDER BY sp.generated_at DESC
  LIMIT 1;

  IF v_plan IS NULL THEN
    v_plan := public.get_today_pasapath(p_exam_slug);
    IF v_plan IS NULL THEN RETURN NULL; END IF;

    SELECT sp.id, sp.plan_json INTO v_plan_id, v_plan
    FROM study_plans sp
    WHERE sp.user_id = v_user_id
      AND sp.exam_type_id = v_exam_id
      AND sp.is_active = true
      AND (sp.plan_json->>'date')::date = v_today
    ORDER BY sp.generated_at DESC
    LIMIT 1;
  END IF;

  IF v_plan IS NULL OR v_plan_id IS NULL THEN RETURN NULL; END IF;

  v_tasks := COALESCE(v_plan->'tasks', '[]'::jsonb);

  FOR v_i IN 0 .. jsonb_array_length(v_tasks) - 1 LOOP
    v_task := v_tasks->v_i;
    IF v_task->>'id' = p_task_id THEN
      v_task := jsonb_set(v_task, '{completed}', 'true'::jsonb);
    END IF;
    v_updated_tasks := v_updated_tasks || jsonb_build_array(v_task);
  END LOOP;

  v_plan := jsonb_set(v_plan, '{tasks}', v_updated_tasks);

  UPDATE study_plans SET plan_json = v_plan WHERE id = v_plan_id;

  RETURN v_plan;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_pasapath_task(TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Review materials (Notes tab)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_review_materials_by_exam(p_exam_slug TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  material_type TEXT,
  is_premium BOOLEAN,
  topic_slug TEXT,
  topic_name TEXT,
  subject_name TEXT,
  subject_slug TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_premium BOOLEAN := false;
BEGIN
  SELECT et.id INTO v_exam_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active = true;

  IF v_exam_id IS NULL THEN RETURN; END IF;

  IF auth.uid() IS NOT NULL THEN
    v_premium := user_has_content_access(v_exam_id);
  END IF;

  RETURN QUERY
  SELECT
    rm.id,
    rm.title,
    rm.body,
    rm.material_type,
    rm.is_premium,
    t.slug,
    t.name,
    sa.name,
    sa.slug
  FROM review_materials rm
  JOIN topics t ON t.id = rm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE sa.exam_type_id = v_exam_id
    AND (NOT rm.is_premium OR v_premium)
  ORDER BY sa.sort_order NULLS LAST, sa.name, t.sort_order NULLS LAST, t.name, rm.title;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_materials_by_exam(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Offline pack snapshot (premium only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_offline_pack_content(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_premium BOOLEAN := false;
  v_questions JSONB;
  v_flashcards JSONB;
  v_materials JSONB;
BEGIN
  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN
    RETURN jsonb_build_object('error', 'exam_not_found');
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  v_premium := user_has_content_access(v_exam_id);
  IF NOT v_premium THEN
    RETURN jsonb_build_object('error', 'premium_required');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_questions
  FROM (
    SELECT
      q.id,
      q.stem,
      q.choices,
      q.difficulty,
      t.name AS topic_name,
      t.slug AS topic_slug,
      sa.name AS subject_name
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_id AND q.status = 'published'
    ORDER BY q.id
    LIMIT 500
  ) sub;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_flashcards
  FROM (
    SELECT fc.id, fc.front, fc.back, t.slug AS topic_slug, t.name AS topic_name, sa.name AS subject_name
    FROM flashcards fc
    JOIN topics t ON t.id = fc.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_id
  ) sub;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_materials
  FROM (
    SELECT rm.id, rm.title, rm.body, rm.material_type, t.slug AS topic_slug, sa.name AS subject_name
    FROM review_materials rm
    JOIN topics t ON t.id = rm.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_id AND NOT rm.is_premium
  ) sub;

  RETURN jsonb_build_object(
    'exam_slug', p_exam_slug,
    'downloaded_at', now(),
    'questions', v_questions,
    'flashcards', v_flashcards,
    'review_materials', v_materials
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_offline_pack_content(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Extend usage limits (AI + due flashcards)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_usage_limits(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_premium BOOLEAN := false;
  v_answered_today INT := 0;
  v_mini_mock_used BOOLEAN := false;
  v_ai_used INT := 0;
  v_due_flashcards INT := 0;
  v_today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
  SELECT id INTO v_exam_type_id FROM exam_types WHERE slug = p_exam_slug AND is_active LIMIT 1;

  IF auth.uid() IS NULL OR v_exam_type_id IS NULL THEN
    RETURN jsonb_build_object(
      'daily_questions_limit', 20,
      'daily_questions_used', 0,
      'daily_questions_remaining', 20,
      'is_premium', false,
      'mistake_days', 7,
      'mini_mock_available', true,
      'ai_explanations_daily_limit', 5,
      'ai_explanations_used', 0,
      'ai_explanations_remaining', 5,
      'due_flashcards_count', 0
    );
  END IF;

  v_premium := user_has_content_access(v_exam_type_id);

  IF NOT v_premium THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    SELECT EXISTS (
      SELECT 1
      FROM quiz_sessions qs
      JOIN mock_exams me ON me.id = qs.mock_exam_id
      WHERE qs.user_id = auth.uid()
        AND qs.mode = 'mock'
        AND me.exam_type_id = v_exam_type_id
        AND lower(me.title) LIKE '%mini%'
        AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila')
    ) INTO v_mini_mock_used;

    SELECT COALESCE(aeu.count, 0) INTO v_ai_used
    FROM ai_explanation_usage aeu
    WHERE aeu.user_id = auth.uid() AND aeu.usage_date = v_today;
  END IF;

  v_due_flashcards := public.get_due_flashcard_count(p_exam_slug);

  RETURN jsonb_build_object(
    'daily_questions_limit', CASE WHEN v_premium THEN NULL ELSE 20 END,
    'daily_questions_used', v_answered_today,
    'daily_questions_remaining', CASE WHEN v_premium THEN NULL ELSE greatest(0, 20 - v_answered_today) END,
    'is_premium', v_premium,
    'mistake_days', CASE WHEN v_premium THEN NULL ELSE 7 END,
    'mini_mock_available', CASE WHEN v_premium THEN true ELSE NOT v_mini_mock_used END,
    'mock_preview_items', CASE WHEN v_premium THEN NULL ELSE 10 END,
    'ai_explanations_daily_limit', CASE WHEN v_premium THEN NULL ELSE 5 END,
    'ai_explanations_used', v_ai_used,
    'ai_explanations_remaining', CASE WHEN v_premium THEN NULL ELSE greatest(0, 5 - v_ai_used) END,
    'due_flashcards_count', v_due_flashcards
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Seed micro-lessons for CSE Professional
-- ---------------------------------------------------------------------------

INSERT INTO review_materials (topic_id, title, body, material_type, is_premium)
SELECT t.id, seed.title, seed.body, 'lesson', false
FROM (
  VALUES
    (
      'verbal-comprehension',
      'Constructivism in 5 minutes',
      'Constructivism says learners actively build knowledge from experience — hindi passive absorption lang.

Key points:
• Prior knowledge shapes how new info is understood
• Learning happens through reflection and social interaction
• Teachers guide discovery (scaffolding), hindi memorize lang

Exam tip: Look for scenarios where the learner connects new ideas to real classroom experience.'
    ),
    (
      'verbal-comprehension',
      'Behaviorism quick review',
      'Behaviorism focuses on observable behavior shaped by reinforcement.

Key points:
• Stimulus → Response → Reinforcement
• Positive reinforcement increases behavior; punishment decreases it
• Useful for classroom management routines

Exam tip: Distinguish behaviorism from constructivism — behaviorism cares about outward actions, not inner mental models.'
    ),
    (
      'verbal-comprehension',
      'Reading comprehension strategies',
      'Skim the passage first for main idea, then read questions before deep reading.

Key points:
• Identify topic sentence and supporting details
• Watch for transition words (however, therefore, meanwhile)
• Eliminate obviously wrong choices first

Exam tip: CSE verbal items often test inference — the answer may not be quoted word-for-word in the passage.'
    )
) AS seed(topic_slug, title, body)
JOIN topics t ON t.slug = seed.topic_slug
JOIN subject_areas sa ON sa.id = t.subject_area_id
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional'
WHERE NOT EXISTS (
  SELECT 1 FROM review_materials rm
  WHERE rm.topic_id = t.id AND rm.title = seed.title
);
