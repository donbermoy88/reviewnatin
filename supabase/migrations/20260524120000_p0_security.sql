-- P0: Security & data integrity (role escalation, answer leak, mistake bank, server grading)

-- ---------------------------------------------------------------------------
-- 1. Block self-service role escalation on public.users
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_users_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot change user id';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_staff_user() THEN
    NEW.role := OLD.role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_guard_profile_update ON public.users;
CREATE TRIGGER users_guard_profile_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_users_profile_update();

-- ---------------------------------------------------------------------------
-- 2. Answer grading RPC — authenticated only (no anon brute-force)
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.check_question_answer(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_question_answer(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Mistake Bank — server-side join (questions table is staff-only direct SELECT)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mistake_bank(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 50
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
  ORDER BY ml.last_wrong_at DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_mistake_bank(TEXT, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Server-side quiz answer grading (ignore client is_correct)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.quiz_answers_apply_grading()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_id TEXT;
BEGIN
  SELECT q.correct_choice_id
  INTO v_correct_id
  FROM questions q
  WHERE q.id = NEW.question_id
    AND q.status = 'published';

  IF v_correct_id IS NULL THEN
    RAISE EXCEPTION 'Unknown or unpublished question';
  END IF;

  NEW.is_correct := (NEW.selected_choice_id IS NOT NULL AND NEW.selected_choice_id = v_correct_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quiz_answers_apply_grading ON public.quiz_answers;
CREATE TRIGGER quiz_answers_apply_grading
  BEFORE INSERT OR UPDATE OF selected_choice_id, question_id ON public.quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.quiz_answers_apply_grading();

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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM quiz_sessions qs
    WHERE qs.id = p_session_id AND qs.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Session not found';
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
  WHERE id = p_session_id
    AND user_id = auth.uid();

  RETURN COALESCE(v_score, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_quiz_session(UUID, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Entitlements — no direct client INSERT (demo via RPC in dev builds only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "entitlements_own" ON public.user_entitlements;

CREATE POLICY "entitlements_select_own" ON public.user_entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.grant_demo_entitlement(
  p_product_id UUID,
  p_exam_type_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM subscription_products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Invalid product';
  END IF;

  INSERT INTO user_entitlements (user_id, product_id, exam_type_id, source, expires_at)
  VALUES (
    auth.uid(),
    p_product_id,
    p_exam_type_id,
    'demo',
    now() + interval '180 days'
  )
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_demo_entitlement(UUID, UUID) TO authenticated;
