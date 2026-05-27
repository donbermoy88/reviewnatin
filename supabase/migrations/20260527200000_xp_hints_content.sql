-- ============================================================
-- Phase B: XP system + hint credits
-- ============================================================

-- 1. XP column on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hint_credits INT NOT NULL DEFAULT 3;

COMMENT ON COLUMN users.total_xp IS 'Cumulative XP earned across all quiz sessions.';
COMMENT ON COLUMN users.hint_credits IS 'Hint credits replenished daily. Used to eliminate one wrong choice per question.';

-- 2. Award XP when a quiz session is completed
--    +5 XP per correct answer, bonus +10 if score >= 75%
CREATE OR REPLACE FUNCTION public.award_session_xp(
  p_session_id UUID
)
RETURNS INT  -- returns XP awarded this session
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_correct INT;
  v_total   INT;
  v_score   NUMERIC;
  v_xp      INT;
BEGIN
  IF v_user_id IS NULL THEN RETURN 0; END IF;

  SELECT
    count(*) FILTER (WHERE qa.is_correct),
    count(*)
  INTO v_correct, v_total
  FROM quiz_answers qa
  WHERE qa.session_id = p_session_id;

  IF v_total = 0 THEN RETURN 0; END IF;

  v_score := v_correct::NUMERIC / v_total * 100;
  v_xp    := v_correct * 5;

  -- Accuracy bonus
  IF v_score >= 75 THEN
    v_xp := v_xp + 10;
  ELSIF v_score >= 50 THEN
    v_xp := v_xp + 5;
  END IF;

  UPDATE users
  SET total_xp = total_xp + v_xp
  WHERE id = v_user_id;

  RETURN v_xp;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_session_xp(UUID) TO authenticated;

-- 3. Deduct XP when a hint is used
CREATE OR REPLACE FUNCTION public.use_hint()
RETURNS INT  -- returns remaining hint_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_credits INT;
BEGIN
  IF v_user_id IS NULL THEN RETURN 0; END IF;

  UPDATE users
  SET
    hint_credits = GREATEST(hint_credits - 1, 0),
    total_xp     = GREATEST(total_xp - 10, 0)
  WHERE id = v_user_id
  RETURNING hint_credits INTO v_credits;

  RETURN coalesce(v_credits, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_hint() TO authenticated;

-- 4. Replenish 3 hint credits daily (called lazily on load via get_user_stats)
CREATE OR REPLACE FUNCTION public.replenish_hints()
RETURNS INT  -- returns current hint_credits after replenish
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_credits INT;
BEGIN
  IF v_user_id IS NULL THEN RETURN 3; END IF;

  -- Only replenish if user has fewer than 3 and hasn't been replenished today.
  -- We use the last session date as a proxy (simple heuristic).
  UPDATE users
  SET hint_credits = 3
  WHERE id = v_user_id
    AND hint_credits < 3
    AND NOT EXISTS (
      SELECT 1 FROM quiz_sessions qs
      WHERE qs.user_id = v_user_id
        AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila')
      LIMIT 1
    )
  RETURNING hint_credits INTO v_credits;

  SELECT hint_credits INTO v_credits FROM users WHERE id = v_user_id;
  RETURN coalesce(v_credits, 3);
END;
$$;

GRANT EXECUTE ON FUNCTION public.replenish_hints() TO authenticated;

-- 5. Expose XP + hint_credits in a lightweight user-stats fetch
CREATE OR REPLACE FUNCTION public.get_user_xp_stats()
RETURNS TABLE (total_xp INT, hint_credits INT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 0::INT, 3::INT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.total_xp, u.hint_credits
  FROM users u
  WHERE u.id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_xp_stats() TO authenticated;
