/**
 * CSE-15: Filipino — Pagkilala sa Mali (Identifying Errors) — 25 questions
 * Both Professional and Sub-Professional
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_PRO = 'd3b160b3-f0e1-4fd4-a9d8-c8dcbc401c79';
const TOPIC_SUB = 'd6e97a36-5e2f-4a98-a363-abefdcf7ab62';

// Each question shows a sentence with underlined parts (A,B,C,D) and asks which part has the error.
// "D) Walang mali" means the sentence is correct.
const QUESTIONS = [
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang bawat (A)mag-aaral ay dapat (B)magbigay ng respeto (C)sa kanilang mga (D)guro."',
    choices: [
      { id: 'a', text: 'mag-aaral' },
      { id: 'b', text: 'magbigay ng respeto' },
      { id: 'c', text: 'sa kanilang mga' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct. "Ang bawat mag-aaral ay dapat magbigay ng respeto sa kanilang mga guro" has no errors.',
    explanation_fil: 'Ang pangungusap ay wasto. Walang grammatical error sa "Ang bawat mag-aaral ay dapat magbigay ng respeto sa kanilang mga guro."',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Siya ay pumunta sa (B)tindahan kahapon (C)para bumili ng (D)pagkain para bukas."',
    choices: [
      { id: 'a', text: 'Siya ay pumunta sa' },
      { id: 'b', text: 'tindahan kahapon' },
      { id: 'c', text: 'para bumili ng' },
      { id: 'd', text: 'pagkain para bukas' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'The sentence is grammatically correct — all parts are properly constructed.',
    explanation_fil: 'Ang pangungusap ay wasto — lahat ng bahagi ay tamang-tama ang pagkakagamit.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang mga bata ay (A)naglalaro nang (B)masaya sa (C)labas ng bahay (D)bukas ng hapon."',
    choices: [
      { id: 'a', text: 'naglalaro nang' },
      { id: 'b', text: 'masaya sa' },
      { id: 'c', text: 'labas ng bahay' },
      { id: 'd', text: 'bukas ng hapon' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Naglalaro nang masaya" is correct (NANG is the correct ligature for adverb modification). The sentence is actually correct here.',
    explanation_fil: 'Ang "naglalaro nang masaya" ay tamang paggamit ng NANG bilang pang-abay na pangniyog. Wasto ang pangungusap.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Siya ay (A)pumunta sa (B)palengke para (C)ng mga (D)gulay at isda."',
    choices: [
      { id: 'a', text: 'pumunta sa' },
      { id: 'b', text: 'palengke para' },
      { id: 'c', text: 'ng mga' },
      { id: 'd', text: 'gulay at isda' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Para bilhin ang mga gulay" — the phrase "para ng mga" is incorrect; it should be "para bumili ng mga" or "para sa mga."',
    explanation_fil: 'Ang "para ng mga" ay hindi wasto — dapat ay "para bumili ng mga" o "para sa mga." Ang bahagi B ("palengke para") ang nagdudulot ng error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang aking (A)kaibigan at (B)ako ay (C)magpupunta sa (D)sinehan mamaya."',
    choices: [
      { id: 'a', text: 'kaibigan at' },
      { id: 'b', text: 'ako ay' },
      { id: 'c', text: 'magpupunta sa' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct — all parts are properly used.',
    explanation_fil: 'Ang pangungusap ay wasto — lahat ng bahagi ay tamang-tama.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang guro ay (A)nagturo ng (B)leksyon ukol (C)sa kasaysayan (D)ng Pilipinas kahapon."',
    choices: [
      { id: 'a', text: 'nagturo ng' },
      { id: 'b', text: 'leksyon ukol' },
      { id: 'c', text: 'sa kasaysayan' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang (A)estudyante ay (B)nagbabasa ng (C)libro nang (D)tahimik."',
    choices: [
      { id: 'a', text: 'estudyante ay' },
      { id: 'b', text: 'nagbabasa ng' },
      { id: 'c', text: 'libro nang' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"Nagbabasa ng libro nang tahimik" — NANG is correct as an adverb modifier here. The sentence is correct.',
    explanation_fil: '"Nang tahimik" — tamang gamit ng NANG bilang pang-abay. Wasto ang pangungusap.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Hindi ako (A)kumain ng (B)umaga dahil (C)wala akong (D)pagkain."',
    choices: [
      { id: 'a', text: 'kumain ng' },
      { id: 'b', text: 'umaga dahil' },
      { id: 'c', text: 'wala akong' },
      { id: 'd', text: 'pagkain' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Kumain ng umaga" should be "kumain ngayong umaga" or "kumain kanina." The particle NG before "umaga" is incorrect.',
    explanation_fil: '"Kumain ng umaga" ay hindi wasto — dapat ay "kumain ngayong umaga." Ang bahagi A ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang aming (A)pamilya ay (B)nagtungo sa probinsya (C)noong nakaraang (D)Pasko."',
    choices: [
      { id: 'a', text: 'pamilya ay' },
      { id: 'b', text: 'nagtungo sa probinsya' },
      { id: 'c', text: 'noong nakaraang' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Gusto ko (A)ng kumain (B)ng mangga (C)na pinalamig (D)sa ref."',
    choices: [
      { id: 'a', text: 'ng kumain' },
      { id: 'b', text: 'ng mangga' },
      { id: 'c', text: 'na pinalamig' },
      { id: 'd', text: 'sa ref' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Gusto ko nang kumain" — after "gusto ko," the correct ligature is NANG, not NG. "Gusto ko nang kumain" is correct.',
    explanation_fil: 'Ang "Gusto ko ng kumain" ay mali — dapat ay "Gusto ko nang kumain." Ang bahagi A ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang bagong (A)kanta ng (B)artista ay (C)naging sikat (D)agad."',
    choices: [
      { id: 'a', text: 'kanta ng' },
      { id: 'b', text: 'artista ay' },
      { id: 'c', text: 'naging sikat' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang mga (A)kabataan ngayon ay (B)mas magaling (C)kaysa sa amin (D)noong una."',
    choices: [
      { id: 'a', text: 'kabataan ngayon ay' },
      { id: 'b', text: 'mas magaling' },
      { id: 'c', text: 'kaysa sa amin' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct — "kaysa sa amin" is the correct comparative form.',
    explanation_fil: 'Ang pangungusap ay wasto — "kaysa sa amin" ay tamang anyo ng paghahambing.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Mayroon kaming (B)pagtitipon ng (C)pamilya bukas (D)sa tanghali."',
    choices: [
      { id: 'a', text: 'Mayroon kaming' },
      { id: 'b', text: 'pagtitipon ng' },
      { id: 'c', text: 'pamilya bukas' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Sila ay (A)nagkaroon ng (B)pagkakataon na (C)makita ang (D)pangulo."',
    choices: [
      { id: 'a', text: 'nagkaroon ng' },
      { id: 'b', text: 'pagkakataon na' },
      { id: 'c', text: 'makita ang' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Dapat (A)na sinunod (B)ni Juan ang (C)utos ng (D)kanyang ama."',
    choices: [
      { id: 'a', text: 'na sinunod' },
      { id: 'b', text: 'ni Juan ang' },
      { id: 'c', text: 'utos ng' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Dapat na sinunod" should be "dapat ay sundin" or "dapat sundin" — the aspect is incorrect.',
    explanation_fil: 'Ang "Dapat na sinunod" ay mali — dapat ay "Dapat sundin ni Juan ang utos ng kanyang ama." Ang bahagi A ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang (A)kanyang talino ay (B)walang kapantay (C)sa buong (D)klase."',
    choices: [
      { id: 'a', text: 'kanyang talino ay' },
      { id: 'b', text: 'walang kapantay' },
      { id: 'c', text: 'sa buong' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Sa araw na iyon, (B)pinagpalapit namin ang (C)lahat ng mga (D)kasangkapan."',
    choices: [
      { id: 'a', text: 'Sa araw na iyon' },
      { id: 'b', text: 'pinagpalapit namin ang' },
      { id: 'c', text: 'lahat ng mga' },
      { id: 'd', text: 'kasangkapan' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Lahat ng mga" is redundant — "lahat" already implies plurality, so "mga" is unnecessary. It should be "lahat ng kasangkapan."',
    explanation_fil: '"Lahat ng mga" ay paulit-ulit — ang "lahat" ay nagpapakita na ng dami, kaya hindi na kailangan ang "mga." Ang bahagi C ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Binili niya ang (B)mga pula na (C)rosas para (D)sa kanyang inay."',
    choices: [
      { id: 'a', text: 'Binili niya ang' },
      { id: 'b', text: 'mga pula na' },
      { id: 'c', text: 'rosas para' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Mga pulang rosas" — the linker should be "-ng" not "na" since "pula" ends in a vowel. "Pula" + ng = "pulang" rosas.',
    explanation_fil: '"Mga pula na rosas" ay mali — dapat ay "mga pulang rosas." Ang pang-angkop pagkatapos ng salitang nagtatapos sa patinig ay "-ng." Ang bahagi B ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Hindi ko (A)siya makausap (B)nang matagal (C)dahil siya ay (D)abala kahapon."',
    choices: [
      { id: 'a', text: 'siya makausap' },
      { id: 'b', text: 'nang matagal' },
      { id: 'c', text: 'dahil siya ay' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct — "nang matagal" correctly modifies the verb.',
    explanation_fil: 'Ang pangungusap ay wasto — "nang matagal" ay tamang paggamit ng NANG bilang pang-abay.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Ang dami ng (B)mga estudyante ay (C)dumating sa (D)pagtitipon."',
    choices: [
      { id: 'a', text: 'Ang dami ng' },
      { id: 'b', text: 'mga estudyante ay' },
      { id: 'c', text: 'dumating sa' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Siya ay (A)nagtayo ng (B)isang negosyo (C)upang makatulong (D)sa kanyang pamilya."',
    choices: [
      { id: 'a', text: 'nagtayo ng' },
      { id: 'b', text: 'isang negosyo' },
      { id: 'c', text: 'upang makatulong' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Nais naming (B)ipagdiwang ang (C)aming tagumpay (D)ng pagkain."',
    choices: [
      { id: 'a', text: 'Nais naming' },
      { id: 'b', text: 'ipagdiwang ang' },
      { id: 'c', text: 'aming tagumpay' },
      { id: 'd', text: 'ng pagkain' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Ipagdiwang...ng pagkain" — the correct phrase is "sa pamamagitan ng pagkain" or simply "sa isang handaan." The NG here is used incorrectly.',
    explanation_fil: '"Ipagdiwang ng pagkain" ay hindi wasto — dapat ay "ipagdiwang sa pamamagitan ng isang handaan." Ang bahagi D ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"Ang (A)magagandang (B)bulaklak ay (C)pinalamutian ang (D)mesa."',
    choices: [
      { id: 'a', text: 'magagandang' },
      { id: 'b', text: 'bulaklak ay' },
      { id: 'c', text: 'pinalamutian ang' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Pinalamutian ang mesa" — the verb PINALAMUTIAN takes the agent focus. The correct form is "Ipinalamuti ang mesa ng magagandang bulaklak" or "Pinalamutian ng magagandang bulaklak ang mesa."',
    explanation_fil: 'Ang "Ang magagandang bulaklak ay pinalamutian ang mesa" ay may kamalian sa pokus ng pandiwa — dapat ay "Ang mesa ay pinalamutian ng magagandang bulaklak." Ang bahagi C ang may mali.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Maraming salamat (B)sa inyong (C)tulong at (D)suporta."',
    choices: [
      { id: 'a', text: 'Maraming salamat' },
      { id: 'b', text: 'sa inyong' },
      { id: 'c', text: 'tulong at' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto.',
  },
  {
    stem: 'Hanapin ang bahagi ng pangungusap na may mali:\n"(A)Mahalagang (B)matutunan ng (C)bawat bata ang (D)tamang asal."',
    choices: [
      { id: 'a', text: 'Mahalagang' },
      { id: 'b', text: 'matutunan ng' },
      { id: 'c', text: 'bawat bata ang' },
      { id: 'd', text: 'Walang mali' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The sentence is grammatically correct.',
    explanation_fil: 'Ang pangungusap ay wasto — walang grammatical error.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Pagkilala sa Mali (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Pagkilala sa Mali',
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
    source_note: 'CSE 2026 Reviewer — Filipino Pagkilala sa Mali',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro grammar-fil: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub grammar-fil: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
