-- ---------------------------------------------------------------------------
-- get_question_hint: return ONE genuinely incorrect choice id for a question.
--
-- The mobile "hint" feature previously eliminated a RANDOM non-selected choice
-- on the client (app/practice/quiz.tsx) because the answer key is intentionally
-- not shipped to the client. That could eliminate the CORRECT answer while
-- charging the user a hint credit / 10 XP. This RPC moves the choice selection
-- server-side (where the answer key lives) so the hint only ever removes a
-- wrong option, without revealing which choice is correct.
--
-- Excludes the correct choice and, when possible, the choice the user already
-- selected. Returns NULL when no eliminable wrong choice exists (e.g. only two
-- choices and the user already selected the other wrong one) so the client can
-- skip the deduction.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_question_hint(
  p_question_id UUID,
  p_selected_choice_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT elem->>'id'
  FROM questions q
  CROSS JOIN LATERAL jsonb_array_elements(q.choices) AS elem
  WHERE q.id = p_question_id
    AND q.status = 'published'
    AND elem->>'id' <> q.correct_choice_id
    AND (p_selected_choice_id IS NULL OR elem->>'id' <> p_selected_choice_id)
  ORDER BY random()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_hint(UUID, TEXT) TO anon, authenticated;
