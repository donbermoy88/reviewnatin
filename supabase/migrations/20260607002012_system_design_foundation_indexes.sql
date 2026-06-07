-- System-design foundation indexes for ReviewNatin mobile scale.
-- These are intentionally not sharding/replication changes. Supabase handles
-- infrastructure for the current stage; the app needs better access-path
-- indexes for its hot reads and queues first.

-- Active exam catalog lookup by slug.
CREATE INDEX IF NOT EXISTS idx_exam_types_active_slug
  ON public.exam_types(slug)
  WHERE is_active = true;

-- Subject and topic listing/navigation by exam, subject, and topic slug.
CREATE INDEX IF NOT EXISTS idx_subject_areas_exam_sort
  ON public.subject_areas(exam_type_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_subject_areas_exam_slug
  ON public.subject_areas(exam_type_id, slug);

CREATE INDEX IF NOT EXISTS idx_topics_subject_sort
  ON public.topics(subject_area_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_topics_subject_slug
  ON public.topics(subject_area_id, slug);

-- Practice question RPC filters by published status, topic, and exam join path.
CREATE INDEX IF NOT EXISTS idx_questions_published_topic
  ON public.questions(topic_id, id)
  WHERE status = 'published';

-- Flashcard count/list and due-card RPC joins by topic.
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_id
  ON public.flashcards(topic_id, id);

-- Review materials list by exam/topic/material type and premium visibility.
CREATE INDEX IF NOT EXISTS idx_review_materials_topic_type_premium
  ON public.review_materials(topic_id, material_type, is_premium, title);

-- Mock list by exam and active status.
CREATE INDEX IF NOT EXISTS idx_mock_exams_exam_active
  ON public.mock_exams(exam_type_id, is_active, title);

-- Daily free-tier limit and progress/history reads.
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_exam_mode_completed
  ON public.quiz_sessions(user_id, exam_type_id, mode, completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- User report queue reads and admin triage filters.
CREATE INDEX IF NOT EXISTS idx_content_reports_user_open_updated
  ON public.content_reports(user_id, updated_at DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_content_reports_status_type_created
  ON public.content_reports(status, content_type, created_at DESC);
