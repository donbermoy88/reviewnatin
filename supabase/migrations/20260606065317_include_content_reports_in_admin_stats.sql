CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  RETURN jsonb_build_object(
    'users', (SELECT count(*) FROM users),
    'waitlist', (SELECT count(*) FROM waitlist_signups),
    'published_questions', (SELECT count(*) FROM questions WHERE status = 'published'),
    'draft_questions', (SELECT count(*) FROM questions WHERE status = 'draft'),
    'open_reports', (
      SELECT
        (SELECT count(*) FROM reported_questions WHERE status = 'open') +
        (SELECT count(*) FROM content_reports WHERE status = 'open')
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
