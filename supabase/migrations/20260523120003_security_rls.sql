-- ReviewNatin security hardening: RLS gaps, premium content, hidden answer keys

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_content_access(p_exam_type_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM user_entitlements ue
      JOIN subscription_products sp ON sp.id = ue.product_id
      WHERE ue.user_id = auth.uid()
        AND (ue.expires_at IS NULL OR ue.expires_at > now())
        AND (
          sp.tier = 'plus'
          OR ue.exam_type_id = p_exam_type_id
          OR sp.exam_type_id = p_exam_type_id
        )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'content_reviewer', 'content_author')
  );
$$;

-- Practice questions without answer keys or explanations (anti-cheat)
CREATE OR REPLACE FUNCTION public.get_practice_questions(
  p_exam_slug TEXT,
  p_limit INT DEFAULT 12,
  p_topic_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE q.status = 'published'
    AND et.slug = p_exam_slug
    AND et.is_active = true
    AND (p_topic_slug IS NULL OR t.slug = p_topic_slug)
  ORDER BY q.created_at
  LIMIT GREATEST(p_limit, 1);
$$;

-- Server-side grading — correct_choice_id never exposed in list queries
CREATE OR REPLACE FUNCTION public.check_question_answer(
  p_question_id UUID,
  p_choice_id TEXT
)
RETURNS TABLE (
  is_correct BOOLEAN,
  correct_choice_id TEXT,
  explanation_en TEXT,
  explanation_fil TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.correct_choice_id = p_choice_id AS is_correct,
    q.correct_choice_id,
    q.explanation_en,
    q.explanation_fil
  FROM questions q
  WHERE q.id = p_question_id
    AND q.status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.user_has_content_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_practice_questions(TEXT, INT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_question_answer(UUID, TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Questions: remove public direct SELECT (use RPCs above)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "public_read_questions" ON questions;

CREATE POLICY "questions_staff_read" ON questions
  FOR SELECT
  USING (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- Premium supplementary content
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "public_read_review_materials" ON review_materials;
DROP POLICY IF EXISTS "public_read_flashcards" ON flashcards;

CREATE POLICY "read_review_materials" ON review_materials
  FOR SELECT
  USING (
    NOT is_premium
    OR public.user_has_content_access((
      SELECT sa.exam_type_id
      FROM topics t
      JOIN subject_areas sa ON sa.id = t.subject_area_id
      WHERE t.id = review_materials.topic_id
    ))
  );

CREATE POLICY "read_flashcards" ON flashcards
  FOR SELECT
  USING (
    NOT is_premium
    OR public.user_has_content_access((
      SELECT sa.exam_type_id
      FROM topics t
      JOIN subject_areas sa ON sa.id = t.subject_area_id
      WHERE t.id = flashcards.topic_id
    ))
  );

-- ---------------------------------------------------------------------------
-- Previously unprotected tables
-- ---------------------------------------------------------------------------

ALTER TABLE subscription_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_subscription_products" ON subscription_products
  FOR SELECT
  USING (true);

CREATE POLICY "payments_select_own" ON payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "question_versions_staff_read" ON question_versions
  FOR SELECT
  USING (public.is_staff_user());

CREATE POLICY "admin_logs_admin_read" ON admin_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
