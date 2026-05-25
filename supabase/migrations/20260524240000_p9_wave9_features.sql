-- Wave 9: Offline pack answer data, staff question edit/publish RPCs

-- ---------------------------------------------------------------------------
-- Offline pack includes answer keys + explanations (premium download only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_offline_pack_content(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_premium BOOLEAN := false;
  v_questions JSONB;
  v_flashcards JSONB;
  v_materials JSONB;
BEGIN
  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN
    RETURN jsonb_build_object('error', 'exam_not_found');
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  v_premium := user_has_content_access(v_exam_id);
  IF NOT v_premium THEN
    RETURN jsonb_build_object('error', 'premium_required');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_questions
  FROM (
    SELECT
      q.id,
      q.stem,
      q.choices,
      q.correct_choice_id,
      q.explanation_en,
      q.explanation_fil,
      q.difficulty,
      t.name AS topic_name,
      t.slug AS topic_slug,
      sa.name AS subject_name
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_id AND q.status = 'published'
    ORDER BY q.id
    LIMIT 500
  ) sub;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_flashcards
  FROM (
    SELECT fc.id, fc.front, fc.back, t.slug AS topic_slug, t.name AS topic_name, sa.name AS subject_name
    FROM flashcards fc
    JOIN topics t ON t.id = fc.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_id
  ) sub;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_materials
  FROM (
    SELECT rm.id, rm.title, rm.body, rm.material_type, t.slug AS topic_slug, sa.name AS subject_name
    FROM review_materials rm
    JOIN topics t ON t.id = rm.topic_id
    JOIN subject_areas sa ON sa.id = t.subject_area_id
    WHERE sa.exam_type_id = v_exam_id AND NOT rm.is_premium
  ) sub;

  RETURN jsonb_build_object(
    'exam_slug', p_exam_slug,
    'downloaded_at', now(),
    'questions', v_questions,
    'flashcards', v_flashcards,
    'review_materials', v_materials
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Staff question fetch + status update
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_question_for_staff(p_question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_row RECORD;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer', 'content_author') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT
    q.id,
    q.stem,
    q.choices,
    q.correct_choice_id,
    q.explanation_en,
    q.explanation_fil,
    q.difficulty,
    q.status,
    q.is_verified,
    t.slug AS topic_slug,
    t.name AS topic_name,
    sa.slug AS subject_slug,
    sa.name AS subject_name,
    et.slug AS exam_slug,
    et.name AS exam_name
  INTO v_row
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE q.id = p_question_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'stem', v_row.stem,
    'choices', v_row.choices,
    'correct_choice_id', v_row.correct_choice_id,
    'explanation_en', v_row.explanation_en,
    'explanation_fil', v_row.explanation_fil,
    'difficulty', v_row.difficulty,
    'status', v_row.status,
    'is_verified', v_row.is_verified,
    'topic_slug', v_row.topic_slug,
    'topic_name', v_row.topic_name,
    'subject_slug', v_row.subject_slug,
    'subject_name', v_row.subject_name,
    'exam_slug', v_row.exam_slug,
    'exam_name', v_row.exam_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_for_staff(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_question_staff(
  p_question_id UUID,
  p_stem TEXT DEFAULT NULL,
  p_explanation_en TEXT DEFAULT NULL,
  p_explanation_fil TEXT DEFAULT NULL,
  p_status question_status DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = auth.uid();
  IF v_role NOT IN ('admin', 'content_reviewer', 'content_author') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  UPDATE questions
  SET
    stem = COALESCE(NULLIF(trim(p_stem), ''), stem),
    explanation_en = COALESCE(p_explanation_en, explanation_en),
    explanation_fil = COALESCE(p_explanation_fil, explanation_fil),
    status = COALESCE(p_status, status),
    is_verified = CASE
      WHEN COALESCE(p_status, status) = 'published' THEN true
      ELSE is_verified
    END,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_question_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_question_staff(UUID, TEXT, TEXT, TEXT, question_status) TO authenticated;
