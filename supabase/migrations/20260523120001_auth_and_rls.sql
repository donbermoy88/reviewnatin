-- Auth: sync Supabase Auth users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_questions ENABLE ROW LEVEL SECURITY;

ALTER TABLE exam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changelog ENABLE ROW LEVEL SECURITY;

-- Public read: catalog + published questions
CREATE POLICY "public_read_exam_categories" ON exam_categories FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_exam_types" ON exam_types FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_exam_blueprints" ON exam_blueprints FOR SELECT USING (true);
CREATE POLICY "public_read_subject_areas" ON subject_areas FOR SELECT USING (true);
CREATE POLICY "public_read_topics" ON topics FOR SELECT USING (true);
CREATE POLICY "public_read_questions" ON questions FOR SELECT USING (status = 'published');
CREATE POLICY "public_read_review_materials" ON review_materials FOR SELECT USING (true);
CREATE POLICY "public_read_flashcards" ON flashcards FOR SELECT USING (true);
CREATE POLICY "public_read_mock_exams" ON mock_exams FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_mock_exam_questions" ON mock_exam_questions FOR SELECT USING (true);
CREATE POLICY "public_read_exam_schedules" ON exam_schedules FOR SELECT USING (true);
CREATE POLICY "public_read_announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "public_read_content_changelog" ON content_changelog FOR SELECT USING (true);

-- User owns their rows
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "goals_own" ON user_exam_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mastery_own" ON topic_mastery FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "diagnostic_own" ON diagnostic_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "plans_own" ON study_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mistakes_own" ON mistake_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "readiness_own" ON readiness_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quiz_sessions_own" ON quiz_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quiz_answers_own" ON quiz_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM quiz_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "bookmarks_own" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "entitlements_own" ON user_entitlements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_own" ON reported_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_select_own" ON reported_questions FOR SELECT USING (auth.uid() = user_id);
