-- Remove the token-backed chat feature from the final schema.
-- Question explanations remain available through ai-explain.

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
    'due_flashcards_count', v_due_flashcards
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_limits(TEXT) TO authenticated;

DROP TABLE IF EXISTS public.ai_tutor_usage;
