-- Fix content QA critical/high findings from the automated content audit.
-- These updates are deterministic: duplicate distractors are replaced, answer
-- keys are aligned with existing explanations, and one thin cheat sheet is
-- expanded for production-quality review.

UPDATE public.questions
SET
  choices = '[{"id":"a","text":"C-B-A-D"},{"id":"b","text":"A-C-D-B"},{"id":"c","text":"C-A-B-D"},{"id":"d","text":"C-A-D-B"}]'::jsonb,
  updated_at = now()
WHERE id = '90050c65-c434-4763-91c7-21683afd1d8e';

UPDATE public.questions
SET
  choices = '[{"id":"a","text":"CBAD"},{"id":"b","text":"CDAB"},{"id":"c","text":"CABD"},{"id":"d","text":"CADB"}]'::jsonb,
  stem = 'Arrange each group of items in alphabetical order:
A. Presidential Commission on Good Governance
B. Presidential Commission to Fight Poverty
C. Presidential Commission for the Urban Poor
D. Presidential Commission on Human Rights',
  updated_at = now()
WHERE id = '2821079a-49b9-41ff-9904-f9c9017dfe1e';

UPDATE public.questions
SET
  choices = '[{"id":"a","text":"Pumunta ako para kay Maria."},{"id":"b","text":"Pumunta ako para kay aklat."},{"id":"c","text":"Pumunta ako para sa Maria."},{"id":"d","text":"Pumunta ako para kay paaralan."}]'::jsonb,
  correct_choice_id = 'a',
  updated_at = now()
WHERE id IN (
  'd7fc2d7f-3694-41d9-aaa4-f43f1b59dff0',
  '9687e09d-125a-40b2-abe0-6fa2e19d9c62'
);

UPDATE public.questions
SET
  choices = '[{"id":"a","text":"nagtatago"},{"id":"b","text":"nag-aalala"},{"id":"c","text":"nanghuhula"},{"id":"d","text":"nagbabago"}]'::jsonb,
  correct_choice_id = 'a',
  explanation_en = '"Nagtatago ng kanyang nakaraan" means hiding his past. NAGTATAGO most naturally completes this sentence.',
  updated_at = now()
WHERE id IN (
  '2892105c-4a42-420d-8a11-cb2584573672',
  '655bcb88-a818-4bbe-8839-fe2ae939fc2e'
);

UPDATE public.questions
SET
  choices = '[{"id":"a","text":"12"},{"id":"b","text":"24"},{"id":"c","text":"36"},{"id":"d","text":"300"}]'::jsonb,
  updated_at = now()
WHERE id IN (
  'b3af3370-68f3-4c48-8855-299029b78549',
  'ae63f605-c66d-4769-bfc6-1ca1b1b319c7'
);

UPDATE public.questions
SET
  stem = 'bleach : whiten || blend : ___',
  choices = '[{"id":"a","text":"whisper"},{"id":"b","text":"mix"},{"id":"c","text":"blink"},{"id":"d","text":"flower"}]'::jsonb,
  explanation_en = '"Mix" best completes the analogy because bleach means whiten and blend means mix.',
  updated_at = now()
WHERE id = 'a9fb28e5-5364-46d5-a8ba-5da6a1d44a11';

UPDATE public.review_materials
SET body = $$CSE Verbal Quick Formulas

1. Reading comprehension
• Main idea = the author’s central message, not one supporting example.
• Supporting detail = a fact, reason, example, date, number, or explanation that proves the main idea.
• Inference = a conclusion supported by the passage. Do not choose an answer that adds new facts.
• Tone = the writer’s attitude. Look for word choice: critical, hopeful, neutral, persuasive, or doubtful.

2. Vocabulary in context
• Replace the word with each option and read the sentence again.
• Choose the closest meaning in context, not always the most common dictionary meaning.
• Watch for synonym traps: two options may be similar, but only one fits the sentence.
• For antonyms, identify whether the word is positive, negative, formal, or informal before choosing.

3. Grammar and correct usage
• Subject-verb agreement: singular subject takes singular verb; plural subject takes plural verb.
• “Each,” “every,” “neither,” and “either” usually take singular verbs.
• Keep verb tense consistent unless the time clearly changes.
• Pronouns must match their antecedents in number and person.

4. Paragraph organization
• Start with the general topic sentence.
• Follow with details, examples, or causes.
• End with a conclusion, result, recommendation, or summary.
• Use clue words: first, however, therefore, as a result, finally.

