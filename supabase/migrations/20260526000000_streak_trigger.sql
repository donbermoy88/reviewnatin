-- ---------------------------------------------------------------------------
-- Streak maintenance trigger
-- Updates users.streak_count and streak_last_date when a quiz session
-- is completed (completed_at transitions from NULL → non-NULL).
-- Uses Asia/Manila timezone so midnight resets align with PH users.
-- Also calls award_user_badges so streak badges fire automatically.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_session_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'Asia/Manila')::DATE;
  v_last    DATE;
  v_streak  INT;
BEGIN
  -- Only act when completed_at is newly set
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.completed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT streak_count, streak_last_date
    INTO v_streak, v_last
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
  ELSE
    -- Gap or first session — reset to 1
    UPDATE users
       SET streak_count     = 1,
           streak_last_date = v_today
     WHERE id = NEW.user_id;
  END IF;

  -- Award any newly-unlocked badges
  PERFORM public.award_user_badges(NEW.user_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_completed ON quiz_sessions;

CREATE TRIGGER trg_session_completed
  AFTER UPDATE OF completed_at ON quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_session_completed();
