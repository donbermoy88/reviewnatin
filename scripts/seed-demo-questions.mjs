#!/usr/bin/env node
/**
 * Seed demo topics + published questions.
 * - CSE Professional: full topic tree, 4 questions per topic (~64)
 * - Other Phase 1 exams: 5 questions each (~20)
 * Idempotent: skips questions whose stem starts with [demo:<slug>].
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i), l.slice(i + 1)];
        })
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env') };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const sb = createClient(url, key);

const CSE_TOPICS = [
  { subject: 'verbal', slug: 'grammar', name: 'Grammar and Correct Usage' },
  { subject: 'verbal', slug: 'vocabulary', name: 'Vocabulary' },
  { subject: 'verbal', slug: 'paragraph-org', name: 'Paragraph Organization' },
  { subject: 'verbal', slug: 'reading-comp', name: 'Reading Comprehension' },
  { subject: 'verbal', slug: 'verbal-comprehension', name: 'Verbal Comprehension' },
  { subject: 'analytical', slug: 'word-association', name: 'Word Association' },
  { subject: 'analytical', slug: 'assumptions-conclusions', name: 'Identifying Assumptions and Conclusions' },
  { subject: 'analytical', slug: 'logic', name: 'Logic and Reasoning' },
  { subject: 'analytical', slug: 'data-interpretation', name: 'Data Interpretation' },
  { subject: 'numerical', slug: 'basic-operations', name: 'Basic Operations' },
  { subject: 'numerical', slug: 'number-series', name: 'Number Series' },
  { subject: 'numerical', slug: 'word-problems', name: 'Word Problems' },
  { subject: 'general-info', slug: 'constitution', name: 'Philippine Constitution' },
  { subject: 'general-info', slug: 'ra-6713', name: 'RA 6713 — Code of Conduct' },
  { subject: 'general-info', slug: 'peace-human-rights', name: 'Peace and Human Rights' },
  { subject: 'general-info', slug: 'environment', name: 'Environment Management' },
];

const OTHER_EXAM_TOPIC = {
  'cse-subprofessional': { subject: 'verbal', topic: 'vocabulary', topicName: 'Vocabulary' },
  'let-elementary': { subject: 'gen-ed', topic: 'english', topicName: 'English' },
  'let-secondary': { subject: 'gen-ed', topic: 'english', topicName: 'English' },
  pnle: { subject: 'np1-community', topic: 'primary-care', topicName: 'Primary Health Care' },
};

/** [stem, a, b, c, d, correct] per topic slug */
const CSE_QUESTIONS = {
  grammar: [
    ['Choose the sentence with correct subject-verb agreement.', 'The group of students are ready.', 'Neither of the boys were late.', 'Each of the candidates has a platform.', 'The news were shocking.', 'c'],
    ['Which sentence uses the correct pronoun?', 'Between you and I, the test was fair.', 'The manager asked John and I to report.', 'She is taller than me.', 'The award was given to her and me.', 'd'],
    ['Select the properly punctuated sentence.', 'However we must finish today.', 'However, we must finish today.', 'However; we must finish today.', 'However we, must finish today.', 'b'],
    ['Which word correctly completes: "Neither the supervisor nor the staff ___ present."', 'was', 'were', 'is', 'are being', 'a'],
  ],
  vocabulary: [
    ['What is the synonym of "abundant"?', 'Scarce', 'Plentiful', 'Tiny', 'Weak', 'b'],
    ['What is the antonym of "obsolete"?', 'Outdated', 'Current', 'Ancient', 'Broken', 'b'],
    ['The word "benevolent" most nearly means:', 'Cruel', 'Kind', 'Lazy', 'Proud', 'b'],
    ['Choose the best meaning of "ambiguous" in context: "The memo was ambiguous."', 'Clear', 'Open to more than one meaning', 'Very long', 'Official', 'b'],
  ],
  'paragraph-org': [
    ['Which sentence should come FIRST in a paragraph about preparing for the CSE?', 'Bring valid ID on exam day.', 'Many applicants review months ahead.', 'Results are posted online after release.', 'The room assignment is on the admission slip.', 'b'],
    ['Which is the best concluding sentence?', 'Exams are hard.', 'Therefore, consistent review improves readiness.', 'The CSC is in Quezon City.', 'Some people do not pass.', 'b'],
    ['Which sentence is OFF-topic in a paragraph about time management?', 'Use a weekly study schedule.', 'Break sessions into 25-minute blocks.', 'The Philippine flag has three colors.', 'Prioritize weak subjects first.', 'c'],
    ['Which transition best connects two ideas of contrast?', 'Furthermore', 'However', 'Similarly', 'Therefore', 'b'],
  ],
  'reading-comp': [
    ['Passage gist: "Regular mock exams build stamina and reveal weak topics." The main idea is:', 'Mocks replace official exams', 'Mocks help preparation strategy', 'Stamina is unrelated to exams', 'Weak topics should be ignored', 'b'],
    ['If an author states a fact then gives an example, the example mainly:', 'Contradicts the fact', 'Illustrates the fact', 'Replaces the conclusion', 'Introduces a new topic', 'b'],
    ['Tone: "Applicants must verify requirements on the official CSC website." The tone is:', 'Humorous', 'Instructional', 'Angry', 'Poetic', 'b'],
    ['Inference: "She reviewed every night for two months." She is likely:', 'Unprepared', 'Committed to passing', 'Avoiding the exam', 'On vacation', 'b'],
  ],
  'verbal-comprehension': [
    ['Analogy: BOOK is to LIBRARY as CAR is to ___', 'Road', 'Garage', 'Driver', 'Fuel', 'b'],
    ['Analogy: TEACHER is to SCHOOL as DOCTOR is to ___', 'Medicine', 'Hospital', 'Patient', 'Stethoscope', 'b'],
    ['Which pair has the same relationship? HOT : COLD', 'Up : Down', 'Big : Big', 'Run : Run', 'Fast : Fast', 'a'],
    ['Sentence completion: "Despite the rain, the parade ___ as scheduled."', 'cancelled', 'proceeded', 'forgot', 'delayed indefinitely', 'b'],
  ],
  'word-association': [
    ['Which word is most associated with LEGISLATURE?', 'Court', 'Congress', 'Police', 'Mayor', 'b'],
    ['Which word does NOT belong: apple, mango, banana, potato?', 'apple', 'mango', 'banana', 'potato', 'd'],
    ['OCEAN is most related to:', 'Desert', 'Water', 'Mountain', 'City', 'b'],
    ['Which pair is closest in meaning? BRIEF : SHORT', 'Long : Tall', 'Quick : Fast', 'Hot : Cold', 'Old : New', 'b'],
  ],
  'assumptions-conclusions': [
    ['Statement: "All passers studied daily." Which is an assumption?', 'Daily study guarantees passing', 'Some passers never studied', 'The exam has no verbal section', 'CSC exams are optional', 'a'],
    ['Conclusion: "If it rains, the outdoor drill is cancelled. It rained." Therefore:', 'The drill is cancelled', 'The drill continues', 'Rain is impossible', 'Drills are always indoors', 'a'],
    ['Which weakens: "Traffic was heavy, so Ana was late."', 'Ana left early', 'Ana also stopped for coffee without needing to', 'Traffic can be heavy', 'Ana owns a car', 'b'],
    ['Assumption in: "The office should hire more staff because workload increased."', 'Workload increased', 'Staff never work', 'Hiring is free', 'Clients dislike service', 'a'],
  ],
  logic: [
    ['All managers are employees. Juan is a manager. Therefore Juan is ___', 'a contractor', 'an employee', 'a customer', 'unrelated', 'b'],
    ['If A then B. Not B. Therefore:', 'A', 'Not A', 'B', 'Both A and B', 'b'],
    ['Some nurses are bilingual. Maria is a nurse. We can conclude Maria ___', 'is definitely bilingual', 'might be bilingual', 'is not bilingual', 'is a doctor', 'b'],
    ['Which is a valid syllogism?', 'All cats are mammals. All mammals are fish. So all cats are fish.', 'All birds have wings. A sparrow is a bird. So a sparrow has wings.', 'Some dogs are cats. All cats bark. So all dogs bark.', 'No valid option', 'b'],
  ],
  'data-interpretation': [
    ['Table: Mon 10, Tue 15, Wed 12. Total for three days?', '35', '37', '27', '25', 'b'],
    ['Chart shows 40% chose A, 25% B, 35% C out of 200. How many chose A?', '60', '80', '40', '100', 'b'],
    ['Average of 8, 10, and 12 is:', '8', '9', '10', '11', 'c'],
    ['If sales rose from 50 to 65, the increase is:', '15', '30%', 'Both 15 and 30%', 'Neither', 'c'],
  ],
  'basic-operations': [
    ['What is 15% of 200?', '20', '25', '30', '35', 'c'],
    ['Simplify: 3/4 + 1/8', '4/12', '7/8', '1/2', '5/8', 'b'],
    ['What is 144 ÷ 12?', '10', '11', '12', '14', 'c'],
    ['If 7 × □ = 63, then □ =', '7', '8', '9', '10', 'c'],
  ],
  'number-series': [
    ['Complete the series: 2, 4, 6, 8, __', '9', '10', '11', '12', 'b'],
    ['Complete: 3, 6, 12, 24, __', '30', '36', '48', '96', 'c'],
    ['Complete: 1, 1, 2, 3, 5, 8, __', '11', '12', '13', '14', 'c'],
    ['Complete: 100, 95, 90, 85, __', '80', '75', '82', '88', 'a'],
  ],
  'word-problems': [
    ['If 5 pens cost ₱60, how much do 8 pens cost at the same rate?', '₱84', '₱96', '₱108', '₱120', 'b'],
    ['A train travels 120 km in 2 hours. Its average speed is:', '40 km/h', '50 km/h', '60 km/h', '70 km/h', 'c'],
    ['If 3 workers finish a job in 12 days, how long for 6 workers at the same rate?', '3 days', '4 days', '6 days', '24 days', 'c'],
    ['Anna scored 80, 90, and 70 on three quizzes. Her average is:', '75', '80', '85', '90', 'b'],
  ],
  constitution: [
    ['Which branch of government enacts laws in the Philippines?', 'Executive', 'Legislative', 'Judicial', 'Local Government', 'b'],
    ['The Philippine Constitution of 1987 was ratified after the ___ regime.', 'Spanish', 'Marcos', 'American', 'Japanese', 'b'],
    ['Bill of Rights is found in Article ___ of the 1987 Constitution.', 'II', 'III', 'IV', 'VI', 'b'],
    ['Sovereignty resides in the ___ and all government authority emanates from them.', 'President', 'People', 'Congress', 'Supreme Court', 'b'],
  ],
  'ra-6713': [
    ['RA 6713 is known as the ___ of 1987.', 'Labor Code', 'Code of Conduct and Ethical Standards for Public Officials', 'Local Government Code', 'Civil Service Law', 'b'],
    ['Under RA 6713, public officials must submit their ___ declaration.', 'Assets, Liabilities, and Net Worth (SALN)', 'Birth certificate only', 'Driver\'s license', 'Tax return only', 'a'],
    ['Nepotism in appointment is generally prohibited under:', 'RA 7160', 'RA 6713', 'RA 10533', 'RA 10121', 'b'],
    ['Gift rules under RA 6713 aim to prevent:', 'Conflicts of interest', 'Vacation leave', 'Training abroad', 'Merit promotion', 'a'],
  ],
  'peace-human-rights': [
    ['The Universal Declaration of Human Rights was adopted in:', '1945', '1948', '1965', '1987', 'b'],
    ['Right to due process means fair treatment under:', 'Popular opinion', 'Law', 'Social media', 'Tradition only', 'b'],
    ['Peace education in the Philippines promotes:', 'Violence', 'Tolerance and respect for human dignity', 'Discrimination', 'Isolation', 'b'],
    ['Extrajudicial killing violates the right to:', 'Free speech', 'Life', 'Property only', 'Travel', 'b'],
  ],
  environment: [
    ['RA 9003 is the ___ Act of 2000.', 'Clean Air', 'Ecological Solid Waste Management', 'Mining', 'Wildlife Resources', 'b'],
    ['3Rs in waste management stand for Reduce, Reuse, and ___', 'Recycle', 'Reject', 'Remove', 'Replace', 'a'],
    ['Climate change mitigation includes reducing ___ emissions.', 'Greenhouse gas', 'Oxygen', 'Nitrogen only', 'Water vapor only', 'a'],
    ['Protected areas in the Philippines are managed under:', 'RA 7586 (NIPAS)', 'RA 6713', 'RA 7836', 'RA 9163', 'a'],
  ],
};

