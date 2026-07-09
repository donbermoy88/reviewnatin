-- Reduce remaining Supabase advisor warnings without expanding client access.
--
-- Changes:
-- - Add explicit deny policies to internal/no-client tables so their intended
--   RLS posture is visible to humans and linters.
-- - Evaluate auth.uid() once per statement in RLS policies.
-- - Merge overlapping community owner/admin policies.
-- - Drop one duplicate flashcard_reviews index.

DROP POLICY IF EXISTS "no_client_access_auth_login_events" ON public.auth_login_events;
CREATE POLICY "no_client_access_auth_login_events"
  ON public.auth_login_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no_client_access_blocked_email_domains" ON public.blocked_email_domains;
CREATE POLICY "no_client_access_blocked_email_domains"
  ON public.blocked_email_domains
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no_client_access_rate_limit_checks" ON public.rate_limit_checks;
CREATE POLICY "no_client_access_rate_limit_checks"
  ON public.rate_limit_checks
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no_client_access_store_subscription_events" ON public.store_subscription_events;
CREATE POLICY "no_client_access_store_subscription_events"
  ON public.store_subscription_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no_client_access_taxonomy_backup" ON public.let_secondary_major_taxonomy_2026_backup;
CREATE POLICY "no_client_access_taxonomy_backup"
  ON public.let_secondary_major_taxonomy_2026_backup
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no_client_access_taxonomy_manual_review" ON public.let_secondary_major_taxonomy_2026_manual_review;
CREATE POLICY "no_client_access_taxonomy_manual_review"
  ON public.let_secondary_major_taxonomy_2026_manual_review
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "admin_logs_admin_read" ON public.admin_logs;
CREATE POLICY "admin_logs_admin_read"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "ai_explanation_usage_own" ON public.ai_explanation_usage;
CREATE POLICY "ai_explanation_usage_own"
  ON public.ai_explanation_usage
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "ai_tutor_usage_own" ON public.ai_tutor_usage;
CREATE POLICY "ai_tutor_usage_own"
  ON public.ai_tutor_usage
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "barkada_challenge_results_member_read" ON public.barkada_challenge_results;
CREATE POLICY "barkada_challenge_results_member_read"
  ON public.barkada_challenge_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.barkada_challenges bc
      JOIN public.barkada_members bm ON bm.group_id = bc.group_id
      WHERE bc.id = barkada_challenge_results.challenge_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "barkada_challenges_member_read" ON public.barkada_challenges;
CREATE POLICY "barkada_challenges_member_read"
  ON public.barkada_challenges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.barkada_members bm
      WHERE bm.group_id = barkada_challenges.group_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "barkada_groups_member_read" ON public.barkada_groups;
CREATE POLICY "barkada_groups_member_read"
  ON public.barkada_groups
  FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.barkada_members bm
      WHERE bm.group_id = barkada_groups.id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "barkada_members_read" ON public.barkada_members;
CREATE POLICY "barkada_members_read"
  ON public.barkada_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.barkada_members bm
      WHERE bm.group_id = barkada_members.group_id
        AND bm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "bookmarks_own" ON public.bookmarks;
CREATE POLICY "bookmarks_own"
  ON public.bookmarks
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "community_comments_admin_moderate" ON public.community_comments;
DROP POLICY IF EXISTS "community_comments_owner_update" ON public.community_comments;
CREATE POLICY "community_comments_update"
  ON public.community_comments
  FOR UPDATE
  TO authenticated
  USING (((SELECT auth.uid()) = author_id) OR public.is_community_admin())
  WITH CHECK (((SELECT auth.uid()) = author_id) OR public.is_community_admin());

DROP POLICY IF EXISTS "community_comments_owner_write" ON public.community_comments;
CREATE POLICY "community_comments_owner_write"
  ON public.community_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND (
      SELECT u.community_status
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
    ) = 'active'
  );

DROP POLICY IF EXISTS "community_follows_own_delete" ON public.community_follows;
CREATE POLICY "community_follows_own_delete"
  ON public.community_follows
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = follower_id);

DROP POLICY IF EXISTS "community_follows_own_write" ON public.community_follows;
CREATE POLICY "community_follows_own_write"
  ON public.community_follows
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = follower_id);

DROP POLICY IF EXISTS "community_post_likes_own_delete" ON public.community_post_likes;
CREATE POLICY "community_post_likes_own_delete"
  ON public.community_post_likes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "community_post_likes_own_write" ON public.community_post_likes;
CREATE POLICY "community_post_likes_own_write"
  ON public.community_post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "community_post_saves_own_delete" ON public.community_post_saves;
CREATE POLICY "community_post_saves_own_delete"
  ON public.community_post_saves
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "community_post_saves_own_write" ON public.community_post_saves;
CREATE POLICY "community_post_saves_own_write"
  ON public.community_post_saves
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "community_posts_admin_moderate" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_owner_update" ON public.community_posts;
CREATE POLICY "community_posts_update"
  ON public.community_posts
  FOR UPDATE
  TO authenticated
  USING (((SELECT auth.uid()) = author_id) OR public.is_community_admin())
  WITH CHECK (((SELECT auth.uid()) = author_id) OR public.is_community_admin());

