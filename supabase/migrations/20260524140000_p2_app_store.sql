-- P2 App Store: account deletion (Apple requirement)

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM quiz_answers
  WHERE session_id IN (SELECT id FROM quiz_sessions WHERE user_id = v_uid);

  DELETE FROM quiz_sessions WHERE user_id = v_uid;
  DELETE FROM diagnostic_sessions WHERE user_id = v_uid;
  DELETE FROM mistake_logs WHERE user_id = v_uid;
  DELETE FROM topic_mastery WHERE user_id = v_uid;
  DELETE FROM readiness_snapshots WHERE user_id = v_uid;
  DELETE FROM study_plans WHERE user_id = v_uid;
  DELETE FROM user_exam_goals WHERE user_id = v_uid;
  DELETE FROM bookmarks WHERE user_id = v_uid;
  DELETE FROM user_entitlements WHERE user_id = v_uid;
  DELETE FROM payment_transactions WHERE user_id = v_uid;
  DELETE FROM reported_questions WHERE user_id = v_uid;
  DELETE FROM user_push_tokens WHERE user_id = v_uid;
  DELETE FROM user_preferences WHERE user_id = v_uid;
  DELETE FROM public.users WHERE id = v_uid;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
