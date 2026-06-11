CREATE OR REPLACE FUNCTION public.set_active_exam_goal(
  p_exam_slug TEXT,
  p_target_exam_date DATE,
  p_daily_minutes SMALLINT,
  p_current_level TEXT,
  p_major_slug TEXT DEFAULT NULL,
  p_onboarding_completed_at TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exam_id UUID;
  v_goal_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to update your goal.';
  END IF;

  IF p_exam_slug IS NULL OR btrim(p_exam_slug) = '' THEN
    RAISE EXCEPTION 'Exam slug is required.';
  END IF;

  IF p_exam_slug = 'let-secondary' AND COALESCE(NULLIF(btrim(p_major_slug), ''), '') = '' THEN
    RAISE EXCEPTION 'Please select a major field for LET Secondary before syncing.';
  END IF;

  SELECT id
  INTO v_exam_id
  FROM public.exam_types
  WHERE slug = p_exam_slug
  LIMIT 1;

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam not found in the database.';
  END IF;

  UPDATE public.user_exam_goals
  SET is_active = false
  WHERE user_id = v_uid
    AND is_active = true;

  INSERT INTO public.user_exam_goals (
    user_id,
    exam_type_id,
    target_exam_date,
    daily_minutes,
    current_level,
    major_slug,
    onboarding_completed_at,
    is_active
  )
  VALUES (
    v_uid,
    v_exam_id,
    p_target_exam_date,
    p_daily_minutes,
    p_current_level,
    NULLIF(btrim(p_major_slug), ''),
    p_onboarding_completed_at,
    true
  )
  RETURNING id INTO v_goal_id;

  RETURN v_goal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_exam_goal(TEXT, DATE, SMALLINT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
