-- Fix subject-domination bug in mock exams / board simulations / "All Subjects"
-- practice: get_practice_questions previously did ORDER BY random() LIMIT n over
-- the WHOLE pool, so subjects with more published questions drowned out the rest.
--
-- New behavior:
--   - Single-topic/subject calls (p_topic_slug provided) are unchanged: a plain
--     random pick within that topic, because the user explicitly chose it.
--   - "All Subjects" calls (p_topic_slug NULL) now allocate a quota per
--     subject_area from subject_areas.weight_percent (the same config the
--     diagnostic flow already trusts), then water-fill any shortfall (a
--     subject with too few questions) into subjects that have spare capacity,
--     so the total still adds up without ever exceeding what's available.
--   - LET Secondary's "major" subject area is scoped to the caller's major
--     (p_major_slug, or — when omitted — the signed-in user's active
--     user_exam_goals.major_slug) so unrelated majors never mix into one test.

DROP FUNCTION IF EXISTS public.get_practice_questions(TEXT, INT, TEXT);

CREATE OR REPLACE FUNCTION public.get_practice_questions(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 12,
  p_topic_slug TEXT DEFAULT NULL,
  p_major_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT,
  image_url TEXT
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_answered_today INT := 0;
  v_effective_limit INT;
  v_resolved_major TEXT := NULLIF(btrim(p_major_slug), '');
  v_subject_ids UUID[];
  v_take INT[];
  v_available INT[];
  v_n INT;
  v_remaining INT;
  v_idx INT;
  v_best_idx INT;
  v_best_capacity INT;
BEGIN
  SELECT et.id INTO v_exam_type_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active;

  v_effective_limit := GREATEST(p_limit, 1);

  IF auth.uid() IS NOT NULL AND v_exam_type_id IS NOT NULL
     AND NOT user_has_content_access(v_exam_type_id) THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review')
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

  -- Specific topic/subject selected: only that pool, simple random pick.
  IF p_topic_slug IS NOT NULL THEN
    RETURN QUERY
    SELECT
      q.id, q.stem, q.choices, q.difficulty,
      t.name AS topic_name, sa.name AS subject_name, et.slug AS exam_slug, q.image_url
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    JOIN exam_types et ON et.id = sa.exam_type_id
    WHERE et.slug = p_exam_slug
      AND et.is_active
      AND q.status = 'published'
      AND t.slug = p_topic_slug
    ORDER BY random()
    LIMIT v_effective_limit;
    RETURN;
  END IF;

  IF v_resolved_major IS NULL AND p_exam_slug = 'let-secondary' AND auth.uid() IS NOT NULL THEN
    SELECT ueg.major_slug INTO v_resolved_major
    FROM user_exam_goals ueg
    WHERE ueg.user_id = auth.uid()
      AND ueg.exam_type_id = v_exam_type_id
      AND ueg.is_active
    LIMIT 1;
  END IF;

  -- Per-subject target quota (from weight_percent) and how many published
  -- questions are actually available for it (major-scoped where relevant).
  SELECT
    array_agg(sa.id ORDER BY sa.sort_order),
    array_agg(GREATEST(0, ROUND(v_effective_limit * COALESCE(sa.weight_percent, 0) / 100.0))::int ORDER BY sa.sort_order),
    array_agg(
      (
        SELECT count(*)
        FROM questions q
        JOIN topics t ON t.id = q.topic_id
        WHERE t.subject_area_id = sa.id
          AND q.status = 'published'
          AND (sa.slug <> 'major' OR v_resolved_major IS NULL OR q.major_slug = v_resolved_major)
      ) ORDER BY sa.sort_order
    )
  INTO v_subject_ids, v_take, v_available
  FROM subject_areas sa
  WHERE sa.exam_type_id = v_exam_type_id;

  v_n := COALESCE(array_length(v_subject_ids, 1), 0);
  IF v_n = 0 THEN
    RETURN;
  END IF;

  -- Never request more from a subject than it actually has.
  FOR v_idx IN 1..v_n LOOP
    v_take[v_idx] := LEAST(v_take[v_idx], v_available[v_idx]);
  END LOOP;

  -- Redistribute any shortfall (from under-stocked subjects) to whichever
  -- subject currently has the most spare capacity, repeating until the quota
  -- is filled or every subject is exhausted.
  v_remaining := v_effective_limit - (SELECT coalesce(sum(x), 0) FROM unnest(v_take) x);
  WHILE v_remaining > 0 LOOP
    v_best_idx := NULL;
    v_best_capacity := 0;
    FOR v_idx IN 1..v_n LOOP
      IF v_available[v_idx] - v_take[v_idx] > v_best_capacity THEN
        v_best_capacity := v_available[v_idx] - v_take[v_idx];
        v_best_idx := v_idx;
      END IF;
    END LOOP;
    EXIT WHEN v_best_idx IS NULL;
    v_take[v_best_idx] := v_take[v_best_idx] + LEAST(v_remaining, v_best_capacity);
    v_remaining := v_remaining - LEAST(v_remaining, v_best_capacity);
  END LOOP;

  RETURN QUERY
  WITH quota(subject_area_id, take) AS (
    SELECT unnest(v_subject_ids), unnest(v_take)
  ),
  ranked AS (
    SELECT
      q.id, q.stem, q.choices, q.difficulty,
      t.name AS topic_name, sa.name AS subject_name, et.slug AS exam_slug, q.image_url,
      ROW_NUMBER() OVER (PARTITION BY sa.id ORDER BY random()) AS rn,
      qo.take
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    JOIN exam_types et ON et.id = sa.exam_type_id
    JOIN quota qo ON qo.subject_area_id = sa.id
    WHERE q.status = 'published'
      AND (sa.slug <> 'major' OR v_resolved_major IS NULL OR q.major_slug = v_resolved_major)
  )
  SELECT ranked.id, ranked.stem, ranked.choices, ranked.difficulty, ranked.topic_name,
         ranked.subject_name, ranked.exam_slug, ranked.image_url
  FROM ranked
  WHERE rn <= take
  ORDER BY random()
  LIMIT v_effective_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_questions(TEXT, INT, TEXT, TEXT) TO anon, authenticated;
