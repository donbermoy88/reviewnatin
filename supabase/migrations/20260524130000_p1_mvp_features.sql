-- P1 MVP: diagnostic flow, readiness snapshots, mistake bank free-tier filter

-- ---------------------------------------------------------------------------
-- Diagnostic: balanced question set across subject areas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_diagnostic_questions(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 40
)
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
  WITH exam AS (
    SELECT id FROM exam_types WHERE slug = p_exam_slug AND is_active = true
  ),
  quotas AS (
    SELECT
      sa.id AS subject_area_id,
      GREATEST(1, ROUND(p_limit * sa.weight_percent / 100.0)::int) AS quota
    FROM subject_areas sa
    JOIN exam e ON e.id = sa.exam_type_id
  ),
  ranked AS (
    SELECT
      q.id,
      q.stem,
      q.choices,
      q.difficulty,
      t.name AS topic_name,
      sa.name AS subject_name,
      et.slug AS exam_slug,
      ROW_NUMBER() OVER (PARTITION BY sa.id ORDER BY random()) AS rn,
      qo.quota
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    JOIN exam_types et ON et.id = sa.exam_type_id
    JOIN quotas qo ON qo.subject_area_id = sa.id
    WHERE q.status = 'published'
      AND et.slug = p_exam_slug
  )
  SELECT id, stem, choices, difficulty, topic_name, subject_name, exam_slug
  FROM ranked
  WHERE rn <= quota
  ORDER BY random()
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_diagnostic_questions(TEXT, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Has user completed diagnostic for exam?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_completed_diagnostic(p_exam_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM diagnostic_sessions ds
    JOIN exam_types et ON et.id = ds.exam_type_id
    WHERE ds.user_id = auth.uid()
      AND et.slug = p_exam_slug
      AND ds.completed_at IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_completed_diagnostic(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Complete diagnostic session → diagnostic_sessions + readiness baseline
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_diagnostic(
  p_session_id UUID,
  p_duration_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session RECORD;
  v_score NUMERIC(5,2);
  v_score_by_topic JSONB;
  v_score_by_subject JSONB;
  v_readiness SMALLINT;
  v_weak_subjects JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT qs.* INTO v_session
  FROM quiz_sessions qs
  WHERE qs.id = p_session_id
    AND qs.user_id = v_user_id
    AND qs.mode = 'diagnostic';

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Diagnostic session not found';
  END IF;

  SELECT ROUND(
    (COUNT(*) FILTER (WHERE qa.is_correct))::NUMERIC * 100.0 / NULLIF(COUNT(*), 0),
    2
  )
  INTO v_score
  FROM quiz_answers qa
  WHERE qa.session_id = p_session_id;

  UPDATE quiz_sessions
  SET
    score_percent = COALESCE(v_score, 0),
    duration_seconds = GREATEST(p_duration_seconds, 0),
    completed_at = now()
  WHERE id = p_session_id;

  SELECT COALESCE(jsonb_object_agg(topic_name, topic_score), '{}'::jsonb)
  INTO v_score_by_topic
  FROM (
    SELECT
      t.name AS topic_name,
      ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END), 1) AS topic_score
    FROM quiz_answers qa
    JOIN questions q ON q.id = qa.question_id
    JOIN topics t ON t.id = q.topic_id
    WHERE qa.session_id = p_session_id
    GROUP BY t.name
  ) sub;

  SELECT COALESCE(jsonb_object_agg(subject_name, subject_score), '{}'::jsonb)
  INTO v_score_by_subject
  FROM (
    SELECT
      sa.name AS subject_name,
      ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END), 1) AS subject_score
    FROM quiz_answers qa
    JOIN questions q ON q.id = qa.question_id
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE qa.session_id = p_session_id
    GROUP BY sa.name
  ) sub;

  SELECT COALESCE(jsonb_agg(subject_name ORDER BY subject_score ASC), '[]'::jsonb)
  INTO v_weak_subjects
  FROM (
    SELECT
      sa.name AS subject_name,
      ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END), 1) AS subject_score
    FROM quiz_answers qa
    JOIN questions q ON q.id = qa.question_id
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE qa.session_id = p_session_id
    GROUP BY sa.name
    ORDER BY subject_score ASC
    LIMIT 3
  ) weak;

  v_readiness := GREATEST(15, LEAST(35, ROUND(COALESCE(v_score, 0) * 0.35)::int));

  INSERT INTO diagnostic_sessions (
    user_id,
    exam_type_id,
    item_count,
    score_percent,
    score_by_topic,
    duration_seconds,
    completed_at
  )
  VALUES (
    v_user_id,
    v_session.exam_type_id,
    v_session.item_count,
    COALESCE(v_score, 0),
    v_score_by_topic,
    GREATEST(p_duration_seconds, 0),
    now()
  );

  INSERT INTO readiness_snapshots (user_id, exam_type_id, score_0_100, factors)
  VALUES (
    v_user_id,
    v_session.exam_type_id,
    v_readiness,
    jsonb_build_object(
      'source', 'diagnostic_baseline',
      'diagnostic_score', COALESCE(v_score, 0),
      'mock_score_avg', 0,
      'topic_coverage_pct', 0,
      'mistake_mastery_pct', 100,
      'diagnostic_trend', 0,
      'score_by_subject', v_score_by_subject
    )
  );

  RETURN jsonb_build_object(
    'score', COALESCE(v_score, 0),
    'readiness', v_readiness,
    'weak_subjects', v_weak_subjects,
    'score_by_subject', v_score_by_subject
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_diagnostic(UUID, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Latest readiness snapshot for dashboard
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_latest_readiness(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'score', rs.score_0_100,
    'factors', rs.factors,
    'computed_at', rs.computed_at
  )
  FROM readiness_snapshots rs
  JOIN exam_types et ON et.id = rs.exam_type_id
  WHERE rs.user_id = auth.uid()
    AND et.slug = p_exam_slug
  ORDER BY rs.computed_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_latest_readiness(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- PasaPath: use real readiness snapshot when available
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
  v_readiness INT;
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

  SELECT rs.score_0_100 INTO v_readiness
  FROM readiness_snapshots rs
  WHERE rs.user_id = v_user_id AND rs.exam_type_id = v_exam_id
  ORDER BY rs.computed_at DESC
  LIMIT 1;

  IF v_plan IS NOT NULL THEN
    IF v_readiness IS NOT NULL THEN
      v_plan := jsonb_set(v_plan, '{readiness_hint}', to_jsonb(v_readiness));
    END IF;
    RETURN v_plan;
  END IF;

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
    'readiness_hint', COALESCE(
      v_readiness,
      CASE
        WHEN v_mistake_count > 5 THEN 45
        WHEN v_weak_topic IS NOT NULL THEN 55
        ELSE 35
      END
    ),
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
        'question_count', 5,
        'completed', false
      )
    )
  );

  INSERT INTO study_plans (user_id, exam_type_id, source, target_date, daily_minutes, plan_json, is_active)
  VALUES (
    v_user_id,
    v_exam_id,
    'pasapath_engine',
    v_goal.target_exam_date,
    v_goal.daily_minutes,
    v_plan,
    true
  );

  RETURN v_plan;
END;
$$;

-- Mistake bank: optional history window for free tier (days; NULL = all)
DROP FUNCTION IF EXISTS public.get_mistake_bank(TEXT, INT);

CREATE OR REPLACE FUNCTION public.get_mistake_bank(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 50,
  p_days_back INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question_id UUID,
  stem TEXT,
  subject_name TEXT,
  topic_name TEXT,
  times_wrong INT,
  last_wrong_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ml.id,
    ml.question_id,
    q.stem,
    sa.name AS subject_name,
    t.name AS topic_name,
    ml.times_wrong,
    ml.last_wrong_at,
    ml.next_review_at
  FROM mistake_logs ml
  JOIN questions q ON q.id = ml.question_id AND q.status = 'published'
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE ml.user_id = auth.uid()
    AND ml.mastered_at IS NULL
    AND et.slug = p_exam_slug
    AND et.is_active = true
    AND (p_days_back IS NULL OR ml.last_wrong_at >= now() - (p_days_back || ' days')::interval)
  ORDER BY ml.last_wrong_at DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_mistake_bank(TEXT, INT, INT) TO authenticated;
