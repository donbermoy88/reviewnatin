-- ---------------------------------------------------------------------------
-- Streak freeze: lets a user's daily streak survive ONE missed day.
--
-- - users.streak_freezes is an inventory bought with XP (capped).
-- - The streak trigger consumes a freeze when the user returns after missing
--   exactly one day (last activity 2 days ago), extending the streak instead of
--   resetting it. Missing 2+ days still resets (a single freeze can't cover it).
-- - buy_streak_freeze() spends XP to add one freeze, up to the cap.
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak_freezes INT NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.users.streak_freezes IS 'Streak-freeze inventory. Each freeze can cover one missed day so the streak is not reset.';

-- Updated streak maintenance trigger with single-missed-day freeze support.
CREATE OR REPLACE FUNCTION public.handle_session_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today    DATE := (now() AT TIME ZONE 'Asia/Manila')::DATE;
  v_last     DATE;
  v_streak   INT;
  v_freezes  INT;
BEGIN
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.completed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT streak_count, streak_last_date, streak_freezes
    INTO v_streak, v_last, v_freezes
    FROM users
   WHERE id = NEW.user_id;

  IF v_last = v_today THEN
    -- Already counted today — no-op
    NULL;
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    -- Consecutive day — extend streak
    UPDATE users
       SET streak_count     = v_streak + 1,
           streak_last_date = v_today
     WHERE id = NEW.user_id;
  ELSIF v_last = v_today - INTERVAL '2 days' AND coalesce(v_freezes, 0) > 0 THEN
    -- Missed exactly one day, but a freeze covers it: consume one and keep going.
    UPDATE users
       SET streak_count     = v_streak + 1,
           streak_last_date = v_today,
           streak_freezes   = v_freezes - 1
     WHERE id = NEW.user_id;
  ELSE
    -- Gap of 2+ days or first session — reset to 1
    UPDATE users
       SET streak_count     = 1,
           streak_last_date = v_today
     WHERE id = NEW.user_id;
  END IF;

  PERFORM public.award_user_badges(NEW.user_id);

  RETURN NEW;
END;
$$;

-- Spend XP to buy one streak freeze (capped). Returns the new balances.
CREATE OR REPLACE FUNCTION public.buy_streak_freeze()
RETURNS TABLE (streak_freezes INT, total_xp INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_xp      INT;
  v_freezes INT;
  v_cost    CONSTANT INT := 50;
  v_cap     CONSTANT INT := 3;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.total_xp, u.streak_freezes INTO v_xp, v_freezes FROM users u WHERE u.id = v_uid;

  IF coalesce(v_freezes, 0) >= v_cap THEN
    RAISE EXCEPTION 'streak_freeze_cap_reached' USING ERRCODE = 'P0001', HINT = 'You already hold the maximum number of freezes';
  END IF;
  IF coalesce(v_xp, 0) < v_cost THEN
    RAISE EXCEPTION 'insufficient_xp' USING ERRCODE = 'P0001', HINT = 'Not enough XP for a streak freeze';
  END IF;

  UPDATE users
     SET total_xp       = total_xp - v_cost,
         streak_freezes = streak_freezes + 1
   WHERE id = v_uid
   RETURNING users.streak_freezes, users.total_xp INTO v_freezes, v_xp;

  RETURN QUERY SELECT v_freezes, v_xp;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_streak_freeze() TO authenticated;

NOTIFY pgrst, 'reload schema';
