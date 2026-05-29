/**
 * CSE Question Bank — Step 8: Paragraph Development (10 questions)
 * Topic: paragraph-org — both CSE Professional and Sub-Professional
 * Source: CSE Reviewer 2026, pages 69–72
 *
 * Format: Given a scrambled set of sentences (A–E), determine the correct
 * order and answer questions about sequence or title.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_PRO = '0e22fcfd-195f-475c-8df5-5584e229cbee'; // CSE Pro verbal → paragraph-org
const TOPIC_SUB = '539b1777-4f5d-40a8-8a04-703038f1653a'; // CSE Sub verbal → paragraph-org

async function insertBatch(rows) {
  const { error } = await sb.from('questions').insert(rows);
  if (error) { console.error('Insert error:', error.message); process.exit(1); }
}

// ── Paragraph I: How a Bill Becomes a Law ───────────────────────────────────
// Sentences:
//   A. The first procedure is that the bill passes through three readings on separate days.
//   B. Otherwise, the bill will go back to the House from where it originated, and it will be deliberated upon again.
//   C. If the President approves the bill, then it shall be deemed a law.
//   D. A bill, before becoming a law, undergoes several procedures. [TOPIC]
//   E. On the third reading, the votes of the lawmakers shall be recorded and if the bill is approved, it goes to the President for approval or veto.
// Correct order: D → A → E → C → B
//
// ── Paragraph II: The Value of Listening ────────────────────────────────────
// Sentences:
//   A. Learning to listen is one way of keeping friends. [TOPIC]
//   B. Although listening can really be very tiring on the listener, it may, on the other hand, be comforting to the speaker.
//   C. So learn how to listen, and gain more friends. [CONCLUSION]
//   D. We also show that we care about what goes on in their lives.
//   E. By listening, we show our friends that they are important to us.
// Correct order: A → E → D → B → C
//
// ── Paragraph III: Duties of the President ─────────────────────────────────
// Sentences:
//   A. Hence, it can be said that the President really has a lot of duties and responsibilities. [CONCLUSION]
//   B. He has control over department secretaries and can overrule their decisions.
//   C. Furthermore, the President exercises veto power over bills passed by the Congress.
//   D. Lastly, he is the Chief Executive, executing the laws and rules of the country.
//   E. The President in a presidential system is the Head of the State and the Head of Government. [TOPIC]
// Correct order: E → B → C → D → A
//
// ── Paragraph IV: Pay Your Taxes ────────────────────────────────────────────
// Sentences:
//   A. Not only that, paying taxes also means the government will no longer need to acquire loans to fill the budget deficit.
//   B. Every citizen should lend a hand in pursuing economic progress. [TOPIC]
//   C. One way to do it is to pay one's taxes correctly.
//   D. Paying correct taxes results in increased revenues that the government uses for infrastructure and other projects.
//   E. So be a good citizen and pay your taxes correctly. [CONCLUSION]
// Correct order: B → C → D → A → E

const PASSAGE_I = `Passage I — Read the sentences below, then answer the questions.
A. The first procedure is that the bill passes through three readings on separate days.
B. Otherwise, the bill will go back to the House from where it originated, and it will be deliberated upon again.
C. If the President approves the bill, then it shall be deemed a law.
D. A bill, before becoming a law, undergoes several procedures.
E. On the third reading, the votes of the lawmakers shall be recorded; if the bill is approved, it goes to the President for approval or veto.

Correct order: D – A – E – C – B`;

const PASSAGE_II = `Passage II — Read the sentences below, then answer the questions.
A. Learning to listen is one way of keeping friends.
B. Although listening can really be very tiring on the listener, it may, on the other hand, be comforting to the speaker.
C. So learn how to listen, and gain more friends.
D. We also show that we care about what goes on in their lives.
E. By listening, we show our friends that they are important to us.

Correct order: A – E – D – B – C`;

const PASSAGE_III = `Passage III — Read the sentences below, then answer the questions.
A. Hence, it can be said that the President really has a lot of duties and responsibilities.
B. He has control over department secretaries and can overrule their decisions.
C. Furthermore, the President exercises veto power over bills passed by Congress.
D. Lastly, he is the Chief Executive, executing the laws and rules of the country.
E. The President in a presidential system is the Head of the State and the Head of Government.

Correct order: E – B – C – D – A`;

const PASSAGE_IV = `Passage IV — Read the sentences below, then answer the questions.
A. Not only that, paying taxes also means the government will no longer need to acquire loans to fill the budget deficit.
B. Every citizen should lend a hand in pursuing economic progress.
C. One way to do it is to pay one's taxes correctly.
D. Paying correct taxes results in increased revenues that the government uses for infrastructure and other projects.
E. So be a good citizen and pay your taxes correctly.

Correct order: B – C – D – A – E`;

const QUESTIONS = [
  // ── Passage I (3 questions) ──────────────────────────────────────────────
  {
    stem: `${PASSAGE_I}\n\nQuestion 1: What should be the FIRST sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'Sentence D ("A bill, before becoming a law, undergoes several procedures.") is the topic sentence — it introduces the subject. It must come first to orient the reader. The correct order is D→A→E→C→B.',
    explanation_fil: 'Ang pangungusap D ("A bill, before becoming a law, undergoes several procedures.") ang topic sentence — ipinapakilala nito ang paksa. Dapat itong maging una para maunawaan ng mambabasa ang nilalaman. Ang tamang ayos ay D→A→E→C→B.',
  },
  {
    stem: `${PASSAGE_I}\n\nQuestion 2: What should be the FOURTH sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'In the order D→A→E→C→B, the fourth sentence is C. Sentence E describes what happens at the third reading (bill goes to the President), and Sentence C logically follows: if the President approves, it becomes law.',
    explanation_fil: 'Sa ayos na D→A→E→C→B, ang ikaapat na pangungusap ay C. Inilalarawan ng pangungusap E kung ano ang nangyayari sa ikatlong pagbabasa (ang bill ay pumupunta sa Pangulo), at lohikal na sumusunod ang pangungusap C: kung ang Pangulo ay pumayag, nagiging batas ito.',
  },
  {
    stem: `${PASSAGE_I}\n\nIf the following sentence is added as Sentence F: "It should be noted, however, that the President must communicate his veto within thirty days from receipt of the bill; otherwise, the bill is considered to have been approved by him."\n\nQuestion 3: What would the new correct order of the six sentences (A–F) be?`,
    choices: [
      { id: 'a', text: 'B-C-D-E-A-F' },
      { id: 'b', text: 'D-B-A-F-C-E' },
      { id: 'c', text: 'D-A-E-C-F-B' },
      { id: 'd', text: 'A-B-C-D-E-F' },
      { id: 'e', text: 'C-B-D-A-E-F' },
    ],
    correct: 'c', difficulty: 3,
    explanation_en: 'Sentence F explains what happens if the President does NOT act within 30 days (passive approval) — this follows C (President approves → law) and precedes B (otherwise it goes back). New order: D→A→E→C→F→B.',
    explanation_fil: 'Ang pangungusap F ay nagpapaliwanag kung ano ang mangyayari kung ang Pangulo ay HINDI kumilos sa loob ng 30 araw (passive na pag-apruba) — sumusunod ito sa C (Pangulo ay pumayag → nagiging batas) at nauuna sa B (kung hindi, babalik ito). Bagong ayos: D→A→E→C→F→B.',
  },

  // ── Passage II (2 questions) ─────────────────────────────────────────────
  {
    stem: `${PASSAGE_II}\n\nQuestion 4: What should be the THIRD sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'In the order A→E→D→B→C, the third sentence is D. After stating that listening shows friends they are important (E), Sentence D adds: "We also show that we care about what goes on in their lives." The word "also" signals continuation.',
    explanation_fil: 'Sa ayos na A→E→D→B→C, ang ikatlong pangungusap ay D. Pagkatapos sabihin na ang pakikinig ay nagpapakita sa mga kaibigan na mahalaga sila (E), ang pangungusap D ay nagdaragdag: "We also show that we care about what goes on in their lives." Ang salitang "also" ay nagpapahiwatig ng pagpapatuloy.',
  },
  {
    stem: `${PASSAGE_II}\n\nQuestion 5: What should be the FOURTH sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'In the order A→E→D→B→C, the fourth sentence is B. Sentence B presents a concession ("Although listening is tiring…") before the conclusion. The word "although" introduces a contrasting idea.',
    explanation_fil: 'Sa ayos na A→E→D→B→C, ang ikaapat na pangungusap ay B. Ang pangungusap B ay nagpapakita ng konsesyon ("Although listening is tiring…") bago ang konklusyon. Ang salitang "although" ay nagpapakilala ng kaibang ideya.',
  },

  // ── Passage III (2 questions) ────────────────────────────────────────────
  {
    stem: `${PASSAGE_III}\n\nQuestion 6: What should be the SECOND sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'In the order E→B→C→D→A, the second sentence is B. After the topic sentence (E) introduces the President\'s roles, Sentence B gives the first detail: control over department secretaries. The clue words "Furthermore" (C) and "Lastly" (D) show C and D come after B.',
    explanation_fil: 'Sa ayos na E→B→C→D→A, ang ikalawang pangungusap ay B. Pagkatapos ng topic sentence (E) na nagpapakilala sa mga tungkulin ng Pangulo, ang pangungusap B ay nagbibigay ng unang detalye: kontrol sa mga kalihim ng departamento. Ang mga clue words na "Furthermore" (C) at "Lastly" (D) ay nagpapakita na sumusunod ang C at D pagkatapos ng B.',
  },
  {
    stem: `${PASSAGE_III}\n\nQuestion 7: What should be the LAST sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'In the order E→B→C→D→A, the last sentence is A. Sentence A ("Hence, it can be said that the President really has a lot of duties and responsibilities.") is the concluding sentence. The word "Hence" signals a summary or conclusion.',
    explanation_fil: 'Sa ayos na E→B→C→D→A, ang huling pangungusap ay A. Ang pangungusap A ("Hence, it can be said that the President really has a lot of duties and responsibilities.") ang pangwakas na pangungusap. Ang salitang "Hence" ay nagpapahiwatig ng buod o konklusyon.',
  },

  // ── Passage IV (3 questions) ─────────────────────────────────────────────
  {
    stem: `${PASSAGE_IV}\n\nQuestion 8: What should be the SECOND sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'In the order B→C→D→A→E, the second sentence is C. After Sentence B introduces the general idea (citizens should pursue economic progress), Sentence C narrows it down with a specific method: "One way to do it is to pay one\'s taxes correctly."',
    explanation_fil: 'Sa ayos na B→C→D→A→E, ang ikalawang pangungusap ay C. Pagkatapos ng pangungusap B na nagpapakilala ng pangkalahatang ideya (dapat tumulong ang mga mamamayan sa pag-unlad ng ekonomiya), ang pangungusap C ay nagpapakita ng isang paraan: "One way to do it is to pay one\'s taxes correctly."',
  },
  {
    stem: `${PASSAGE_IV}\n\nQuestion 9: What should be the FOURTH sentence of the paragraph?`,
    choices: [
      { id: 'a', text: 'Sentence A' },
      { id: 'b', text: 'Sentence B' },
      { id: 'c', text: 'Sentence C' },
      { id: 'd', text: 'Sentence D' },
      { id: 'e', text: 'Sentence E' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'In the order B→C→D→A→E, the fourth sentence is A. Sentence D explains the primary benefit of paying taxes (increased revenue for infrastructure). Sentence A then adds another benefit using "Not only that…" — a clear signal it follows D.',
    explanation_fil: 'Sa ayos na B→C→D→A→E, ang ikaapat na pangungusap ay A. Ang pangungusap D ay nagpapaliwanag ng pangunahing benepisyo ng pagbabayad ng buwis (mas maraming kita para sa imprastraktura). Ang pangungusap A ay nagdaragdag ng isa pang benepisyo gamit ang "Not only that…" — malinaw na senyales na sumusunod ito sa D.',
  },
  {
    stem: `${PASSAGE_IV}\n\nQuestion 10: What is the most appropriate TITLE for the paragraph above?`,
    choices: [
      { id: 'a', text: 'Economic Progress' },
      { id: 'b', text: "A Citizen's Duty" },
      { id: 'c', text: 'Taxing the Economy' },
      { id: 'd', text: 'Taxes and Economic Progress' },
      { id: 'e', text: 'Lend a Hand for Progress' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: '"Taxes and Economic Progress" best captures both main ideas of the paragraph: (1) the specific action — paying taxes, and (2) the outcome — economic progress. The other choices are either too broad (A, E), too narrow (B), or misleading (C).',
    explanation_fil: 'Ang "Taxes and Economic Progress" ay pinakamagaling na sumasaklaw sa dalawang pangunahing ideya ng talata: (1) ang partikular na aksyon — pagbabayad ng buwis, at (2) ang resulta — pag-unlad ng ekonomiya. Ang iba pang pagpipilian ay masyadong malawak (A, E), masyadong makitid (B), o nakaliligaw (C).',
  },
];

async function main() {
  console.log(`📖 Inserting Paragraph Development (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const SOURCE = 'CSE Reviewer 2026 | English: Paragraph Development | Level: both | flashcard:no | tutor-ready:yes';

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: SOURCE,
    status: 'published',
    is_verified: true,
  }));

  const subRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_SUB,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: SOURCE,
    status: 'published',
    is_verified: true,
  }));

  await insertBatch(proRows);
  console.log(`  Pro paragraph-org: ${proRows.length} questions inserted.`);

  await insertBatch(subRows);
  console.log(`  Sub paragraph-org: ${subRows.length} questions inserted.`);

  const { count } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`\n✅ Done! Total published questions in DB: ${count}`);
  console.log(`   (+${proRows.length + subRows.length} new questions across Pro + Sub)\n`);
}

main().catch(console.error);
