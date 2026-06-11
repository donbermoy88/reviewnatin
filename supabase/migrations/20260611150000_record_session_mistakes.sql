-- ---------------------------------------------------------------------------
-- record_session_outcomes: apply post-quiz outcomes (topic mastery + mistake
-- bank) from a completed session's already-graded answers, in one server call.
--
-- Practice mode records outcomes per-answer from the client (recordQuizOutcome →
-- update_topic_mastery + upsert_mistake_log). Strict exams (mock/board) use a
-- deferred answer-sheet model with no per-answer client grading, so they call
-- this once at submit instead. It reuses the same tested functions, only touches
-- the owner's own session, and practice mode does NOT call it — so there is no
-- double-counting.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_session_outcomes(p_session_id UUID)
RETURNS INT  -- number of wrong answers logged to the mistake bank
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_count INT := 0;
  r       RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM quiz_sessions qs
    WHERE qs.id = p_session_id AND qs.user_id = v_uid
  ) THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT qa.question_id, qa.selected_choice_id, qa.is_correct
    FROM quiz_answers qa
    WHERE qa.session_id = p_session_id
      AND qa.selected_choice_id IS NOT NULL
  LOOP
    PERFORM public.update_topic_mastery(r.question_id, COALESCE(r.is_correct, FALSE));
    IF r.is_correct IS FALSE THEN
      PERFORM public.upsert_mistake_log(r.question_id, r.selected_choice_id);
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_session_outcomes(UUID) TO authenticated;
