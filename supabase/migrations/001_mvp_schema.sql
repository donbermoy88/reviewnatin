-- ReviewNatin MVP Schema
-- Run against PostgreSQL 15+ (Supabase)
-- See docs/02-database-schema.md for full documentation

-- Enums
CREATE TYPE user_role AS ENUM ('student', 'admin', 'content_reviewer', 'content_author');
CREATE TYPE question_status AS ENUM ('draft', 'in_review', 'published', 'archived');
CREATE TYPE quiz_mode AS ENUM ('practice', 'timed', 'mock', 'diagnostic', 'mistake_review');
CREATE TYPE study_plan_source AS ENUM ('template', 'ai_generated', 'pasapath_engine');
CREATE TYPE subscription_tier AS ENUM ('free', 'exam_pass', 'plus');
CREATE TYPE report_reason AS ENUM ('wrong_answer', 'unclear_question', 'outdated', 'typo', 'other');
CREATE TYPE report_status AS ENUM ('open', 'triaged', 'fixed', 'rejected');
CREATE TYPE payment_provider AS ENUM ('apple', 'google');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded');

-- Catalog
CREATE TABLE exam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES exam_categories(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  official_registration_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phase INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exam_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  version TEXT NOT NULL,
  effective_date DATE NOT NULL,
  topic_weights JSONB NOT NULL DEFAULT '{}',
  mock_exam_config JSONB NOT NULL DEFAULT '{}',
  content_targets JSONB NOT NULL DEFAULT '{}',
  official_source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_type_id, version)
);

CREATE TABLE subject_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  weight_percent NUMERIC(5,2),
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (exam_type_id, slug)
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_area_id UUID NOT NULL REFERENCES subject_areas(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  blueprint_topic_code TEXT,
  UNIQUE (subject_area_id, slug)
);

-- Content
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  blueprint_id UUID REFERENCES exam_blueprints(id),
  stem TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_choice_id TEXT NOT NULL,
  explanation_en TEXT,
  explanation_fil TEXT,
  difficulty SMALLINT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  status question_status NOT NULL DEFAULT 'draft',
  source TEXT DEFAULT 'original',
  source_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id),
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  change_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reported_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id),
  user_id UUID NOT NULL,
  reason report_reason NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE content_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  exam_type_id UUID REFERENCES exam_types(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (extends Supabase auth.users via id)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  locale TEXT NOT NULL DEFAULT 'taglish',
  streak_count INT NOT NULL DEFAULT 0,
  streak_last_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_exam_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  target_exam_date DATE,
  daily_minutes SMALLINT NOT NULL DEFAULT 30,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  major_slug TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics
CREATE TABLE diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  item_count INT NOT NULL,
  score_percent NUMERIC(5,2),
  score_by_topic JSONB NOT NULL DEFAULT '{}',
  duration_seconds INT,
  completed_at TIMESTAMPTZ
);

CREATE TABLE topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  topic_id UUID NOT NULL REFERENCES topics(id),
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 1,
  UNIQUE (user_id, topic_id)
);

CREATE TABLE readiness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  score_0_100 SMALLINT NOT NULL CHECK (score_0_100 BETWEEN 0 AND 100),
  factors JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  source study_plan_source NOT NULL DEFAULT 'pasapath_engine',
  target_date DATE,
  daily_minutes SMALLINT,
  plan_json JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Quiz
CREATE TABLE mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  blueprint_id UUID REFERENCES exam_blueprints(id),
  title TEXT NOT NULL,
  item_count INT NOT NULL,
  duration_seconds INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE mock_exam_questions (
  mock_exam_id UUID NOT NULL REFERENCES mock_exams(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  sort_order INT NOT NULL,
  PRIMARY KEY (mock_exam_id, question_id)
);

CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  mode quiz_mode NOT NULL,
  mock_exam_id UUID REFERENCES mock_exams(id),
  item_count INT NOT NULL,
  score_percent NUMERIC(5,2),
  duration_seconds INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_choice_id TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mistake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  wrong_choice_id TEXT,
  times_wrong INT NOT NULL DEFAULT 1,
  last_wrong_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mastered_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  UNIQUE (user_id, question_id)
);

-- Supplementary
CREATE TABLE review_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'lesson',
  is_premium BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID REFERENCES questions(id),
  review_material_id UUID REFERENCES review_materials(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  source_url TEXT,
  notes TEXT
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  exam_type_id UUID REFERENCES exam_types(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monetization
CREATE TABLE subscription_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  tier subscription_tier NOT NULL,
  exam_type_id UUID REFERENCES exam_types(id),
  price_php INT NOT NULL,
  duration_days INT,
  store TEXT NOT NULL DEFAULT 'both'
);

CREATE TABLE user_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES subscription_products(id),
  exam_type_id UUID REFERENCES exam_types(id),
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'iap',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES subscription_products(id),
  amount_php INT NOT NULL,
  provider payment_provider NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  raw_receipt JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_questions_topic_status ON questions(topic_id, status) WHERE status = 'published';
CREATE INDEX idx_topic_mastery_user_next ON topic_mastery(user_id, next_review_at);
CREATE INDEX idx_mistake_logs_user_review ON mistake_logs(user_id, next_review_at) WHERE mastered_at IS NULL;
CREATE INDEX idx_quiz_sessions_user_exam ON quiz_sessions(user_id, exam_type_id, completed_at DESC);
CREATE INDEX idx_reported_questions_status ON reported_questions(status) WHERE status = 'open';
