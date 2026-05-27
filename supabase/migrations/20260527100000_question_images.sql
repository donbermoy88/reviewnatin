-- ============================================================
-- Question images + abstract-reasoning infrastructure
-- ============================================================
-- Adds image_url to questions table and updates all question-
-- serving RPCs to expose it.  Also provisions a public Storage
-- bucket so question images can be uploaded from the admin site.
-- ============================================================

-- 1. Column -------------------------------------------------
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN questions.image_url IS
  'Public Supabase Storage URL for diagram/abstract-reasoning images. NULL = text-only question.';

-- 2. Storage bucket -----------------------------------------
-- Create a public bucket for question images.
-- (Supabase will ignore this if the bucket already exists.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  5242880,   -- 5 MB per image
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read public images; only service_role can upload.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read question images'
  ) THEN
    CREATE POLICY "Public read question images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'question-images');
  END IF;
END $$;

-- 3. Abstract Reasoning subject areas -----------------------
-- Add Abstract Reasoning to CSE Professional and CSE Sub-professional.
-- This is the ONLY CSE subject that legally requires images; all other
-- subjects (Verbal, Numerical, General Information) are text-only.

DO $$
DECLARE
  v_cse_pro_id   UUID;
  v_cse_sub_id   UUID;
  v_ar_pro_id    UUID;
  v_ar_sub_id    UUID;
BEGIN
  SELECT id INTO v_cse_pro_id FROM exam_types WHERE slug = 'cse-professional';
  SELECT id INTO v_cse_sub_id FROM exam_types WHERE slug = 'cse-subprofessional';

  -- CSE Professional – Abstract Reasoning (weight 10 % per CSC blueprint)
  IF v_cse_pro_id IS NOT NULL THEN
    INSERT INTO subject_areas (exam_type_id, slug, name, sort_order, weight_percent)
    VALUES (v_cse_pro_id, 'abstract', 'Abstract Reasoning', 5, 10)
    ON CONFLICT (exam_type_id, slug) DO NOTHING
    RETURNING id INTO v_ar_pro_id;

    IF v_ar_pro_id IS NOT NULL THEN
      INSERT INTO topics (subject_area_id, slug, name, sort_order)
      VALUES
        (v_ar_pro_id, 'pattern-completion',  'Pattern Completion',  1),
        (v_ar_pro_id, 'series-completion',   'Series Completion',   2),
        (v_ar_pro_id, 'analogies',           'Figural Analogies',   3),
        (v_ar_pro_id, 'odd-one-out',         'Odd One Out',         4)
      ON CONFLICT (subject_area_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- CSE Sub-professional – Abstract Reasoning (same topics)
  IF v_cse_sub_id IS NOT NULL THEN
    INSERT INTO subject_areas (exam_type_id, slug, name, sort_order, weight_percent)
    VALUES (v_cse_sub_id, 'abstract', 'Abstract Reasoning', 5, 10)
    ON CONFLICT (exam_type_id, slug) DO NOTHING
    RETURNING id INTO v_ar_sub_id;

    IF v_ar_sub_id IS NOT NULL THEN
      INSERT INTO topics (subject_area_id, slug, name, sort_order)
      VALUES
        (v_ar_sub_id, 'pattern-completion', 'Pattern Completion', 1),
        (v_ar_sub_id, 'series-completion',  'Series Completion',  2),
        (v_ar_sub_id, 'analogies',          'Figural Analogies',  3),
        (v_ar_sub_id, 'odd-one-out',        'Odd One Out',        4)
      ON CONFLICT (subject_area_id, slug) DO NOTHING;
    END IF;
  END IF;
END $$;

-- 4. Update RPCs to expose image_url -----------------------
-- Must DROP first because PostgreSQL won't let CREATE OR REPLACE
-- change the return type signature (adding image_url column).

DROP FUNCTION IF EXISTS public.get_practice_questions(TEXT, INT, TEXT);
DROP FUNCTION IF EXISTS public.get_questions_by_ids(UUID[]);

-- get_practice_questions
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
  exam_slug TEXT,
  image_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_type_id UUID;
  v_answered_today INT := 0;
  v_effective_limit INT;
BEGIN
  SELECT et.id INTO v_exam_type_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active;

  v_effective_limit := greatest(p_limit, 1);

  IF auth.uid() IS NOT NULL AND v_exam_type_id IS NOT NULL
     AND NOT user_has_content_access(v_exam_type_id) THEN
    SELECT coalesce(sum(qs.item_count), 0)::int INTO v_answered_today
    FROM quiz_sessions qs
    WHERE qs.user_id = auth.uid()
      AND qs.exam_type_id = v_exam_type_id
      AND qs.mode IN ('practice', 'mistake_review')
      AND qs.completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila');

    IF v_answered_today >= 20 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;

    v_effective_limit := least(v_effective_limit, greatest(20 - v_answered_today, 0));
    IF v_effective_limit <= 0 THEN
      RAISE EXCEPTION 'daily_question_limit_reached'
        USING ERRCODE = 'P0001', HINT = 'Free tier allows 20 practice questions per day';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name  AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug,
    q.image_url
  FROM questions q
  JOIN topics       t  ON t.id  = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types   et ON et.id = sa.exam_type_id
  WHERE et.slug = p_exam_slug
    AND et.is_active
    AND q.status = 'published'
    AND (p_topic_slug IS NULL OR t.slug = p_topic_slug)
  ORDER BY random()
  LIMIT v_effective_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_questions(TEXT, INT, TEXT) TO anon, authenticated;

-- get_questions_by_ids (used for mistake review and bookmarks)
CREATE OR REPLACE FUNCTION public.get_questions_by_ids(p_ids UUID[])
RETURNS TABLE (
  id UUID,
  stem TEXT,
  choices JSONB,
  difficulty SMALLINT,
  topic_name TEXT,
  subject_name TEXT,
  exam_slug TEXT,
  image_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.stem,
    q.choices,
    q.difficulty,
    t.name  AS topic_name,
    sa.name AS subject_name,
    et.slug AS exam_slug,
    q.image_url
  FROM questions q
  JOIN topics       t  ON t.id  = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types   et ON et.id = sa.exam_type_id
  WHERE q.id = ANY(p_ids)
    AND q.status = 'published'
  ORDER BY array_position(p_ids, q.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_questions_by_ids(UUID[]) TO authenticated;
