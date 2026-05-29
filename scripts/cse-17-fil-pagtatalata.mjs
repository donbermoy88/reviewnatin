/**
 * CSE-17: Filipino — Pagtatalata / Pagbuo ng Talata (Paragraph Development) — 10 questions
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

const TOPIC_PRO = '867c0551-9aa4-4dad-a4fc-bc8d8d6eada4';
const TOPIC_SUB = '9b226eb5-beb6-41ac-b92e-b666294126a3';

const QUESTIONS = [
  // TALATA 1 — Ayusin ang pagkakasunod-sunod
  {
    stem: `Piliin ang wastong pagkakasunod-sunod ng mga pangungusap upang makabuo ng isang magkakaugnay na talata:\n\n1. Kaya naman, dapat nating pangalagaan at gamitin nang tama ang ating mga likas na yaman.\n2. Ang Pilipinas ay isang bansang mayaman sa likas na yaman.\n3. Kasama rito ang mga kagubatan, ilog, dagat, at mineral.\n4. Subalit marami sa mga ito ay nanganganib na maubos dahil sa maling paggamit ng tao.`,
    choices: [
      { id: 'a', text: '2 – 3 – 4 – 1' },
      { id: 'b', text: '1 – 2 – 3 – 4' },
      { id: 'c', text: '3 – 2 – 1 – 4' },
      { id: 'd', text: '4 – 3 – 2 – 1' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The logical order: (2) introduce the topic — Philippines is rich in natural resources; (3) enumerate them; (4) problem — they are at risk; (1) solution — protect and properly use them.',
    explanation_fil: 'Ang lohikal na pagkakasunod: (2) ipakilala ang paksa — mayaman sa likas na yaman; (3) ilista ang mga ito; (4) problema — nanganganib na maubos; (1) solusyon — pangalagaan.',
  },
  {
    stem: `Piliin ang pangungusap na pinakaangkop bilang panimulang pangungusap (topic sentence) ng talata tungkol sa kahalagahan ng pagbabasa:\n\n"_______ Ang pagbabasa ay nagbibigay ng kaalaman at nagpapalawak ng ating pag-iisip. Sa pamamagitan nito, natututo tayo ng mga bagong salita at ideya. Bukod dito, nakakatulong din ito sa pagpapahusay ng ating pag-iisip at talino."`,
    choices: [
      { id: 'a', text: 'Ang pagbabasa ay isang gawaing mahal at mahirap.' },
      { id: 'b', text: 'Ang pagbabasa ay isa sa pinakamahalagang gawi na dapat linangin ng bawat isa.' },
      { id: 'c', text: 'Maraming tao ang hindi mahilig magbasa.' },
      { id: 'd', text: 'Ang mga libro ay napakamahal ngayon.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'The topic sentence should introduce the main idea. Option B — "Ang pagbabasa ay isa sa pinakamahalagang gawi" — best introduces the importance of reading as described in the paragraph.',
    explanation_fil: 'Ang topic sentence ay dapat magpakilala ng pangunahing ideya. Ang opsyon B ay pinaka-angkop bilang simula ng talata tungkol sa kahalagahan ng pagbabasa.',
  },
  {
    stem: `Alin sa mga sumusunod ang HINDI angkop na kasama sa talata tungkol sa kalusugan ng puso?\n\n"Ang puso ay isang mahalagang organo ng katawan. _______ Ang regular na ehersisyo ay nakakatulong upang mapanatiling malusog ang puso."`,
    choices: [
      { id: 'a', text: 'Ito ay nagpu-pump ng dugo sa buong katawan.' },
      { id: 'b', text: 'Ang pagkain ng prutas at gulay ay mabuti para sa puso.' },
      { id: 'c', text: 'Ang pag-iwas sa paninigarilyo ay nakatutulong sa kalusugan ng puso.' },
      { id: 'd', text: 'Ang mga pagalit na tao ay mabilis na nagsasalita.' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'D — "Ang mga pagalit na tao ay mabilis na nagsasalita" — is not related to heart health and breaks the unity of the paragraph.',
    explanation_fil: 'Ang opsyon D ay hindi kaugnay ng kalusugan ng puso — ito ay nakakasira sa pagkakaisa ng talata.',
  },
  {
    stem: `Piliin ang pinaka-angkop na pangungusap na magtatapos (concluding sentence) sa talata:\n\n"Ang pagmamahal sa kapwa ay isa sa pinakamataas na anyo ng pagmamahal. Ito ay hindi lamang nangangahulugang pagbibigay ng tulong sa panahon ng pangangailangan. Kabilang din dito ang pakikinig, pag-unawa, at pagtanggap sa isa't isa. _______"`,
    choices: [
      { id: 'a', text: 'Ang pagmamahal sa kapwa ay nagsisimula sa sarili.' },
      { id: 'b', text: 'Ang pagmamahal sa kapwa ay mahalaga para sa lahat.' },
      { id: 'c', text: 'Tunay na ang pag-ibig sa kapwa ay salamin ng isang dalisay at maunlad na lipunan.' },
      { id: 'd', text: 'Kaya naman, maraming tao ang nahihirapang magmahal sa iba.' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'C best concludes the paragraph by summarizing: love of neighbor reflects a pure and developed society.',
    explanation_fil: 'Ang opsyon C ay pinakaangkop na pangwakas na pangungusap — buod at kongklusyon ng talata tungkol sa pagmamahal sa kapwa.',
  },
  {
    stem: `Piliin ang wastong pagkakasunod-sunod ng mga pangungusap upang makabuo ng isang magkakaugnay na talata:\n\n1. Kaya naman, ang tamang nutrisyon ay napakahalaga sa pag-unlad ng bawat bata.\n2. Ang mga bata na may sapat na nutrisyon ay mas malusog at mas matutunan nang mabilis.\n3. Ang nutrisyon ay tumutukoy sa uri at dami ng pagkain na kinakain ng isang tao.\n4. Sa kabilang banda, ang mga batang may malnutrisyon ay nahihirapan sa pag-aaral at nanganganib sa kalusugan.`,
    choices: [
      { id: 'a', text: '3 – 2 – 4 – 1' },
      { id: 'b', text: '1 – 3 – 2 – 4' },
      { id: 'c', text: '2 – 4 – 3 – 1' },
      { id: 'd', text: '4 – 2 – 3 – 1' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Logical order: (3) define nutrition; (2) positive effects of proper nutrition; (4) negative effects of malnutrition; (1) conclusion.',
    explanation_fil: 'Lohikal na pagkakasunod: (3) tukuyin ang nutrisyon; (2) positibong epekto; (4) negatibong epekto; (1) kongklusyon.',
  },
  {
    stem: `Alin sa mga sumusunod ang pinaka-angkop na pangungusap na magdurugtong sa dalawang ideya?\n\nPangungusap 1: "Ang paaralan ay nagbibigay ng kaalaman at kasanayan sa mga mag-aaral."\nPangungusap 2: "Hindi lahat ng matututo sa buhay ay nagmumula sa loob ng silid-aralan."`,
    choices: [
      { id: 'a', text: 'Kaya naman, ang paaralan ay napakahalaga.' },
      { id: 'b', text: 'Subalit, ang buhay mismo ay isa ring malaking paaralan.' },
      { id: 'c', text: 'Sa dahilang ito, maraming mag-aaral ang hindi na pumapasok.' },
      { id: 'd', text: 'At dahil dito, kailangan ng mas maraming paaralan.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Subalit" introduces a contrast — school teaches, but life is also a teacher. This bridges both ideas logically.',
    explanation_fil: 'Ang "Subalit, ang buhay mismo ay isa ring malaking paaralan" ay pinakamainam na tulay sa pagitan ng dalawang ideya.',
  },
  {
    stem: `Piliin ang pangungusap na pinakaangkop bilang topic sentence ng talata tungkol sa kalikasan:\n\n"_______ Ang kagubatan ay nagbibigay ng sariwang hangin na kailangan natin para mabuhay. Ang mga ilog at dagat ay tahanan ng libu-libong uri ng hayop at halaman. Ang mga bundok at lambak ay nagbibigay ng magandang tanawin na nagpapaginhawa ng ating isip."`,
    choices: [
      { id: 'a', text: 'Ang kalikasan ay napakaraming problema sa ngayon.' },
      { id: 'b', text: 'Ang kalikasan ay nagbibigay ng maraming benepisyo sa tao.' },
      { id: 'c', text: 'Mahirap na mapangalagaan ang kalikasan sa modernong panahon.' },
      { id: 'd', text: 'Ang mga tao ay hindi nagmamalasakit sa kalikasan.' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Ang kalikasan ay nagbibigay ng maraming benepisyo sa tao" is the best topic sentence, as the paragraph lists the benefits nature provides.',
    explanation_fil: 'Ang "Ang kalikasan ay nagbibigay ng maraming benepisyo sa tao" ay pinakaangkop na topic sentence dahil ilinilist ng talata ang mga benepisyo ng kalikasan.',
  },
  {
    stem: `Piliin ang wastong pagkakasunod-sunod ng mga pangungusap upang makabuo ng isang maayos na talata:\n\n1. Bukod dito, nagtuturo rin ito ng tiwala sa sarili at disiplina.\n2. Ang palakasan ay hindi lamang nagpapabuti ng kalusugan ng katawan.\n3. Sa kabuuan, ang regular na palakasan ay mahalaga para sa kabuuang kagalingan ng tao.\n4. Nakakatulong din ito sa pagpapababa ng antas ng stress at pagpapabuti ng pag-iisip.`,
    choices: [
      { id: 'a', text: '3 – 1 – 4 – 2' },
      { id: 'b', text: '1 – 4 – 2 – 3' },
      { id: 'c', text: '2 – 1 – 4 – 3' },
      { id: 'd', text: '4 – 2 – 1 – 3' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Logical order: (2) introduce exercise beyond physical benefits; (1) it also teaches self-confidence and discipline; (4) reduces stress and improves thinking; (3) conclusion.',
    explanation_fil: 'Lohikal na pagkakasunod: (2) ipakilala ang palakasan; (1) nagtuturo ng tiwala at disiplina; (4) nagpapababa ng stress; (3) kongklusyon.',
  },
  {
    stem: `Alin sa mga sumusunod ang hindi angkop na kasama sa talata tungkol sa kahalagahan ng pagpapamilya?\n\n"Ang pamilya ay pundasyon ng lipunan. _______ Ang pagmamahal at suporta ng pamilya ay nagbibigay ng lakas at inspirasyon sa bawat miyembro nito."`,
    choices: [
      { id: 'a', text: 'Ito ang unang institusyon na natutunao ng bata.' },
      { id: 'b', text: 'Sa loob ng pamilya, natututo ang bata ng mga pagpapahalaga.' },
      { id: 'c', text: 'Ang negosyo ay mas mahalaga kaysa sa pamilya.' },
      { id: 'd', text: 'Ang pamilya ang nagbibigay ng katatagan at direksyon sa buhay ng bawat miyembro.' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Ang negosyo ay mas mahalaga kaysa sa pamilya" is inconsistent with the paragraph\'s theme of the importance of family.',
    explanation_fil: 'Ang opsyon C ay sumasalungat sa paksang talata — hindi angkop na sabihing mas mahalaga ang negosyo kaysa pamilya sa isang talata tungkol sa kahalagahan ng pamilya.',
  },
  {
    stem: `Piliin ang pinaka-angkop na pangwakas na pangungusap sa talata:\n\n"Ang pagiging responsable ay isa sa pinakamahalagang katangian na dapat taglayin ng bawat Pilipino. Ang isang responsableng mamamayan ay sumusunod sa batas, nagbabayad ng buwis, at aktibong lumalahok sa mga gawain ng komunidad. Tinutupad niya ang kanyang mga tungkulin nang walang pag-aalangan. _______"`,
    choices: [
      { id: 'a', text: 'Sa madaling salita, ang pagiging responsable ay nagpapalakas ng bansa.' },
      { id: 'b', text: 'Kaya naman, maraming Pilipino ang hindi pa responsable.' },
      { id: 'c', text: 'Ang pagiging responsable ay napakahirap na gawin.' },
      { id: 'd', text: 'Samakatuwid, ang bawat Pilipino ay dapat mag-abroad.' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: '"Sa madaling salita, ang pagiging responsable ay nagpapalakas ng bansa" is the best concluding sentence — it summarizes and reinforces the main idea.',
    explanation_fil: 'Ang opsyon A ay pinakaangkop na pangwakas — buod ng pangunahing ideya ng talata at nagbibigay ng matibay na kongklusyon.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Pagtatalata (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Pagtatalata',
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
    source_note: 'CSE 2026 Reviewer — Filipino Pagtatalata',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro paragraph-org-fil: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub paragraph-org-fil: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
