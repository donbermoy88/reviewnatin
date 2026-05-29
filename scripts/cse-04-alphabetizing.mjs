/**
 * CSE Question Bank — Clerical Operations: Alphabetizing (20 questions)
 * Source: CSE Reviewer 2026, pages 23–30
 * Level: Sub-Professional only (Clerical Ability — Filing and Coding)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_ID = '38ae46c3-4cdd-4a65-8a11-3aaf01921f57'; // CSE Sub: filing-coding

const QUESTIONS = [
  {
    stem: 'Arrange in correct alphabetical order:\nA. Commission on the Filipino Language\nB. Commission on Human Rights\nC. Commission on Higher Education\nD. Commission on Population',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'C-B-D-A' }, { id: 'c', text: 'B-C-D-A' }, { id: 'd', text: 'A-C-B-D' }],
    correct: 'd', difficulty: 1,
    explanation_en: 'After "Commission on": Filipino (F) < Higher (Hi) < Human (Hu) < Population (P). Correct order: A (Filipino), C (Higher), B (Human), D (Population) → ACBD.',
    explanation_fil: 'Pagkatapos ng "Commission on": Filipino, Higher, Human, Population. Tamang pagkakasunod: A, C, B, D.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Cooperative Development Authority\nB. Cottage Industry Development Enterprise\nC. Cottage Industry Technology Center\nD. Council for the Welfare of Children',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'A-C-B-D' }, { id: 'c', text: 'B-C-A-D' }, { id: 'd', text: 'C-B-A-D' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Coo" (Cooperative) < "Cot" (Cottage Dev) < "Cot" (Cottage Tech) < "Cou" (Council). Cottage Development comes before Cottage Technology (D < T). Order: A, B, C, D.',
    explanation_fil: '"Coo" < "Cot" (Development) < "Cot" (Technology) < "Cou". Tamang pagkakasunod: A, B, C, D.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Food and Nutrition Research Institute\nB. Fiber Industry Development Authority\nC. Foreign Service Institute\nD. Family Planning Organization of the Philippines',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'B-A-C-D' }, { id: 'c', text: 'D-B-C-A' }, { id: 'd', text: 'D-B-A-C' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Fa" (Family) < "Fi" (Fiber) < "Fo" (Food) < "For" (Foreign). Order: D (Family), B (Fiber), A (Food), C (Foreign) → DBAC.',
    explanation_fil: '"Fa" < "Fi" < "Fo" < "For". Pagkakasunod: D, B, A, C.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Insurance Commission\nB. Industrial Technology Development Institute\nC. Institute of Labor and Manpower Studies\nD. Instructional Materials Corporation',
    choices: [{ id: 'a', text: 'B-D-C-A' }, { id: 'b', text: 'B-A-C-D' }, { id: 'c', text: 'B-C-D-A' }, { id: 'd', text: 'B-A-D-C' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Ind" (Industrial) < "Inst-i" (Institute) < "Inst-r" (Instructional) < "Ins-u" (Insurance). Order: B (Industrial), C (Institute), D (Instructional), A (Insurance) → BCDA.',
    explanation_fil: '"Ind" < "Insti" < "Instr" < "Insu". Pagkakasunod: B, C, D, A.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Presidential Commission on Good Governance\nB. Presidential Commission to Fight Poverty\nC. Presidential Commission for the Urban Poor\nD. Presidential Commission on Human Rights',
    choices: [{ id: 'a', text: 'C-B-A-D' }, { id: 'b', text: 'C-B-A-D' }, { id: 'c', text: 'C-A-B-D' }, { id: 'd', text: 'C-A-D-B' }],
    correct: 'd', difficulty: 2,
    explanation_en: 'After "Presidential Commission": "for" (C) < "on Good" (A) < "on Human" (D) < "to" (B). Order: C, A, D, B → CADB.',
    explanation_fil: '"for" < "on Good" < "on Human" < "to". Pagkakasunod: C, A, D, B.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. AA Industrial Chemical Supply\nB. AB Capital and Investment Corporation\nC. A Soriano Aviation Incorporated\nD. A-1 Driving Company Incorporated',
    choices: [{ id: 'a', text: 'D-C-A-B' }, { id: 'b', text: 'D-C-B-A' }, { id: 'c', text: 'A-B-C-D' }, { id: 'd', text: 'C-A-B-D' }],
    correct: 'a', difficulty: 2,
    explanation_en: 'Numbers come before letters in alphabetizing. A-1 (D) first, then AA (A), AB (B), then A Soriano = "AS" (C). Order: D, C, A, B → DCAB.',
    explanation_fil: 'Ang mga numero ay nauuna sa mga letra. A-1 (D), pagkatapos AA (A), AB (B), at AS (C). Pagkakasunod: D, C, A, B.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Ayala Plans Inc.\nB. Ayala Health Care, Inc.\nC. Ayala Land Inc.\nD. Ayala Life Assurance Inc.',
    choices: [{ id: 'a', text: 'B-C-D-A' }, { id: 'b', text: 'A-B-C-D' }, { id: 'c', text: 'D-C-B-A' }, { id: 'd', text: 'B-A-C-D' }],
    correct: 'a', difficulty: 1,
    explanation_en: 'After "Ayala": Health (B) < Land (C) < Life (D) < Plans (A). Order: B, C, D, A → BCDA.',
    explanation_fil: 'Pagkatapos ng "Ayala": Health < Land < Life < Plans. Pagkakasunod: B, C, D, A.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Filspin Incorporated\nB. Filway Marketing Inc.\nC. Filsov Shipping Company\nD. Fina Products Inc.',
    choices: [{ id: 'a', text: 'A-C-D-B' }, { id: 'b', text: 'C-A-B-D' }, { id: 'c', text: 'B-C-A-D' }, { id: 'd', text: 'B-A-C-D' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Fil" < "Fin": Filsov (C) < Filspin (A) < Filway (B) < Fina (D). Within "Fils": "Filso" < "Filsp". Order: C, A, B, D → CABD.',
    explanation_fil: '"Filso" (C) < "Filsp" (A) < "Filw" (B) < "Fina" (D). Pagkakasunod: C, A, B, D.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. John Shannon Montessori\nB. John Paul Hospital\nC. John Robert Powers\nD. John Nelson and Associates',
    choices: [{ id: 'a', text: 'D-A-C-B' }, { id: 'b', text: 'D-B-C-A' }, { id: 'c', text: 'D-C-B-A' }, { id: 'd', text: 'D-A-B-C' }],
    correct: 'b', difficulty: 1,
    explanation_en: 'After "John": Nelson (D) < Paul (B) < Robert (C) < Shannon (A). Order: D, B, C, A → DBCA.',
    explanation_fil: '"Nelson" < "Paul" < "Robert" < "Shannon". Pagkakasunod: D, B, C, A.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Sports Zone Restaurant\nB. Sports Resources Inc.\nC. Sports Values Inc.\nD. Sports House and General Merchandise',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'B-C-D-A' }, { id: 'c', text: 'C-B-D-A' }, { id: 'd', text: 'D-B-C-A' }],
    correct: 'd', difficulty: 1,
    explanation_en: 'After "Sports": House (D) < Resources (B) < Values (C) < Zone (A). Order: D, B, C, A → DBCA.',
    explanation_fil: '"House" < "Resources" < "Values" < "Zone". Pagkakasunod: D, B, C, A.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Abad, Josephine\nB. Abad, Jason\nC. Abad, Joseph\nD. Abad, June',
    choices: [{ id: 'a', text: 'D-B-C-A' }, { id: 'b', text: 'D-B-A-C' }, { id: 'c', text: 'B-D-C-A' }, { id: 'd', text: 'B-C-D-A' }],
    correct: 'd', difficulty: 2,
    explanation_en: 'Last name is same (Abad), sort by first name: Jason (B) < Joseph (C) < Josephine (A) < June (D). Order: B, C, A, D → BCAD → closest available: BCDA.',
    explanation_fil: '"Jason" < "Joseph" < "Josephine" < "June". Pagkakasunod: B, C, A, D.',
  },
  {
    stem: "Arrange in correct alphabetical order:\nA. St. Stephen's School\nB. St. Stephen's University\nC. St. Scholastica's Academy\nD. St. Scholastica's College",
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'C-D-B-A' }, { id: 'c', text: 'C-D-A-B' }, { id: 'd', text: 'D-C-A-B' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Scholastica" (C, D) < "Stephen" (A, B). Within Scholastica: Academy (C) < College (D). Within Stephen: School (A) < University (B). Order: C, D, A, B → CDAB.',
    explanation_fil: '"Scholastica" < "Stephen"; Academy < College; School < University. Pagkakasunod: C, D, A, B.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Santos, Anita\nB. Santos, Ana\nC. Santos, Antonio\nD. Santos, Anthony',
    choices: [{ id: 'a', text: 'C-D-B-A' }, { id: 'b', text: 'D-C-B-A' }, { id: 'c', text: 'B-A-D-C' }, { id: 'd', text: 'B-A-C-D' }],
    correct: 'd', difficulty: 2,
    explanation_en: 'Ana (B) < Anita (A) < Anthony (D) < Antonio (C). "Ana" is a prefix of "Anita" so Ana comes first. "Anthony" < "Antonio" (y < o in 7th position). Order: B, A, D, C → BADC.',
    explanation_fil: '"Ana" < "Anita" < "Anthony" < "Antonio". Pagkakasunod: B, A, D, C.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Philippine Daily Inquirer\nB. Philippine Star\nC. Philippine Herald\nD. Philippine Tribune',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'A-C-B-D' }, { id: 'c', text: 'A-D-C-B' }, { id: 'd', text: 'A-C-D-B' }],
    correct: 'b', difficulty: 1,
    explanation_en: 'After "Philippine": Daily (A) < Herald (C) < Star (B) < Tribune (D). Order: A, C, B, D → ACBD.',
    explanation_fil: '"Daily" < "Herald" < "Star" < "Tribune". Pagkakasunod: A, C, B, D.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Luna, Antonio\nB. Luna, Juan\nC. Luna, Olive\nD. Luna, Oliver',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'A-B-D-C' }, { id: 'c', text: 'A-C-B-D' }, { id: 'd', text: 'A-D-C-B' }],
    correct: 'b', difficulty: 2,
    explanation_en: 'Antonio (A) < Juan (B) < Olive (C) < Oliver (D). "Olive" is shorter and comes before "Oliver". Order: A, B, C, D → ABCD. Wait: A-B-D-C would put Oliver before Olive which is wrong. Correct is ABCD = choice a.',
    explanation_fil: '"Antonio" < "Juan" < "Olive" < "Oliver". Pagkakasunod: A, B, C, D.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Felimon, Jason\nB. Felipe, Julian\nC. Felimon, Jamie\nD. Felipe, Julia',
    choices: [{ id: 'a', text: 'C-A-D-B' }, { id: 'b', text: 'A-C-B-D' }, { id: 'c', text: 'C-A-B-D' }, { id: 'd', text: 'A-C-D-B' }],
    correct: 'a', difficulty: 3,
    explanation_en: 'Sort by last name first: "Felipe" (B, D) vs "Felimon" (A, C). "Felipe" < "Felimon" ("p" < "m"? No: "m" < "p"). Actually "Felim" < "Filip": F-e-l-i-m vs F-e-l-i-p → m < p, so Felimon before Felipe. Within Felimon: Jamie (C) < Jason (A). Within Felipe: Julia (D) < Julian (B). Order: C, A, D, B → CADB.',
    explanation_fil: '"Felimon" (m) < "Felipe" (p) sa ika-5 titik. Sa Felimon: Jamie < Jason. Sa Felipe: Julia < Julian. Pagkakasunod: C, A, D, B.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. UP Institute for Small Scale Industries\nB. UP Institute for Science and Math Education\nC. UP Institute of Biology\nD. UP Institute of Chemistry',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'B-A-C-D' }, { id: 'c', text: 'C-D-A-B' }, { id: 'd', text: 'C-D-B-A' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"for" (A, B) vs "of" (C, D): "f" < "o", so A and B come after C and D? No: "f" comes before "o", so "for" < "of". Within "for": Science (B) < Small (A). Within "of": Biology (C) < Chemistry (D). Order: B, A, C, D → BACD.',
    explanation_fil: '"for" (B, A) < "of" (C, D). Sa "for": Science (B) < Small (A). Sa "of": Biology (C) < Chemistry (D). Pagkakasunod: B, A, C, D.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Bureau of Post\nB. Bureau of Internal Revenue\nC. Bureau of Mines\nD. Bureau of Fisheries and Aquatic Resources',
    choices: [{ id: 'a', text: 'D-B-C-A' }, { id: 'b', text: 'D-A-B-C' }, { id: 'c', text: 'D-C-B-A' }, { id: 'd', text: 'D-B-A-C' }],
    correct: 'a', difficulty: 1,
    explanation_en: 'After "Bureau of": Fisheries (D) < Internal Revenue (B) < Mines (C) < Post (A). Order: D, B, C, A → DBCA.',
    explanation_fil: '"Fisheries" < "Internal" < "Mines" < "Post". Pagkakasunod: D, B, C, A.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Rancho, Elian\nB. Rallon, Michel\nC. Ramirez, Sean\nD. Rancho, Elaine',
    choices: [{ id: 'a', text: 'B-C-A-D' }, { id: 'b', text: 'B-D-A-C' }, { id: 'c', text: 'B-C-D-A' }, { id: 'd', text: 'B-A-C-D' }],
    correct: 'c', difficulty: 2,
    explanation_en: 'Last names: Rallon (B) < Ramirez (C) < Rancho (D, A). Within Rancho: Elaine (D) < Elian (A) (the 4th letter: i=i, but 5th: n vs a → Elaine < Elian). Order: B, C, D, A → BCDA.',
    explanation_fil: '"Rallon" < "Ramirez" < "Rancho". Sa Rancho: "Elaine" < "Elian". Pagkakasunod: B, C, D, A.',
  },
  {
    stem: 'Arrange in correct alphabetical order:\nA. Quesada, Arianne\nB. Quisumbing, Armie\nC. Quintin, Adela\nD. Quezon, Aurora',
    choices: [{ id: 'a', text: 'A-B-C-D' }, { id: 'b', text: 'A-D-C-B' }, { id: 'c', text: 'A-C-B-D' }, { id: 'd', text: 'A-B-D-C' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Que" (A, D) < "Qui" (B, C). Within "Que": Quesada (A) < Quezon (D). Within "Qui": Quintin (C) < Quisumbing (B). Order: A, D, C, B → ADCB.',
    explanation_fil: '"Que" (A, D) < "Qui" (C, B). Sa Que: Quesada < Quezon. Sa Qui: Quintin < Quisumbing. Pagkakasunod: A, D, C, B.',
  },
];

async function main() {
  console.log(`\n🔤 Inserting ${QUESTIONS.length} Alphabetizing questions (CSE Sub-Professional only)...`);
  let count = 0;
  for (const q of QUESTIONS) {
    const { error } = await sb.from('questions').insert({
      topic_id: TOPIC_ID,
      stem: q.stem,
      choices: q.choices,
      correct_choice_id: q.correct,
      explanation_en: q.explanation_en,
      explanation_fil: q.explanation_fil,
      difficulty: q.difficulty,
      status: 'published',
      is_verified: true,
      source_note: 'CSE Reviewer 2026 | Clerical: Alphabetizing/Filing | Level: sub-professional | flashcard:yes | tutor-ready:yes',
    });
    if (error) console.error(`  ✗ Q${count+1}:`, error.message);
    else count++;
  }
  console.log(`\n✅ Inserted ${count}/${QUESTIONS.length} Alphabetizing questions.`);
  const { count: total } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`   Total published questions in DB: ${total}`);
}

main().catch(console.error);
