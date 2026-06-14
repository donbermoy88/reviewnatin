-- Release-blocker reliability fixes from the premium/free simulator audit.
-- - Grade strict/mock sessions against intended item_count so unanswered items
--   are wrong, not silently removed from the denominator.
-- - Respect entitlement lifecycle status for premium content access.
-- - Keep fresh free users' AI explanation quota at 5 instead of NULL math -> 0.
-- - Do not consume the weekly mini-mock slot for timer-expired sessions with
--   zero submitted answers.

CREATE OR REPLACE FUNCTION public.user_has_content_access(p_exam_type_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_entitlements ue
      JOIN public.subscription_products sp ON sp.id = ue.product_id
      WHERE ue.user_id = auth.uid()
        AND ue.revoked_at IS NULL
        AND COALESCE(ue.status::text, 'active') NOT IN ('expired', 'refunded', 'revoked')
        AND (
          COALESCE(ue.grace_period_expires_at, ue.current_period_end, ue.expires_at) IS NULL
          OR COALESCE(ue.grace_period_expires_at, ue.current_period_end, ue.expires_at) > now()
        )
        AND (
          sp.tier = 'plus'
          OR ue.exam_type_id = p_exam_type_id
          OR sp.exam_type_id = p_exam_type_id
        )
    )
  END;
$$;
GRANT EXECUTE ON FUNCTION public.user_has_content_access(UUID) TO authenticated;
CREATE OR REPLACE FUNCTION public.complete_quiz_session(
  p_session_id UUID,
  p_duration_seconds INT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score NUMERIC(5,2);
  v_item_count INT;
  v_correct_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT qs.item_count
  INTO v_item_count
  FROM public.quiz_sessions qs
  WHERE qs.id = p_session_id
    AND qs.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  SELECT (COUNT(*) FILTER (WHERE qa.is_correct))::INT
  INTO v_correct_count
  FROM public.quiz_answers qa
  WHERE qa.session_id = p_session_id;

  v_score := ROUND(
    COALESCE(v_correct_count, 0)::NUMERIC * 100.0 / NULLIF(GREATEST(v_item_count, 0), 0),
    2
  );

  UPDATE public.quiz_sessions
  SET
    score_percent = COALESCE(v_score, 0),
    duration_seconds = GREATEST(p_duration_seconds, 0),
    completed_at = now()
  WHERE id = p_session_id
    AND user_id = auth.uid();

  RETURN COALESCE(v_score, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_quiz_session(UUID, INT) TO authenticated;
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
  SELECT id INTO v_exam_type_id FROM public.exam_types WHERE slug = p_exam_slug AND is_active LIMIT 1;

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

  v_premium := public.user_has_content_access(v_exam_type_id);

  IF NOT v_premium THEN
    SELECT COALESCE(SUM(qs.item_count), 0)::INT INTO v_answered_today
    FROM public.quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    SELECT EXISTS (
      SELECT 1
      FROM public.quiz_sessions qs
      JOIN public.mock_exams me ON me.id = qs.mock_exam_id
      WHERE qs.user_id = auth.uid()
        AND qs.mode = 'mock'
        AND me.exam_type_id = v_exam_type_id
        AND lower(me.title) LIKE '%mini%'
        AND qs.completed_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Manila')
        AND EXISTS (
          SELECT 1
          FROM public.quiz_answers qa
          WHERE qa.session_id = qs.id
        )
    ) INTO v_mini_mock_used;

    SELECT COALESCE(aeu.count, 0) INTO v_ai_used
    FROM public.ai_explanation_usage aeu
    WHERE aeu.user_id = auth.uid() AND aeu.usage_date = v_today;

    SELECT COALESCE(atu.message_count, 0) INTO v_tutor_used
    FROM public.ai_tutor_usage atu
    WHERE atu.user_id = auth.uid() AND atu.usage_date = v_today;
  END IF;

  SELECT COUNT(*)::INT INTO v_due_flashcards
  FROM public.get_due_flashcards(p_exam_slug, 100) gdf;

  RETURN jsonb_build_object(
    'daily_questions_limit', CASE WHEN v_premium THEN NULL ELSE 20 END,
    'daily_questions_used', v_answered_today,
    'daily_questions_remaining', CASE WHEN v_premium THEN NULL ELSE GREATEST(0, 20 - v_answered_today) END,
    'is_premium', v_premium,
    'mistake_days', CASE WHEN v_premium THEN NULL ELSE 7 END,
    'mini_mock_available', NOT v_mini_mock_used,
    'mock_preview_items', CASE WHEN v_premium THEN NULL ELSE 10 END,
    'ai_explanations_daily_limit', CASE WHEN v_premium THEN NULL ELSE 5 END,
    'ai_explanations_used', COALESCE(v_ai_used, 0),
    'ai_explanations_remaining', CASE WHEN v_premium THEN NULL ELSE GREATEST(0, 5 - COALESCE(v_ai_used, 0)) END,
    'ai_tutor_available', v_premium,
    'ai_tutor_messages_used', CASE WHEN v_premium THEN 0 ELSE COALESCE(v_tutor_used, 0) END,
    'ai_tutor_messages_remaining', CASE WHEN v_premium THEN NULL ELSE 0 END,
    'due_flashcards_count', COALESCE(v_due_flashcards, 0)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_usage_limits(TEXT) TO authenticated;