const OTHER_QUESTION_BANK = {
  'cse-subprofessional': [
    ['What does CSC stand for?', 'Civil Service Commission', 'Central Security Council', 'City Schools Council', 'Citizen Service Corps', 'a'],
    ['Arrange logically: (1) Pay fare (2) Board jeep (3) Wait at stop (4) Arrive', '3-2-1-4', '3-1-2-4', '2-3-1-4', '1-3-2-4', 'b'],
    ['If 5 pens cost ₱60, how much do 8 pens cost?', '₱84', '₱96', '₱108', '₱120', 'b'],
    ['Who is the head of the Executive branch?', 'Chief Justice', 'Senate President', 'President', 'Ombudsman', 'c'],
    ['Which file extension usually indicates a spreadsheet?', '.docx', '.pdf', '.xlsx', '.mp3', 'c'],
  ],
  'let-elementary': [
    ['Republic Act 7836 is also known as the ___ Act.', 'Education', 'Teachers', 'School', 'Learning', 'b'],
    ['Which domain covers classroom management strategies?', 'Content', 'Pedagogy', 'Technology', 'Andragogy', 'b'],
    ['What does "scaffolding" mean in teaching?', 'Removing all support at once', 'Gradual support until mastery', 'Testing only at the end', 'Grouping by age only', 'b'],
    ['Which is a formative assessment?', 'Final exam', 'Weekly quiz for feedback', 'Board exam', 'Graduation test', 'b'],
    ['The K to 12 program added ___ years to basic education.', '1', '2', '3', '4', 'b'],
  ],
  'let-secondary': [
    ['LET Secondary includes a major field component for ___ specialization.', 'student', 'teacher', 'school', 'district', 'b'],
    ['Which is a higher-order thinking skill in Bloom\'s taxonomy?', 'Recall', 'Define', 'Evaluate', 'List', 'c'],
    ['In lesson planning, objectives should be ___.', 'vague', 'measurable', 'optional', 'identical', 'b'],
    ['Which law strengthens Philippine basic education?', 'RA 9163', 'RA 10533', 'RA 6713', 'RA 10121', 'b'],
    ['Differentiated instruction adjusts content, process, and ___.', 'product', 'budget', 'building', 'schedule only', 'a'],
  ],
  pnle: [
    ['Primary health care emphasizes ___ prevention.', 'tertiary', 'secondary', 'primary', 'quaternary', 'c'],
    ['Which vaccine is given at birth to prevent tuberculosis?', 'MMR', 'BCG', 'OPV', 'Hepatitis A', 'b'],
    ['The nursing process starts with ___.', 'Planning', 'Assessment', 'Evaluation', 'Implementation', 'b'],
    ['Barangay health workers are part of ___ health care delivery.', 'community', 'institutional', 'corporate', 'military', 'a'],
    ['Hand hygiene is most effective with soap and ___.', 'perfume', 'running water', 'oil', 'alcohol only', 'b'],
  ],
};