5. Exam pacing
• Easy vocabulary/grammar: 30–45 seconds.
• Reading item with passage: 60–90 seconds.
• If stuck, eliminate two wrong choices, mark your best answer, and return later.$$ 
WHERE id = 'aac6bd41-f751-4a4c-8d29-ed4262cbdb45';

UPDATE public.questions
SET
  explanation_en = 'Multiply daily pay by the number of days: ₱480 × 5 = ₱2,400, so the worker earns ₱2,400 in 5 days.',
  explanation_fil = 'I-multiply ang arawang kita sa bilang ng araw: ₱480 × 5 = ₱2,400, kaya ₱2,400 ang kinita sa 5 araw.',
  updated_at = now()
WHERE id = '0aa6141c-7dff-4d94-aa3e-42a6c21f03e2';

UPDATE public.questions
SET
  explanation_en = 'Each bag costs ₱55. For 6 bags, multiply 55 by 6: ₱55 × 6 = ₱330.',
  explanation_fil = 'Bawat sako ay ₱55. Para sa 6 na sako, i-multiply ang 55 sa 6: ₱55 × 6 = ₱330.',
  updated_at = now()
WHERE id = '49f29300-fe90-47bd-bb2d-90cdf4cd0246';

UPDATE public.questions
SET
  explanation_en = 'A squared number means the number multiplied by itself. Therefore, 7² = 7 × 7 = 49.',
  explanation_fil = 'Ang squared number ay bilang na minultiply sa sarili nito. Kaya 7² = 7 × 7 = 49.',
  updated_at = now()
WHERE id = '4d9d0b58-e4d4-46e0-ba62-e8dee6f77512';

UPDATE public.questions
SET
  explanation_en = 'Divide 360 into 12 equal groups. Since 12 × 30 = 360, 360 ÷ 12 = 30.',
  explanation_fil = 'Hatiin ang 360 sa 12 pantay na grupo. Dahil 12 × 30 = 360, 360 ÷ 12 = 30.',
  updated_at = now()
WHERE id = '4fd54352-69b1-4e0a-8803-223dd81b755f';

UPDATE public.questions
SET
  explanation_en = 'Use part ÷ whole × 100. 168 ÷ 672 = 0.25, then 0.25 × 100 = 25%.',
  explanation_fil = 'Gamitin ang bahagi ÷ kabuuan × 100. 168 ÷ 672 = 0.25, kaya 0.25 × 100 = 25%.',
  updated_at = now()
WHERE id IN (
  '0a1ec10d-87b8-43ed-bd0f-3a8e8f8b6e57',
  'e368db2b-ae01-44c0-b469-97020f98fe33'
);

UPDATE public.questions
SET
  explanation_en = 'Use percentage = part ÷ total × 100. 96 ÷ 300 = 0.32, and 0.32 × 100 = 32%.',
  explanation_fil = 'Gamitin ang porsiyento = bahagi ÷ kabuuan × 100. 96 ÷ 300 = 0.32, at 0.32 × 100 = 32%.',
  updated_at = now()
WHERE id IN (
  '9bf67337-10e0-4efb-a119-0de3d2f65a8c',
  '4848e267-be31-4a37-ab3a-6a3ae4fbaf90'
);

UPDATE public.questions
SET
  explanation_en = 'Use passed ÷ total × 100. 560 ÷ 700 = 0.80, and 0.80 × 100 = 80%.',
  explanation_fil = 'Gamitin ang pumasa ÷ kabuuan × 100. 560 ÷ 700 = 0.80, kaya 0.80 × 100 = 80%.',
  updated_at = now()
WHERE id IN (
  '55d8d4da-704a-4fbd-bd3e-9a2b1ea57329',
  '5db6cda4-8fff-4a72-ba84-46b6e1181b28'
);

UPDATE public.questions
SET
  stem = 'What does the expression "don''t count your chickens before they hatch" mean?',
  updated_at = now()
WHERE id IN (
  'e92b0cc9-fc03-4a27-adf4-01fec2f89840',
  '7fec5e74-edf7-479e-960c-f28e9d1915af'
);

UPDATE public.questions
SET
  stem = 'In the poem "Love in the Open Hand," what does the speaker offer openly in the final image?',
  updated_at = now()
WHERE id IN (
  '9f796deb-d2e8-4862-9b13-4e2735904f87',
  '1edb48f0-11ed-4b9c-b2b0-fe56f6a8e3ee'
);
