-- P1 Wave 1: topic analytics, weak-area questions, timed mode in daily limits

-- ---------------------------------------------------------------------------
-- Topic analytics for Progress / Analytics screen
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_exam_topic_analytics(p_exam_slug TEXT)
RETURNS TABLE (
  topic_id UUID,
  topic_slug TEXT,
  topic_name TEXT,
  subject_name TEXT,
  accuracy NUMERIC,
  attempts INT,
  correct_count INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_type_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT et.id INTO v_exam_type_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active;

  IF v_exam_type_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    t.id AS topic_id,
    t.slug AS topic_slug,
    t.name AS topic_name,
    sa.name AS subject_name,
    tm.accuracy,
    tm.attempts,
    tm.correct_count
  FROM topic_mastery tm
  JOIN topics t ON t.id = tm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE tm.user_id = v_user_id
    AND sa.exam_type_id = v_exam_type_id
  ORDER BY tm.accuracy ASC, tm.attempts DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_topic_analytics(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Weak-area quiz: questions from lowest-accuracy topics (Quick 10)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_weak_area_questions(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 10
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_type_id UUID;
  v_answered_today INT := 0;
  v_effective_limit INT;
BEGIN
  SELECT et.id INTO v_exam_type_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active;

  v_effective_limit := greatest(coalesce(p_limit, 10), 1);

  IF v_user_id IS NOT NULL AND v_exam_type_id IS NOT NULL
     AND NOT user_has_content_access(v_exam_type_id) THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = v_user_id
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review', 'timed')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    IF v_answered_today >= 20 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;

    v_effective_limit := least(v_effective_limit, greatest(20 - v_answered_today, 0));
    IF v_effective_limit <= 0 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;
  END IF;

  RETURN QUERY
  WITH weak_topics AS (
    SELECT t.id AS topic_id, tm.accuracy, tm.attempts
    FROM topic_mastery tm
    JOIN topics t ON t.id = tm.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE tm.user_id = v_user_id
      AND sa.exam_type_id = v_exam_type_id
      AND tm.attempts > 0
    ORDER BY tm.accuracy ASC, tm.attempts DESC
    LIMIT 5
  ),
  fallback_topics AS (
    SELECT t.id AS topic_id
    FROM topics t
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_type_id
    ORDER BY random()
    LIMIT 3
  ),
  topic_pool AS (
    SELECT topic_id FROM weak_topics
    UNION
    SELECT topic_id FROM fallback_topics
    WHERE NOT EXISTS (SELECT 1 FROM weak_topics)
  )
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
  WHERE q.status = 'published'
    AND et.slug = p_exam_slug
    AND et.is_active = true
    AND (
      EXISTS (SELECT 1 FROM topic_pool tp WHERE tp.topic_id = t.id)
      OR NOT EXISTS (SELECT 1 FROM weak_topics)
    )
  ORDER BY
    CASE WHEN EXISTS (
      SELECT 1 FROM weak_topics wt WHERE wt.topic_id = t.id
    ) THEN 0 ELSE 1 END,
    random()
  LIMIT v_effective_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weak_area_questions(TEXT, INT) TO authenticated;

-- Include timed sessions in free-tier daily practice cap
CREATE OR REPLACE FUNCTION public.get_practice_questions(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 12,
  p_topic_slug TEXT DEFAULT NULL
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_answered_today INT := 0;
  v_effective_limit INT;
BEGIN
  SELECT et.id INTO v_exam_type_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active;

  v_effective_limit := greatest(p_limit, 1);

  IF auth.uid() IS NOT NULL AND v_exam_type_id IS NOT NULL
     AND NOT user_has_content_access(v_exam_type_id) THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review', 'timed')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    IF v_answered_today >= 20 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;

    v_effective_limit := least(v_effective_limit, greatest(20 - v_answered_today, 0));
    IF v_effective_limit <= 0 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;
  END IF;

  RETURN QUERY
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
  WHERE q.status = 'published'
    AND et.slug = p_exam_slug
    AND et.is_active = true
    AND (p_topic_slug IS NULL OR t.slug = p_topic_slug)
  ORDER BY q.created_at
  LIMIT v_effective_limit;
END;
$$;