function choices(ids, texts) {
  return ids.map((id, i) => ({ id, text: texts[i] }));
}

async function ensureTopic(examSlug, subjectSlug, topicSlug, topicName, sortOrder = 1) {
  const { data: exam, error: examErr } = await sb
    .from('exam_types')
    .select('id')
    .eq('slug', examSlug)
    .single();
  if (examErr || !exam) throw new Error(`Exam not found: ${examSlug}`);

  const { data: subject, error: subErr } = await sb
    .from('subject_areas')
    .select('id')
    .eq('exam_type_id', exam.id)
    .eq('slug', subjectSlug)
    .single();
  if (subErr || !subject) throw new Error(`Subject not found: ${examSlug}/${subjectSlug}`);

  const { data: existing } = await sb
    .from('topics')
    .select('id')
    .eq('subject_area_id', subject.id)
    .eq('slug', topicSlug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error: createErr } = await sb
    .from('topics')
    .insert({ subject_area_id: subject.id, slug: topicSlug, name: topicName, sort_order: sortOrder })
    .select('id')
    .single();

  if (createErr) throw createErr;
  return created.id;
}

async function insertQuestions(examSlug, topicId, bank) {
  let inserted = 0;
  for (const row of bank) {
    const [stem, a, b, c, d, correct] = row;
    const taggedStem = `[demo:${examSlug}] ${stem}`;

    const { data: dup } = await sb.from('questions').select('id').eq('stem', taggedStem).maybeSingle();
    if (dup?.id) continue;

    const { error } = await sb.from('questions').insert({
      topic_id: topicId,
      stem: taggedStem,
      choices: choices(['a', 'b', 'c', 'd'], [a, b, c, d]),
      correct_choice_id: correct,
      explanation_en: 'ReviewNatin demo question for practice mode.',
      explanation_fil: 'Demo question para sa practice mode ng ReviewNatin.',
      difficulty: 2,
      status: 'published',
      is_verified: true,
      source_note: `ReviewNatin demo batch — ${examSlug}`,
    });

    if (error) throw error;
    inserted += 1;
  }
  return inserted;
}

