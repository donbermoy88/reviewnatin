-- Wave 7: Content counts, admin stats, readiness recompute, weekly summary

-- ---------------------------------------------------------------------------
-- Content counts per exam (admin + content gate)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_content_counts(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_questions INT := 0;
  v_mocks INT := 0;
  v_lessons INT := 0;
  v_flashcards INT := 0;
BEGIN
  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN NULL; END IF;

  SELECT count(*)::int INTO v_questions
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE sa.exam_type_id = v_exam_id AND q.status = 'published';

  SELECT count(*)::int INTO v_mocks
  FROM mock_exams me
  WHERE me.exam_type_id = v_exam_id AND me.is_active = true;

  SELECT count(*)::int INTO v_lessons
  FROM review_materials rm
  JOIN topics t ON t.id = rm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE sa.exam_type_id = v_exam_id;

  SELECT count(*)::int INTO v_flashcards
  FROM flashcards fc
  JOIN topics t ON t.id = fc.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE sa.exam_type_id = v_exam_id;

  RETURN jsonb_build_object(
    'exam_slug', p_exam_slug,
    'questions', v_questions,
    'mock_exams', v_mocks,
    'lessons', v_lessons,
    'flashcards', v_flashcards
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_counts(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Weekly study summary for dashboard
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_weekly_summary(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_answered INT := 0;
  v_sessions INT := 0;
  v_accuracy NUMERIC := NULL;
  v_streak INT := 0;
BEGIN
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN NULL; END IF;

  SELECT
    coalesce(sum(qs.item_count), 0)::int,
    count(*)::int
  INTO v_answered, v_sessions
  FROM quiz_sessions qs
  WHERE qs.user_id = v_user_id
    AND qs.exam_type_id = v_exam_id
    AND qs.completed_at IS NOT NULL
    AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila');

  SELECT round(avg(qs.score_percent))::numeric INTO v_accuracy
  FROM quiz_sessions qs
  WHERE qs.user_id = v_user_id
    AND qs.exam_type_id = v_exam_id
    AND qs.completed_at IS NOT NULL
    AND qs.score_percent IS NOT NULL
    AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila');

  SELECT u.streak_count INTO v_streak FROM users u WHERE u.id = v_user_id;

  RETURN jsonb_build_object(
    'questions_answered', v_answered,
    'sessions_completed', v_sessions,
    'accuracy_percent', v_accuracy,
    'streak_days', coalesce(v_streak, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_summary(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Recompute readiness snapshot for current user + exam
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recompute_user_readiness(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  RETURN public.recompute_user_readiness_for(auth.uid(), p_exam_slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_user_readiness_for(p_user_id UUID, p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_diag_score NUMERIC := NULL;
  v_practice_acc NUMERIC := NULL;
  v_mock_avg NUMERIC := NULL;
  v_topic_pct NUMERIC := 0;
  v_mistake_pct NUMERIC := 100;
  v_score INT;
  v_factors JSONB;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_user');
  END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'exam_not_found');
  END IF;

  SELECT ds.score_percent INTO v_diag_score
  FROM diagnostic_sessions ds
  WHERE ds.user_id = p_user_id AND ds.exam_type_id = v_exam_id
  ORDER BY ds.completed_at DESC
  LIMIT 1;

  SELECT round(avg(qs.score_percent))::numeric INTO v_practice_acc
  FROM quiz_sessions qs
  WHERE qs.user_id = p_user_id
    AND qs.exam_type_id = v_exam_id
    AND qs.completed_at IS NOT NULL
    AND qs.mode IN ('practice', 'timed', 'weak_area', 'board')
    AND qs.completed_at >= now() - interval '14 days';

  SELECT round(avg(qs.score_percent))::numeric INTO v_mock_avg
  FROM quiz_sessions qs
  WHERE qs.user_id = p_user_id
    AND qs.exam_type_id = v_exam_id
    AND qs.mode = 'mock'
    AND qs.completed_at IS NOT NULL;

  SELECT
    CASE WHEN total_topics > 0 THEN round(100.0 * covered_topics / total_topics) ELSE 0 END
  INTO v_topic_pct
  FROM (
    SELECT
      (SELECT count(*) FROM topics t JOIN subject_areas sa ON sa.id = t.subject_area_id WHERE sa.exam_type_id = v_exam_id) AS total_topics,
      (
        SELECT count(DISTINCT q.topic_id)
        FROM quiz_answers qa
        JOIN quiz_sessions qs ON qs.id = qa.session_id
        JOIN questions q ON q.id = qa.question_id
        JOIN topics t ON t.id = q.topic_id
        JOIN subject_areas sa ON sa.id = t.subject_area_id
        WHERE qs.user_id = p_user_id AND sa.exam_type_id = v_exam_id
      ) AS covered_topics
  ) x;

  SELECT
    CASE WHEN total_m > 0 THEN round(100.0 * mastered / total_m) ELSE 100 END
  INTO v_mistake_pct
  FROM (
    SELECT
      count(*) AS total_m,
      count(*) FILTER (WHERE ml.mastered_at IS NOT NULL) AS mastered
    FROM mistake_logs ml
    JOIN questions q ON q.id = ml.question_id
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE ml.user_id = p_user_id AND sa.exam_type_id = v_exam_id
  ) m;

  v_score := GREATEST(
    10,
    LEAST(
      100,
      round(
        coalesce(v_diag_score, coalesce(v_practice_acc, 40)) * 0.35
        + coalesce(v_practice_acc, 0) * 0.30
        + coalesce(v_mock_avg, coalesce(v_practice_acc, 0)) * 0.20
        + v_topic_pct * 0.10
        + v_mistake_pct * 0.05
      )::int
    )
  );

  v_factors := jsonb_build_object(
    'source', 'recomputed',
    'diagnostic_score', v_diag_score,
    'practice_accuracy_14d', v_practice_acc,
    'mock_score_avg', v_mock_avg,
    'topic_coverage_pct', v_topic_pct,
    'mistake_mastery_pct', v_mistake_pct
  );

  INSERT INTO readiness_snapshots (user_id, exam_type_id, score_0_100, factors)
  VALUES (p_user_id, v_exam_id, v_score, v_factors);

  RETURN jsonb_build_object('success', true, 'score', v_score, 'factors', v_factors);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_user_readiness(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_user_readiness_for(UUID, TEXT) TO service_role;

-- Batch recompute for cron (service role via edge function)
CREATE OR REPLACE FUNCTION public.recompute_readiness_batch(p_limit INT DEFAULT 200)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INT := 0;
BEGIN
  FOR v_row IN
    SELECT DISTINCT u.id AS user_id, et.slug AS exam_slug
    FROM users u
    JOIN user_exam_goals ueg ON ueg.user_id = u.id AND ueg.is_active = true
    JOIN exam_types et ON et.id = ueg.exam_type_id
    JOIN quiz_sessions qs ON qs.user_id = u.id AND qs.exam_type_id = et.id
    WHERE qs.completed_at >= now() - interval '7 days'
    LIMIT greatest(p_limit, 1)
  LOOP
    PERFORM public.recompute_user_readiness_for(v_row.user_id, v_row.exam_slug);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('processed', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_readiness_batch(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompute_readiness_batch(INT) TO service_role;

-- ---------------------------------------------------------------------------
-- Admin dashboard stats (staff only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  RETURN jsonb_build_object(
    'users', (SELECT count(*) FROM users),
    'waitlist', (SELECT count(*) FROM waitlist_signups),
    'published_questions', (SELECT count(*) FROM questions WHERE status = 'published'),
    'draft_questions', (SELECT count(*) FROM questions WHERE status = 'draft'),
    'open_reports', (SELECT count(*) FROM reported_questions WHERE status = 'open')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_waitlist_signups(p_limit INT DEFAULT 100)
RETURNS TABLE (
  id UUID,
  email TEXT,
  platform TEXT,
  exam_interest TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT w.id, w.email, w.platform, w.exam_interest, w.created_at
  FROM waitlist_signups w
  ORDER BY w.created_at DESC
  LIMIT greatest(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_waitlist_signups(INT) TO authenticated;
