-- Wave 5: AI tutor, explanation locale, readiness trends, content changelog RPC, tutor usage

-- ---------------------------------------------------------------------------
-- Explanation locale preference
-- ---------------------------------------------------------------------------

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS explanation_locale TEXT NOT NULL DEFAULT 'en'
  CHECK (explanation_locale IN ('en', 'fil'));

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS exam_reminders_enabled BOOLEAN NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- AI tutor daily usage (premium unlimited; free blocked in edge function)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_tutor_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE ai_tutor_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_tutor_usage_own" ON ai_tutor_usage;
CREATE POLICY "ai_tutor_usage_own" ON ai_tutor_usage
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Readiness history for trend charts
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_readiness_history(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 12
)
RETURNS TABLE (
  score SMALLINT,
  computed_at TIMESTAMPTZ
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
  SELECT rs.score_0_100, rs.computed_at
  FROM readiness_snapshots rs
  WHERE rs.user_id = v_user_id
    AND rs.exam_type_id = v_exam_id
  ORDER BY rs.computed_at ASC
  LIMIT greatest(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_readiness_history(TEXT, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Content changelog for mobile + marketing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_content_changelog(
  p_exam_slug TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  exam_slug TEXT,
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
  IF p_exam_slug IS NOT NULL AND p_exam_slug <> '' THEN
    SELECT et.id INTO v_exam_id FROM exam_types et WHERE et.slug = p_exam_slug AND et.is_active = true;
  END IF;

  RETURN QUERY
  SELECT
    cc.id,
    cc.title,
    cc.body,
    et.slug,
    cc.published_at
  FROM content_changelog cc
  LEFT JOIN exam_types et ON et.id = cc.exam_type_id
  WHERE v_exam_id IS NULL OR cc.exam_type_id IS NULL OR cc.exam_type_id = v_exam_id
  ORDER BY cc.published_at DESC
  LIMIT greatest(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_changelog(TEXT, INT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Extend usage limits with AI tutor hints
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
  v_tutor_used INT := 0;
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
      'ai_tutor_available', false,
      'ai_tutor_messages_used', 0,
      'ai_tutor_messages_remaining', 0,
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

    SELECT COALESCE(atu.message_count, 0) INTO v_tutor_used
    FROM ai_tutor_usage atu
    WHERE atu.user_id = auth.uid() AND atu.usage_date = v_today;
  END IF;

  SELECT count(*)::int INTO v_due_flashcards
  FROM get_due_flashcards(p_exam_slug, 100) gdf;

  RETURN jsonb_build_object(
    'daily_questions_limit', CASE WHEN v_premium THEN NULL ELSE 20 END,
    'daily_questions_used', v_answered_today,
    'daily_questions_remaining', CASE WHEN v_premium THEN NULL ELSE greatest(0, 20 - v_answered_today) END,
    'is_premium', v_premium,
    'mistake_days', CASE WHEN v_premium THEN NULL ELSE 7 END,
    'mini_mock_available', NOT v_mini_mock_used,
    'ai_explanations_daily_limit', CASE WHEN v_premium THEN NULL ELSE 5 END,
    'ai_explanations_used', v_ai_used,
    'ai_explanations_remaining', CASE WHEN v_premium THEN NULL ELSE greatest(0, 5 - v_ai_used) END,
    'ai_tutor_available', v_premium,
    'ai_tutor_messages_used', CASE WHEN v_premium THEN 0 ELSE v_tutor_used END,
    'ai_tutor_messages_remaining', CASE WHEN v_premium THEN NULL ELSE 0 END,
    'due_flashcards_count', v_due_flashcards
  );
END;
$$;