async function seedCseProfessional() {
  let totalInserted = 0;
  for (const meta of CSE_TOPICS) {
    const topicId = await ensureTopic('cse-professional', meta.subject, meta.slug, meta.name);
    const bank = CSE_QUESTIONS[meta.slug] ?? [];
    const n = await insertQuestions('cse-professional', topicId, bank);
    totalInserted += n;
  }
  console.log(`✓ cse-professional: ${totalInserted} new questions (${CSE_TOPICS.length} topics)`);
}

async function seedOtherExam(examSlug) {
  const meta = OTHER_EXAM_TOPIC[examSlug];
  const topicId = await ensureTopic(examSlug, meta.subject, meta.topic, meta.topicName);
  const bank = OTHER_QUESTION_BANK[examSlug];
  const n = await insertQuestions(examSlug, topicId, bank);
  console.log(`✓ ${examSlug}: ${n} new questions (${bank.length} in bank)`);
}

await seedCseProfessional();
for (const slug of Object.keys(OTHER_EXAM_TOPIC)) {
  await seedOtherExam(slug);
}

const { data: cseExam } = await sb.from('exam_types').select('id').eq('slug', 'cse-professional').maybeSingle();
let cseCount = 0;
if (cseExam?.id) {
  const { data: subs } = await sb.from('subject_areas').select('id').eq('exam_type_id', cseExam.id);
  const subIds = (subs ?? []).map((s) => s.id);
  if (subIds.length) {
    const { data: tops } = await sb.from('topics').select('id').in('subject_area_id', subIds);
    const topIds = (tops ?? []).map((t) => t.id);
    if (topIds.length) {
      const { count } = await sb
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .in('topic_id', topIds)
        .eq('status', 'published');
      cseCount = count ?? 0;
    }
  }
}

const { count: totalCount } = await sb
  .from('questions')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');

console.log(`\nPublished questions — CSE Professional: ${cseCount}, all exams: ${totalCount ?? 0}`);