DROP POLICY IF EXISTS "community_posts_owner_write" ON public.community_posts;
CREATE POLICY "community_posts_owner_write"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND (
      SELECT u.community_status
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
    ) = 'active'
  );

DROP POLICY IF EXISTS "community_reports_admin_read" ON public.community_reports;
DROP POLICY IF EXISTS "community_reports_own_read" ON public.community_reports;
CREATE POLICY "community_reports_read"
  ON public.community_reports
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid()) = reporter_id) OR public.is_community_admin());

DROP POLICY IF EXISTS "community_reports_own_insert" ON public.community_reports;
CREATE POLICY "community_reports_own_insert"
  ON public.community_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "community_user_blocks_own_delete" ON public.community_user_blocks;
CREATE POLICY "community_user_blocks_own_delete"
  ON public.community_user_blocks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "community_user_blocks_own_read" ON public.community_user_blocks;
CREATE POLICY "community_user_blocks_own_read"
  ON public.community_user_blocks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "community_user_blocks_own_write" ON public.community_user_blocks;
CREATE POLICY "community_user_blocks_own_write"
  ON public.community_user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "content_report_events_staff_insert" ON public.content_report_events;
CREATE POLICY "content_report_events_staff_insert"
  ON public.content_report_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.role = ANY (ARRAY['admin'::user_role, 'content_reviewer'::user_role, 'content_author'::user_role])
    )
  );

DROP POLICY IF EXISTS "content_report_events_staff_select" ON public.content_report_events;
CREATE POLICY "content_report_events_staff_select"
  ON public.content_report_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.role = ANY (ARRAY['admin'::user_role, 'content_reviewer'::user_role, 'content_author'::user_role])
    )
  );

DROP POLICY IF EXISTS "content_reports_insert_own" ON public.content_reports;
CREATE POLICY "content_reports_insert_own"
  ON public.content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "content_reports_select_own" ON public.content_reports;
CREATE POLICY "content_reports_select_own"
  ON public.content_reports
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "content_reports_update_own_open" ON public.content_reports;
CREATE POLICY "content_reports_update_own_open"
  ON public.content_reports
  FOR UPDATE
  TO authenticated
  USING (((SELECT auth.uid()) = user_id) AND status = 'open'::report_status)
  WITH CHECK (((SELECT auth.uid()) = user_id) AND status = 'open'::report_status);

DROP POLICY IF EXISTS "diagnostic_own" ON public.diagnostic_sessions;
CREATE POLICY "diagnostic_own"
  ON public.diagnostic_sessions
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "flashcard_reviews_own" ON public.flashcard_reviews;
CREATE POLICY "flashcard_reviews_own"
  ON public.flashcard_reviews
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "mistakes_own" ON public.mistake_logs;
CREATE POLICY "mistakes_own"
  ON public.mistake_logs
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "payments_select_own" ON public.payment_transactions;
CREATE POLICY "payments_select_own"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "quiz_answers_own" ON public.quiz_answers;
CREATE POLICY "quiz_answers_own"
  ON public.quiz_answers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_sessions s
      WHERE s.id = quiz_answers.session_id
        AND s.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "quiz_sessions_own" ON public.quiz_sessions;
CREATE POLICY "quiz_sessions_own"
  ON public.quiz_sessions
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "readiness_own" ON public.readiness_snapshots;
CREATE POLICY "readiness_own"
  ON public.readiness_snapshots
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reports_own" ON public.reported_questions;
CREATE POLICY "reports_own"
  ON public.reported_questions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reports_select_own" ON public.reported_questions;
CREATE POLICY "reports_select_own"
  ON public.reported_questions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "plans_own" ON public.study_plans;
CREATE POLICY "plans_own"
  ON public.study_plans
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "mastery_own" ON public.topic_mastery;
CREATE POLICY "mastery_own"
  ON public.topic_mastery
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_badges_own" ON public.user_badges;
CREATE POLICY "user_badges_own"
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "entitlements_select_own" ON public.user_entitlements;
CREATE POLICY "entitlements_select_own"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "goals_own" ON public.user_exam_goals;
CREATE POLICY "goals_own"
  ON public.user_exam_goals
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_notes_delete_own" ON public.user_notes;
CREATE POLICY "user_notes_delete_own"
  ON public.user_notes
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_notes_insert_own" ON public.user_notes;
CREATE POLICY "user_notes_insert_own"
  ON public.user_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_notes_select_own" ON public.user_notes;
CREATE POLICY "user_notes_select_own"
  ON public.user_notes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_notes_update_own" ON public.user_notes;
CREATE POLICY "user_notes_update_own"
  ON public.user_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "prefs_own" ON public.user_preferences;
CREATE POLICY "prefs_own"
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "push_tokens_own" ON public.user_push_tokens;
CREATE POLICY "push_tokens_own"
  ON public.user_push_tokens
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "service_read_waitlist" ON public.waitlist_signups;
CREATE POLICY "service_read_waitlist"
  ON public.waitlist_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.role = ANY (ARRAY['admin'::user_role, 'content_reviewer'::user_role])
    )
  );

DROP POLICY IF EXISTS "web_checkout_own" ON public.web_checkout_sessions;
CREATE POLICY "web_checkout_own"
  ON public.web_checkout_sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP INDEX IF EXISTS public.idx_flashcard_reviews_user;
