-- Wave 3: GCash/Maya web checkout, Barkada mode, cheat sheets

-- ---------------------------------------------------------------------------
-- Web checkout sessions (GCash / Maya)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS web_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES subscription_products(id),
  provider payment_provider NOT NULL,
  reference_code TEXT NOT NULL UNIQUE,
  amount_php INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'paid', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  CONSTRAINT web_checkout_provider_check CHECK (provider IN ('gcash', 'maya'))
);

CREATE INDEX IF NOT EXISTS idx_web_checkout_user ON web_checkout_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_checkout_ref ON web_checkout_sessions (reference_code);

ALTER TABLE web_checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "web_checkout_own" ON web_checkout_sessions;
CREATE POLICY "web_checkout_own" ON web_checkout_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Barkada (study group) mode
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS barkada_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barkada_members (
  group_id UUID NOT NULL REFERENCES barkada_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS barkada_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES barkada_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  exam_slug TEXT NOT NULL,
  question_count INT NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 5 AND 30),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barkada_challenge_results (
  challenge_id UUID NOT NULL REFERENCES barkada_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_percent INT NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  correct_count INT NOT NULL,
  total_count INT NOT NULL,
  session_id UUID REFERENCES quiz_sessions(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_barkada_members_user ON barkada_members (user_id);
CREATE INDEX IF NOT EXISTS idx_barkada_challenges_group ON barkada_challenges (group_id, status, created_at DESC);

ALTER TABLE barkada_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE barkada_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE barkada_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE barkada_challenge_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barkada_groups_member_read" ON barkada_groups;
CREATE POLICY "barkada_groups_member_read" ON barkada_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barkada_members bm
      WHERE bm.group_id = barkada_groups.id AND bm.user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "barkada_members_read" ON barkada_members;
CREATE POLICY "barkada_members_read" ON barkada_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barkada_members bm
      WHERE bm.group_id = barkada_members.group_id AND bm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "barkada_challenges_member_read" ON barkada_challenges;
CREATE POLICY "barkada_challenges_member_read" ON barkada_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barkada_members bm
      WHERE bm.group_id = barkada_challenges.group_id AND bm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "barkada_results_member_read" ON barkada_challenge_results;
CREATE POLICY "barkada_challenge_results_member_read" ON barkada_challenge_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM barkada_challenges bc
      JOIN barkada_members bm ON bm.group_id = bc.group_id
      WHERE bc.id = barkada_challenge_results.challenge_id
        AND bm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Web checkout: create session
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_web_checkout_session(
  p_sku TEXT,
  p_provider TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product subscription_products%ROWTYPE;
  v_ref TEXT;
  v_session_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_provider NOT IN ('gcash', 'maya') THEN
    RAISE EXCEPTION 'invalid_provider';
  END IF;

  SELECT * INTO v_product FROM subscription_products WHERE sku = p_sku;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown_sku';
  END IF;

  v_ref := 'RN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO web_checkout_sessions (
    user_id, product_id, provider, reference_code, amount_php
  )
  VALUES (
    v_user_id, v_product.id, p_provider::payment_provider, v_ref, v_product.price_php
  )
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'reference_code', v_ref,
    'amount_php', v_product.price_php,
    'sku', v_product.sku,
    'tier', v_product.tier,
    'provider', p_provider,
    'expires_at', (now() + interval '24 hours')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_web_checkout_session(TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Web checkout: status poll
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_web_checkout_status(p_reference_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row web_checkout_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM web_checkout_sessions
  WHERE reference_code = p_reference_code
    AND (auth.uid() IS NULL OR user_id = auth.uid())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  IF v_row.status = 'pending' AND v_row.expires_at < now() THEN
    UPDATE web_checkout_sessions SET status = 'expired' WHERE id = v_row.id;
    v_row.status := 'expired';
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'reference_code', v_row.reference_code,
    'status', v_row.status,
    'amount_php', v_row.amount_php,
    'provider', v_row.provider,
    'expires_at', v_row.expires_at,
    'paid_at', v_row.paid_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_web_checkout_status(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Web checkout: fulfill (service_role / edge function)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fulfill_web_checkout(
  p_reference_code TEXT,
  p_auto_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session web_checkout_sessions%ROWTYPE;
  v_product subscription_products%ROWTYPE;
  v_expires TIMESTAMPTZ;
  v_entitlement_id UUID;
  v_tx_id TEXT;
BEGIN
  SELECT * INTO v_session
  FROM web_checkout_sessions
  WHERE reference_code = p_reference_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'checkout_not_found';
  END IF;

  IF v_session.status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  IF v_session.status = 'expired' OR v_session.expires_at < now() THEN
    UPDATE web_checkout_sessions SET status = 'expired' WHERE id = v_session.id;
    RAISE EXCEPTION 'checkout_expired';
  END IF;

  IF NOT p_auto_demo AND v_session.status <> 'submitted' THEN
    RAISE EXCEPTION 'checkout_not_submitted';
  END IF;

  SELECT * INTO v_product FROM subscription_products WHERE id = v_session.product_id;

  v_expires := CASE
    WHEN v_product.duration_days IS NULL THEN NULL
    ELSE now() + (v_product.duration_days || ' days')::interval
  END;

  v_tx_id := 'web:' || v_session.reference_code;

  IF EXISTS (
    SELECT 1 FROM payment_transactions pt
    WHERE pt.store_transaction_id = v_tx_id AND pt.provider = v_session.provider
  ) THEN
    UPDATE web_checkout_sessions SET status = 'paid', paid_at = now() WHERE id = v_session.id;
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO payment_transactions (
    user_id, product_id, amount_php, provider, status, raw_receipt, store_transaction_id
  )
  VALUES (
    v_session.user_id,
    v_product.id,
    v_session.amount_php,
    v_session.provider,
    'completed',
    jsonb_build_object('reference_code', v_session.reference_code, 'auto_demo', p_auto_demo),
    v_tx_id
  );

  INSERT INTO user_entitlements (user_id, product_id, exam_type_id, source, transaction_id, expires_at)
  VALUES (
    v_session.user_id,
    v_product.id,
    v_product.exam_type_id,
    'web_' || v_session.provider::text,
    v_tx_id,
    v_expires
  )
  ON CONFLICT (transaction_id) WHERE transaction_id IS NOT NULL DO UPDATE
    SET expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_entitlement_id;

  UPDATE web_checkout_sessions
  SET status = 'paid', paid_at = now()
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'success', true,
    'entitlement_id', v_entitlement_id,
    'sku', v_product.sku,
    'expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_web_checkout(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_web_checkout(TEXT, BOOLEAN) TO service_role;

-- ---------------------------------------------------------------------------
-- Review materials: optional material_type filter
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_review_materials_by_exam(
  p_exam_slug TEXT,
  p_material_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  material_type TEXT,
  is_premium BOOLEAN,
  topic_slug TEXT,
  topic_name TEXT,
  subject_name TEXT,
  subject_slug TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_premium BOOLEAN := false;
BEGIN
  SELECT et.id INTO v_exam_id
  FROM exam_types et
  WHERE et.slug = p_exam_slug AND et.is_active = true;

  IF v_exam_id IS NULL THEN RETURN; END IF;

  IF auth.uid() IS NOT NULL THEN
    v_premium := user_has_content_access(v_exam_id);
  END IF;

  RETURN QUERY
  SELECT
    rm.id,
    rm.title,
    rm.body,
    rm.material_type,
    rm.is_premium,
    t.slug,
    t.name,
    sa.name,
    sa.slug
  FROM review_materials rm
  JOIN topics t ON t.id = rm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  WHERE sa.exam_type_id = v_exam_id
    AND (NOT rm.is_premium OR v_premium)
    AND (p_material_type IS NULL OR rm.material_type = p_material_type)
  ORDER BY sa.sort_order NULLS LAST, sa.name, t.sort_order NULLS LAST, t.name, rm.title;
END;
$$;

-- ---------------------------------------------------------------------------
-- Barkada RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._generate_barkada_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := 'BARK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM barkada_groups WHERE invite_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_barkada_group(
  p_exam_slug TEXT,
  p_name TEXT DEFAULT 'My Barkada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_group_id UUID;
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RAISE EXCEPTION 'exam_not_found'; END IF;

  IF EXISTS (
    SELECT 1
    FROM barkada_members bm
    JOIN barkada_groups bg ON bg.id = bm.group_id
    WHERE bm.user_id = v_user_id AND bg.exam_type_id = v_exam_id
  ) THEN
    RAISE EXCEPTION 'already_in_group';
  END IF;

  v_code := public._generate_barkada_code();

  INSERT INTO barkada_groups (owner_id, exam_type_id, name, invite_code)
  VALUES (v_user_id, v_exam_id, coalesce(nullif(trim(p_name), ''), 'My Barkada'), v_code)
  RETURNING id INTO v_group_id;

  INSERT INTO barkada_members (group_id, user_id) VALUES (v_group_id, v_user_id);

  RETURN jsonb_build_object(
    'group_id', v_group_id,
    'invite_code', v_code,
    'name', coalesce(nullif(trim(p_name), ''), 'My Barkada')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_barkada_group(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_barkada_group(p_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_group barkada_groups%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_group
  FROM barkada_groups
  WHERE upper(invite_code) = upper(trim(p_invite_code));

  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_invite_code'; END IF;

  IF EXISTS (
    SELECT 1
    FROM barkada_members bm
    JOIN barkada_groups bg ON bg.id = bm.group_id
    WHERE bm.user_id = v_user_id AND bg.exam_type_id = v_group.exam_type_id
  ) THEN
    RAISE EXCEPTION 'already_in_group';
  END IF;

  INSERT INTO barkada_members (group_id, user_id)
  VALUES (v_group.id, v_user_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'group_id', v_group.id,
    'name', v_group.name,
    'invite_code', v_group.invite_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_barkada_group(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_barkada(p_exam_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_id UUID;
  v_group barkada_groups%ROWTYPE;
  v_members JSONB;
  v_challenge JSONB;
  v_results JSONB;
BEGIN
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_exam_id FROM exam_types WHERE slug = p_exam_slug AND is_active = true;
  IF v_exam_id IS NULL THEN RETURN NULL; END IF;

  SELECT bg.* INTO v_group
  FROM barkada_groups bg
  JOIN barkada_members bm ON bm.group_id = bg.id
  WHERE bm.user_id = v_user_id AND bg.exam_type_id = v_exam_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'user_id', u.id,
    'display_name', coalesce(u.display_name, split_part(u.email, '@', 1)),
    'is_owner', bg.owner_id = u.id,
    'joined_at', bm.joined_at
  ) ORDER BY bm.joined_at), '[]'::jsonb)
  INTO v_members
  FROM barkada_members bm
  JOIN users u ON u.id = bm.user_id
  JOIN barkada_groups bg ON bg.id = bm.group_id
  WHERE bm.group_id = v_group.id;

  SELECT jsonb_build_object(
    'id', bc.id,
    'question_count', bc.question_count,
    'status', bc.status,
    'expires_at', bc.expires_at,
    'created_at', bc.created_at
  )
  INTO v_challenge
  FROM barkada_challenges bc
  WHERE bc.group_id = v_group.id AND bc.status = 'active' AND bc.expires_at > now()
  ORDER BY bc.created_at DESC
  LIMIT 1;

  IF v_challenge IS NOT NULL THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'user_id', bcr.user_id,
      'display_name', coalesce(u.display_name, split_part(u.email, '@', 1)),
      'score_percent', bcr.score_percent,
      'correct_count', bcr.correct_count,
      'total_count', bcr.total_count,
      'submitted_at', bcr.submitted_at
    ) ORDER BY bcr.score_percent DESC, bcr.submitted_at), '[]'::jsonb)
    INTO v_results
    FROM barkada_challenge_results bcr
    JOIN users u ON u.id = bcr.user_id
    WHERE bcr.challenge_id = (v_challenge->>'id')::uuid;
  ELSE
    v_results := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'group_id', v_group.id,
    'name', v_group.name,
    'invite_code', v_group.invite_code,
    'is_owner', v_group.owner_id = v_user_id,
    'members', v_members,
    'active_challenge', v_challenge,
    'challenge_results', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_barkada(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_barkada_challenge(
  p_group_id UUID,
  p_question_count INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exam_slug TEXT;
  v_challenge_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM barkada_members WHERE group_id = p_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  SELECT et.slug INTO v_exam_slug
  FROM barkada_groups bg
  JOIN exam_types et ON et.id = bg.exam_type_id
  WHERE bg.id = p_group_id;

  UPDATE barkada_challenges
  SET status = 'expired'
  WHERE group_id = p_group_id AND status = 'active';

  INSERT INTO barkada_challenges (group_id, created_by, exam_slug, question_count)
  VALUES (p_group_id, v_user_id, v_exam_slug, greatest(5, least(p_question_count, 30)))
  RETURNING id INTO v_challenge_id;

  RETURN jsonb_build_object(
    'challenge_id', v_challenge_id,
    'exam_slug', v_exam_slug,
    'question_count', greatest(5, least(p_question_count, 30))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_barkada_challenge(UUID, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_barkada_challenge_result(
  p_challenge_id UUID,
  p_session_id UUID,
  p_score_percent INT,
  p_correct_count INT,
  p_total_count INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_group_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT bc.group_id INTO v_group_id
  FROM barkada_challenges bc
  WHERE bc.id = p_challenge_id AND bc.status = 'active';

  IF v_group_id IS NULL THEN RAISE EXCEPTION 'challenge_not_active'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM barkada_members WHERE group_id = v_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  INSERT INTO barkada_challenge_results (
    challenge_id, user_id, score_percent, correct_count, total_count, session_id
  )
  VALUES (
    p_challenge_id, v_user_id, p_score_percent, p_correct_count, p_total_count, p_session_id
  )
  ON CONFLICT (challenge_id, user_id) DO UPDATE SET
    score_percent = EXCLUDED.score_percent,
    correct_count = EXCLUDED.correct_count,
    total_count = EXCLUDED.total_count,
    session_id = EXCLUDED.session_id,
    submitted_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_barkada_challenge_result(UUID, UUID, INT, INT, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Cheat sheet seeds
-- ---------------------------------------------------------------------------

INSERT INTO review_materials (topic_id, title, body, material_type, is_premium)
SELECT t.id, seed.title, seed.body, 'cheat_sheet', false
FROM (
  VALUES
    (
      'verbal-comprehension',
      'CSE Verbal — Quick formulas',
      '📌 Main idea vs supporting detail
📌 Synonym trap: pick the closest meaning in context
📌 Grammar: subject-verb agreement, tense consistency
📌 Inference: answer must be supported by the passage

⏱ Exam tip: 45–60 sec per item — skip and return if stuck.'
    ),
    (
      'numerical-ability',
      'Numerical Ability — Must-know patterns',
      '📌 Percent change = (new − old) / old × 100
📌 Rate × Time = Distance
📌 Average = sum ÷ count
📌 Ratio problems: convert to common units first

⏱ Exam tip: estimate first — eliminate far-off choices.'
    ),
    (
      'general-information',
      'General Info — PH gov quick map',
      '📌 Executive: President · implements laws
📌 Legislative: Congress · enacts laws
📌 Judicial: Supreme Court · interprets laws
📌 Local: LGUs under Local Government Code

⏱ Exam tip: Constitution articles on rights & duties appear often.'
    )
) AS seed(topic_slug, title, body)
JOIN topics t ON t.slug = seed.topic_slug
JOIN subject_areas sa ON sa.id = t.subject_area_id
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional'
WHERE NOT EXISTS (
  SELECT 1 FROM review_materials rm
  WHERE rm.topic_id = t.id AND rm.title = seed.title
);
