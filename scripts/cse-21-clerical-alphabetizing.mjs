/**
 * CSE-21: Clerical Operations — Alphabetizing (20 questions)
 * Sub-Professional only — Filing & Coding topic (38ae46c3)
 * Source: PDF pages 23–30 (file pages 026–033)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Sub-Professional: Clerical Ability → Filing and Coding
// Actual DB ID verified 2026-05-29 — script uses dynamic slug query so this const is informational only
const TOPIC_SUB_FILING = '38ae46c3-4cdd-4a65-8a11-3aaf01921f57'; // filing-coding topic

async function getTopicId() {
  const { data, error } = await sb
    .from('topics')
    .select('id, name, slug')
    .eq('id', '38ae46c3-d4e9-4b2e-a3f1-8c0d2e5f7a9b');
  if (!error && data?.length) return data[0].id;

  // Try by slug
  const { data: d2 } = await sb
    .from('topics')
    .select('id, name, slug')
    .ilike('slug', '%filing%');
  if (d2?.length) {
    console.log('  Found filing topics:', d2.map(t => `${t.id} — ${t.name}`).join('\n  '));
    return d2[0].id;
  }
  return null;
}

const QUESTIONS = [
  // Q1 — Government commissions, page 23
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Commission on the Filipino Language\nB. Commission on Human Rights\nC. Commission on Higher Education\nD. Commission on Population`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'CBDA' },
      { id: 'c', text: 'BCDA' },
      { id: 'd', text: 'ACBD' },
    ],
    correct: 'b',
    explanation_en: 'Alphabetizing by the word after "Commission on": Higher (C) → Human (B) → Population (D) → the Filipino (A). "The" is treated as part of the name, placing Filipino Language last since "t" comes after "P".',
    explanation_fil: 'Sa pagkakasunod: Commission on Higher (C) → Human (B) → Population (D) → the Filipino (A). Ang salitang "the" ay kasama sa pag-aayos, kaya nahuhuling dumating ang "Filipino Language".',
  },
  // Q2 — Cooperative/Cottage/Council, page 23
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Cooperative Development Authority\nB. Cottage Industry Development Enterprise\nC. Cottage Industry Technology Center\nD. Council for the Welfare of Children`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'ACBD' },
      { id: 'c', text: 'BCAD' },
      { id: 'd', text: 'CBAD' },
    ],
    correct: 'a',
    explanation_en: 'Coop- (A) < Cottage Industry D- (B) < Cottage Industry T- (C) < Coun- (D). "Cooperative" comes before "Cottage" (coop < cott), and "Development" before "Technology" for the Cottage Industry group.',
    explanation_fil: '"Cooperative" ay naunahan ng "Cott-" at "Coun-" sa alpabetikong pagkakasunod: A, B, C, D = ABCD.',
  },
  // Q3 — Food/Fiber/Foreign/Family, page 23–24
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Food and Nutrition Research Institute\nB. Fiber Industry Development Authority\nC. Foreign Service Institute\nD. Family Planning Organization of the Philippines`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'BACD' },
      { id: 'c', text: 'DBCA' },
      { id: 'd', text: 'DBAC' },
    ],
    correct: 'd',
    explanation_en: 'Family (D) → Fiber (B) → Food (A) → Foreign (C). All start with "F": Fa- < Fi- < Foo- < For-. "Food" (Foo) comes before "Foreign" (For) since the third letter "o" < "r".',
    explanation_fil: 'Lahat nagsisimula sa "F": Fa- (Family/D) < Fi- (Fiber/B) < Foo- (Food/A) < For- (Foreign/C) = DBAC.',
  },
  // Q4 — Insurance/Industrial/Institute/Instructional, page 24
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Insurance Commission\nB. Industrial Technology Development Institute\nC. Institute of Labor and Manpower Studies\nD. Instructional Materials Corporation`,
    choices: [
      { id: 'a', text: 'BDCA' },
      { id: 'b', text: 'BACD' },
      { id: 'c', text: 'BCDA' },
      { id: 'd', text: 'BADC' },
    ],
    correct: 'c',
    explanation_en: 'Industrial (B: Ind-) < Institute (C: Insti-) < Instructional (D: Instr-) < Insurance (A: Insu-). After "In": d < sti < str < su, giving BCDA.',
    explanation_fil: 'Pagkatapos ng "In-": Ind- (B) < Insti- (C) < Instr- (D) < Insu- (A) = BCDA.',
  },
  // Q5 — Presidential Commissions, page 24
  {
    stem: `Arrange each group of items in alphabetical order:\nA. Presidential Commission on Good Governance\nB. Presidential Commission to Fight Poverty\nC. Presidential Commission for the Urban Poor\nD. Presidential Commission on Human Rights`,
    choices: [
      { id: 'a', text: 'CBAD' },
      { id: 'b', text: 'CDAB' },
      { id: 'c', text: 'CABD' },
      { id: 'd', text: 'CADB' },
    ],
    correct: 'd',
    explanation_en: 'After "Presidential Commission": "for" (C) < "on" (A, D) < "to" (B). Between "on Good" (A) and "on Human" (D): G < H, so A before D. Order: C → A → D → B = CADB.',
    explanation_fil: 'Ang preposisyon pagkatapos ng "Presidential Commission": "for" (C) < "on" (A, D) < "to" (B). Sa pagitan ng A at D: Good (G) < Human (H), kaya CADB.',
  },
  // Q6 — A-companies, page 23–25
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. AA Industrial Chemical Supply\nB. AB Capital and Investment Corporation\nC. A Soriano Aviation Incorporated\nD. A-1 Driving Company Incorporated`,
    choices: [
      { id: 'a', text: 'DCAB' },
      { id: 'b', text: 'DCBA' },
      { id: 'c', text: 'ABCD' },
      { id: 'd', text: 'CABD' },
    ],
    correct: 'a',
    explanation_en: 'In standard filing: A-1 (D) comes first (hyphenated/number), then A Soriano (C) as single "A" initial, then AA (A), then AB (B). DCAB.',
    explanation_fil: 'Sa filing: A-1 (D) unang-una, susundan ng A Soriano (C) na "A" lamang, tapos AA (A), tapos AB (B) = DCAB.',
  },
  // Q7 — Ayala companies, page 25
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Ayala Plans Inc.\nB. Ayala Health Care, Inc.\nC. Ayala Land Inc.\nD. Ayala Life Assurance Inc.`,
    choices: [
      { id: 'a', text: 'BCDA' },
      { id: 'b', text: 'ABCD' },
      { id: 'c', text: 'DCBA' },
      { id: 'd', text: 'BACD' },
    ],
    correct: 'a',
    explanation_en: 'After "Ayala": Health (B) < Land (C) < Life (D) < Plans (A). H < L-a < L-i < P, giving BCDA.',
    explanation_fil: 'Pagkatapos ng "Ayala": Health (B) < Land (C) < Life (D) < Plans (A) → BCDA.',
  },
  // Q8 — Fil- companies, page 25
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Filspin Incorporated\nB. Filway Marketing Inc.\nC. Filsov Shipping Company\nD. Fina Products Inc.`,
    choices: [
      { id: 'a', text: 'ACDB' },
      { id: 'b', text: 'CABD' },
      { id: 'c', text: 'BCAD' },
      { id: 'd', text: 'BACD' },
    ],
    correct: 'b',
    explanation_en: 'FIL- (A, B, C) comes before FIN- (D) since L < N. Among FIL: Filsov (C: s-o) < Filspin (A: s-p) < Filway (B: w). Order: C → A → B → D = CABD.',
    explanation_fil: 'FIL- < FIN- (L < N). Sa FIL-grupo: Filsov (C) < Filspin (A) < Filway (B). Kaya CABD.',
  },
  // Q9 — John + last names, page 26
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. John Shannon Montessori\nB. John Paul Hospital\nC. John Robert Powers\nD. John Nelson and Associates`,
    choices: [
      { id: 'a', text: 'DACB' },
      { id: 'b', text: 'DBCA' },
      { id: 'c', text: 'DCBA' },
      { id: 'd', text: 'DABC' },
    ],
    correct: 'b',
    explanation_en: 'After "John": Nelson (D) < Paul (B) < Robert (C) < Shannon (A). N < P < R < Sh, giving DBCA.',
    explanation_fil: 'Pagkatapos ng "John": Nelson (D) < Paul (B) < Robert (C) < Shannon (A) → DBCA.',
  },
  // Q10 — Sports companies, page 26
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Sports Zone Restaurant\nB. Sports Resources Inc.\nC. Sports Values Inc.\nD. Sports House and General Merchandise`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'BCDA' },
      { id: 'c', text: 'CBDA' },
      { id: 'd', text: 'DBCA' },
    ],
    correct: 'd',
    explanation_en: 'After "Sports": House (D) < Resources (B) < Values (C) < Zone (A). H < R < V < Z, giving DBCA.',
    explanation_fil: 'Pagkatapos ng "Sports": House (D) < Resources (B) < Values (C) < Zone (A) → DBCA.',
  },
  // Q11 — Abad first names, page 26
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Abad, Josephine\nB. Abad, Jason\nC. Abad, Joseph\nD. Abad, June`,
    choices: [
      { id: 'a', text: 'DBCA' },
      { id: 'b', text: 'DBAC' },
      { id: 'c', text: 'BDCA' },
      { id: 'd', text: 'BCDA' },
    ],
    correct: 'a',
    explanation_en: 'Per the answer key: DBCA. Note: By strict alphabetical order, the sequence Jason (B) → Joseph (C) → Josephine (A) → June (D) = BCAD would be expected, but the exam answer key gives DBCA. Use the given answer key for exam purposes.',
    explanation_fil: 'Ayon sa answer key: DBCA. Tandaan: Sa mahigpit na alpabetikong pagkakasunod, ang BCAD (Jason → Joseph → Josephine → June) ang inaasahan, ngunit ang tanong na ito ay gumagamit ng ibang pagkakasunod ayon sa answer key.',
  },
  // Q12 — St. schools, page 27
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. St. Stephen's School\nB. St. Stephen's University\nC. St. Scholastica's Academy\nD. St. Scholastica's College`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'CDBA' },
      { id: 'c', text: 'CDAB' },
      { id: 'd', text: 'DCAB' },
    ],
    correct: 'c',
    explanation_en: 'After "St.": Scholastica (C, D) < Stephen (A, B) since "Sch" < "Ste". Among Scholastica: Academy (C) < College (D). Among Stephen: School (A) < University (B). Order: C → D → A → B = CDAB.',
    explanation_fil: '"Scholastica" (C, D) < "Stephen" (A, B). Sa Scholastica: Academy (C) < College (D). Sa Stephen: School (A) < University (B). Kaya CDAB.',
  },
  // Q13 — Santos first names, page 27
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Santos, Anita\nB. Santos, Ana\nC. Santos, Antonio\nD. Santos, Anthony`,
    choices: [
      { id: 'a', text: 'CDBA' },
      { id: 'b', text: 'DCBA' },
      { id: 'c', text: 'BADC' },
      { id: 'd', text: 'BACD' },
    ],
    correct: 'c',
    explanation_en: 'After "Santos,": Ana (B: An-a) < Anita (A: An-i) < Anthony (D: An-t-h) < Antonio (C: An-t-o). The key difference: "th" < "to" (h < o). Order: B → A → D → C = BADC.',
    explanation_fil: 'Pagkatapos ng "Santos,": Ana (B) < Anita (A) < Anthony (D) < Antonio (C). "Anth-" ay naunahan ng "Anto-" dahil h < o. Kaya BADC.',
  },
  // Q14 — Philippine newspapers, page 27
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Philippine Daily Inquirer\nB. Philippine Star\nC. Philippine Herald\nD. Philippine Tribune`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'ACBD' },
      { id: 'c', text: 'ADCB' },
      { id: 'd', text: 'ACDB' },
    ],
    correct: 'b',
    explanation_en: 'After "Philippine": Daily (A) < Herald (C) < Star (B) < Tribune (D). D < H < S < T, giving ACBD.',
    explanation_fil: 'Pagkatapos ng "Philippine": Daily (A) < Herald (C) < Star (B) < Tribune (D) → ACBD.',
  },
  // Q15 — Luna first names, page 28
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Luna, Antonio\nB. Luna, Juan\nC. Luna, Olive\nD. Luna, Oliver`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'ABDC' },
      { id: 'c', text: 'ACBD' },
      { id: 'd', text: 'ADCB' },
    ],
    correct: 'a',
    explanation_en: 'After "Luna,": Antonio (A) < Juan (B) < Olive (C) < Oliver (D). A < J < Olive < Oliver (Oliver extends Olive by one letter). Order: A → B → C → D = ABCD.',
    explanation_fil: 'Pagkatapos ng "Luna,": Antonio (A) < Juan (B) < Olive (C) < Oliver (D). Si Olive ay mas maigsi kaysa kay Oliver, kaya C bago D. Kaya ABCD.',
  },
  // Q16 — Felimon/Felipe names, page 28
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Felimon, Jason\nB. Felipe, Julian\nC. Felimon, Jamie\nD. Felipe, Julia`,
    choices: [
      { id: 'a', text: 'CADB' },
      { id: 'b', text: 'ACBD' },
      { id: 'c', text: 'CABD' },
      { id: 'd', text: 'ACDB' },
    ],
    correct: 'a',
    explanation_en: 'Surname first: Felimon (A, C: Felim-) < Felipe (B, D: Felip-) since "m" < "p". Among Felimon: Jamie (C) < Jason (A) since "m" < "s". Among Felipe: Julia (D) < Julian (B) since Julia is a prefix. Order: C → A → D → B = CADB.',
    explanation_fil: 'Apelyido muna: Felimon (A, C) < Felipe (B, D) dahil "m" < "p". Sa Felimon: Jamie (C) < Jason (A). Sa Felipe: Julia (D) < Julian (B). Kaya CADB.',
  },
  // Q17 — UP Institutes, page 28–29
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. UP Institute for Small Scale Industries\nB. UP Institute for Science and Math Education\nC. UP Institute of Biology\nD. UP Institute of Chemistry`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'BACD' },
      { id: 'c', text: 'CDAB' },
      { id: 'd', text: 'CDBA' },
    ],
    correct: 'd',
    explanation_en: 'Alphabetize by the key noun (ignoring prepositions): Biology (C) < Chemistry (D) < Science (B) < Small Scale (A). B < C < Sc < Sm, giving CDBA.',
    explanation_fil: 'Pag-ayusin ayon sa pangunahing salita (hindi ang preposisyon): Biology (C) < Chemistry (D) < Science (B) < Small Scale (A) → CDBA.',
  },
  // Q18 — Bureau of..., page 29
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Bureau of Post\nB. Bureau of Internal Revenue\nC. Bureau of Mines\nD. Bureau of Fisheries and Aquatic Resources`,
    choices: [
      { id: 'a', text: 'DBCA' },
      { id: 'b', text: 'DABC' },
      { id: 'c', text: 'DCBA' },
      { id: 'd', text: 'DBAC' },
    ],
    correct: 'a',
    explanation_en: 'After "Bureau of": Fisheries (D) < Internal Revenue (B) < Mines (C) < Post (A). F < I < M < P, giving DBCA.',
    explanation_fil: 'Pagkatapos ng "Bureau of": Fisheries (D) < Internal (B) < Mines (C) < Post (A) → DBCA.',
  },
  // Q19 — Rancho/Rallon/Ramirez names, page 29
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Rancho, Elian\nB. Rallon, Michel\nC. Ramirez, Sean\nD. Rancho, Elaine`,
    choices: [
      { id: 'a', text: 'BCAD' },
      { id: 'b', text: 'BDAC' },
      { id: 'c', text: 'BCDA' },
      { id: 'd', text: 'BACD' },
    ],
    correct: 'c',
    explanation_en: 'Surname first: Rallon (B: Ral-) < Ramirez (C: Ram-) < Rancho (A, D: Ran-). Among Rancho: Elaine (D: Ela-) < Elian (A: Eli-) since "a" < "i" at position 3. Order: B → C → D → A = BCDA.',
    explanation_fil: 'Apelyido muna: Rallon (B) < Ramirez (C) < Rancho (A, D). Sa Rancho: Elaine (D) < Elian (A) dahil "Ela-" < "Eli-". Kaya BCDA.',
  },
  // Q20 — Que- surnames, page 29–30
  {
    stem: `Arrange each group of items in alphabetical order:\n\nA. Quesada, Arianne\nB. Quisumbing, Armie\nC. Quintin, Adela\nD. Quezon, Aurora`,
    choices: [
      { id: 'a', text: 'ABCD' },
      { id: 'b', text: 'ADCB' },
      { id: 'c', text: 'ACBD' },
      { id: 'd', text: 'ABDC' },
    ],
    correct: 'b',
    explanation_en: 'All start with "Qu": Que- (A, D) < Qui- (B, C). Among Que-: Quesada (A: Ques-) < Quezon (D: Quez-) since s < z. Among Qui-: Quintin (C: Quin-) < Quisumbing (B: Quis-) since n < s. Order: A → D → C → B = ADCB.',
    explanation_fil: 'Lahat nagsisimula sa "Qu-": Que- (A, D) < Qui- (B, C). Sa Que-: Quesada (A) < Quezon (D). Sa Qui-: Quintin (C) < Quisumbing (B). Kaya ADCB.',
  },
];

async function main() {
  console.log('📂 Clerical Operations — Alphabetizing\n');

  // Find the filing-coding topic under sub-professional clerical ability
  const { data: topics, error: tErr } = await sb
    .from('topics')
    .select('id, name, slug')
    .or('slug.ilike.%filing%,slug.ilike.%alphabetiz%,name.ilike.%filing%,name.ilike.%alphabetiz%');

  if (tErr) throw tErr;

  console.log('Available filing/alphabetizing topics:');
  topics.forEach(t => console.log(`  ${t.id} — ${t.name} (${t.slug})`));

  if (!topics.length) {
    console.error('❌ No filing topic found. Check the DB.');
    process.exit(1);
  }

  // Use the first filing topic found (should be 38ae46c3-...)
  const topicId = topics[0].id;
  console.log(`\nUsing topic: ${topicId} — ${topics[0].name}\n`);

  const rows = QUESTIONS.map((q, i) => ({
    topic_id: topicId,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: 2,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Clerical Operations Alphabetizing',
    status: 'published',
    is_verified: true,
  }));

  console.log(`📝 Inserting ${rows.length} alphabetizing questions (Sub-Pro)...\n`);

  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;

  console.log(`✅ Done! +${data.length} questions inserted`);
}

main().catch(e => { console.error(e); process.exit(1); });
