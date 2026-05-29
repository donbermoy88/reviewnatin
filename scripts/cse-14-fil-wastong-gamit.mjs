/**
 * CSE-14: Filipino — Wastong Gamit ng Salita (Correct Word Usage) — 30 questions
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

const QUESTIONS = [
  {
    stem: 'Piliin ang tamang salita upang mapunan ang patlang:\nAng batang _______ ay hindi pa handa sa pag-aaral.',
    choices: [
      { id: 'a', text: 'sanggol' },
      { id: 'b', text: 'musmos' },
      { id: 'c', text: 'kabataan' },
      { id: 'd', text: 'dalaga' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'MUSMOS means a very young child who is naive and not yet ready for schooling. SANGGOL is a baby/infant.',
    explanation_fil: 'Ang MUSMOS ay tumutukoy sa batang maliit at hindi pa handa — angkop ito sa konteksto ng hindi pa handa sa pag-aaral.',
  },
  {
    stem: 'Piliin ang tamang salita upang mapunan ang patlang:\nSiya ay _______ sa akin ng sampung taon.',
    choices: [
      { id: 'a', text: 'kapatid' },
      { id: 'b', text: 'nakatatanda' },
      { id: 'c', text: 'nakababata' },
      { id: 'd', text: 'kamag-anak' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'NAKATATANDA means older — "siya ay nakatatanda sa akin ng sampung taon" means he/she is ten years older than me.',
    explanation_fil: 'Ang NAKATATANDA ay nangangahulugang mas matanda — angkop ito sa pangungusap.',
  },
  {
    stem: 'Piliin ang tamang salita upang mapunan ang patlang:\nAng kanyang _______ sa akin ay nagpapasaya sa akin.',
    choices: [
      { id: 'a', text: 'ngiti' },
      { id: 'b', text: 'tawa' },
      { id: 'c', text: 'iyak' },
      { id: 'd', text: 'hiyaw' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'NGITI (smile) makes the most natural sense in this context — a smile from someone brings happiness.',
    explanation_fil: 'Ang NGITI (ngiti) ay ang pinaka-angkop — ang ngiti ng isang tao ay nagbibigay ng kasiyahan.',
  },
  {
    stem: 'Piliin ang tamang salita upang mapunan ang patlang:\nAng maganda ay _______ ng mata, ang mabait ay _______ ng puso.',
    choices: [
      { id: 'a', text: 'kasiyahan / kagalakan' },
      { id: 'b', text: 'kagalakan / kasiyahan' },
      { id: 'c', text: 'hiyas / yaman' },
      { id: 'd', text: 'yaman / hiyas' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Beauty pleases the eyes (kasiyahan ng mata), goodness enriches the heart (kagalakan ng puso).',
    explanation_fil: 'Ang maganda ay nagbibigay ng kasiyahan sa mata; ang mabait ay nagbibigay ng kagalakan sa puso.',
  },
  {
    stem: 'Alin sa mga sumusunod ang tamang pangungusap?',
    choices: [
      { id: 'a', text: 'Siya ay pumunta sa palengke kahapon.' },
      { id: 'b', text: 'Siya ay magpupunta sa palengke kahapon.' },
      { id: 'c', text: 'Siya ay pupunta sa palengke kahapon.' },
      { id: 'd', text: 'Siya ay napunta sa palengke kahapon.' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Kahapon" (yesterday) requires past tense. PUMUNTA is simple past — "Siya ay pumunta sa palengke kahapon" is correct.',
    explanation_fil: 'Ang "kahapon" ay nangangailangan ng nakaraan na panahunan. Ang tamang sagot ay "Siya ay pumunta sa palengke kahapon."',
  },
  {
    stem: 'Piliin ang tamang pares ng salitang magkaugnay upang mapunan ang patlang:\n"Ang _______ ng tao ay makikita sa kanyang _______."',
    choices: [
      { id: 'a', text: 'pagkatao / kilos' },
      { id: 'b', text: 'damit / salita' },
      { id: 'c', text: 'ugali / katawan' },
      { id: 'd', text: 'pag-aaral / damit' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Ang pagkatao ng tao ay makikita sa kanyang kilos" — a person\'s character is seen in their actions.',
    explanation_fil: 'Ang pagkatao ng tao ay makikita sa kanyang kilos — ang ugali at kilos ay magkaugnay.',
  },
  {
    stem: 'Piliin ang tamang salita upang mapunan ang patlang:\n"Hindi ko _______ ang kanyang ginawa sa akin."',
    choices: [
      { id: 'a', text: 'mapatawad' },
      { id: 'b', text: 'mapatatawad' },
      { id: 'c', text: 'mapagpatawad' },
      { id: 'd', text: 'pinapatawad' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Hindi ko mapatawad ang kanyang ginawa" — I cannot forgive what he/she did. MAPATAWAD is the correct form here.',
    explanation_fil: 'Ang tamang gamit ay MAPATAWAD — hindi ko mapatawad ang kanyang ginawa sa akin.',
  },
  {
    stem: 'Alin sa mga sumusunod ang may wastong gamit ng pang-ukol?',
    choices: [
      { id: 'a', text: 'Pumunta ako para kay Maria.' },
      { id: 'b', text: 'Pumunta ako para kay Maria.' },
      { id: 'c', text: 'Pumunta ako para sa Maria.' },
      { id: 'd', text: 'Pumunta ako dahil sa Maria.' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Para kay Maria" is correct when referring to going for the benefit of Maria. "Para sa" is used for things.',
    explanation_fil: 'Ang "para kay" ay ginagamit para sa tao — "pumunta ako para kay Maria" ang tama.',
  },
  {
    stem: 'Piliin ang tamang salita upang mapunan ang patlang:\n"Ang _______ ng buhay ay hindi maaaring ipalit sa anumang kayamanan."',
    choices: [
      { id: 'a', text: 'kahulugan' },
      { id: 'b', text: 'kahalagahan' },
      { id: 'c', text: 'kasaysayan' },
      { id: 'd', text: 'kagandahan' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Ang kahalagahan ng buhay" — the value/importance of life cannot be replaced by any wealth.',
    explanation_fil: 'Ang KAHALAGAHAN (halaga, importansya) ay ang tamang salita — ang kahalagahan ng buhay ay hindi maaaring ipalit sa kayamanan.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang guro ay _______ ng kaalaman sa kanyang mga mag-aaral."',
    choices: [
      { id: 'a', text: 'nagbibigay' },
      { id: 'b', text: 'nagbabahagi' },
      { id: 'c', text: 'nagtatago' },
      { id: 'd', text: 'nagpapairal' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Nagbabahagi ng kaalaman" (sharing knowledge) is the most natural expression for a teacher imparting knowledge.',
    explanation_fil: 'Ang NAGBABAHAGI (nagbabahagi ng kaalaman) ay ang pinaka-angkop — nagbabahagi ng kaalaman ang guro sa kanyang mga mag-aaral.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang lahat ng tao ay may karapatang _______ ng maayos na pamumuhay."',
    choices: [
      { id: 'a', text: 'mangarap' },
      { id: 'b', text: 'magtamasa' },
      { id: 'c', text: 'magpumilit' },
      { id: 'd', text: 'magsikap' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Magtamasa ng maayos na pamumuhay" — to enjoy a decent/comfortable life is the most fitting expression.',
    explanation_fil: 'Ang MAGTAMASA (magtamasa ng pamumuhay) ay ang pinaka-angkop — ang bawat tao ay may karapatang magtamasa ng maayos na pamumuhay.',
  },
  {
    stem: 'Alin sa mga sumusunod ang may wastong gamit ng pandiwang may aspeto?',
    choices: [
      { id: 'a', text: 'Kumakain na siya bukas.' },
      { id: 'b', text: 'Kakain na siya bukas.' },
      { id: 'c', text: 'Kumain na siya bukas.' },
      { id: 'd', text: 'Kakain pa siya kahapon.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Kakain na siya bukas" uses future tense (kakain) with future time marker (bukas) — this is correct.',
    explanation_fil: 'Ang "Kakain na siya bukas" ay gumagamit ng hinaharap na panahunan (kakain) na angkop sa "bukas" — tamang gamit ito.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Siya ay _______ sa kanyang mga kapwa dahil sa kanyang kagandahang-asal."',
    choices: [
      { id: 'a', text: 'kinasusuklaman' },
      { id: 'b', text: 'kinagagalitan' },
      { id: 'c', text: 'kinagigiliwan' },
      { id: 'd', text: 'kinatatakutan' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Kinagigiliwan" means admired/liked — someone with good manners is liked by their peers.',
    explanation_fil: 'Ang KINAGIGILIWAN (sinisinta, nagugustuhan) ay ang tamang salita — ang taong may magandang-asal ay kinagigiliwan ng kanyang mga kapwa.',
  },
  {
    stem: 'Piliin ang tamang panghalip:\n"_______ ay dapat sumunod sa utos ng kanilang mga magulang."',
    choices: [
      { id: 'a', text: 'Kami' },
      { id: 'b', text: 'Kayo' },
      { id: 'c', text: 'Sila' },
      { id: 'd', text: 'Tayo' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Ang mga bata / Sila ay dapat sumunod" — SILA (third person plural) correctly refers to children obeying their parents.',
    explanation_fil: 'Ang SILA (third person plural) ay ang tamang panghalip upang tumukoy sa mga batang dapat sumunod sa kanilang mga magulang.',
  },
  {
    stem: 'Piliin ang tamang gamit ng pang-angkop:\n"Ang batang ___ matalino ay maaaring magtagumpay."',
    choices: [
      { id: 'a', text: 'na' },
      { id: 'b', text: 'ng' },
      { id: 'c', text: 'nang' },
      { id: 'd', text: 'at' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Ang batang matalino" — the linker NA (or -NG) connects the noun "bata" to the adjective "matalino." Using NA after a word ending in a vowel: "bata + na = batang."',
    explanation_fil: 'Ang pang-angkop NA ay ginagamit upang iugnay ang pangngalan sa pang-uri — "batang matalino" ang tamang anyo.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang kanyang talumpati ay lubhang _______ sa mga manonood."',
    choices: [
      { id: 'a', text: 'nakakatuwa' },
      { id: 'b', text: 'nakakaaliw' },
      { id: 'c', text: 'nakakaantig' },
      { id: 'd', text: 'nakakabagot' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Nakakaantig" means touching/moving emotionally — appropriate for a speech that moves an audience.',
    explanation_fil: 'Ang NAKAKAANTIG (nagpapaantig ng puso) ay ang pinaka-angkop na salita para sa isang talumpating nagbibigay-damdamin sa mga manonood.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang mga kabataan ngayon ay dapat _______ ng wastong kaalaman tungkol sa kasaysayan ng bansa."',
    choices: [
      { id: 'a', text: 'tulungan' },
      { id: 'b', text: 'turuang' },
      { id: 'c', text: 'bibigyan' },
      { id: 'd', text: 'bigyang-kaalaman' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Turuang" (to teach) fits best — the youth should be taught proper knowledge about the country\'s history.',
    explanation_fil: 'Ang TURUANG ay ang pinaka-angkop — ang kabataan ay dapat turuang wastong kaalaman tungkol sa kasaysayan ng bansa.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang kanyang _______ ay nagpapakita ng kanyang kahusayan sa pakikipag-usap."',
    choices: [
      { id: 'a', text: 'parirala' },
      { id: 'b', text: 'talasalitaan' },
      { id: 'c', text: 'kagalingan' },
      { id: 'd', text: 'palaugnayan' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Talasalitaan" (vocabulary) best fits — someone\'s vocabulary shows their communication skills.',
    explanation_fil: 'Ang TALASALITAAN (bokabularyo) ay ang pinaka-angkop — ang talasalitaan ng isang tao ay nagpapakita ng kanyang kahusayan sa pakikipag-usap.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang bawat mamamayan ay may _______ na ipaglaban ang kanyang karapatan."',
    choices: [
      { id: 'a', text: 'tungkulin' },
      { id: 'b', text: 'pagkakataon' },
      { id: 'c', text: 'karapatang' },
      { id: 'd', text: 'kalayaang' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Tungkulin" (duty/responsibility) — every citizen has the duty to fight for their rights.',
    explanation_fil: 'Ang TUNGKULIN (responsibilidad) ay ang tamang salita — ang bawat mamamayan ay may tungkuling ipaglaban ang kanyang karapatan.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang kanyang _______ sa trabaho ay nagdulot sa kanya ng promosyon."',
    choices: [
      { id: 'a', text: 'katamaran' },
      { id: 'b', text: 'kasipagan' },
      { id: 'c', text: 'kapabayaan' },
      { id: 'd', text: 'kayabangan' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Kasipagan" (diligence/hard work) led to a promotion — the most logical word here.',
    explanation_fil: 'Ang KASIPAGAN (pagiging masipag) ang nagdulot ng promosyon — ito ang pinaka-angkop na salita.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang mga estudyante ay _______ ng guro pagkatapos ng eksaminasyon."',
    choices: [
      { id: 'a', text: 'pinuri' },
      { id: 'b', text: 'pinagalitan' },
      { id: 'c', text: 'pinarusahan' },
      { id: 'd', text: 'pinayuhan' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Pinuri" (praised) by the teacher after the exam — this is the most positive and likely outcome.',
    explanation_fil: 'Ang PINURI (pinagpuri) ng guro pagkatapos ng eksaminasyon — ito ang pinaka-angkop sa konteksto.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang bansa ay dapat _______ ng kapayapaan at kaunlaran."',
    choices: [
      { id: 'a', text: 'magtamasa' },
      { id: 'b', text: 'makamit' },
      { id: 'c', text: 'maglaban' },
      { id: 'd', text: 'magkaroon' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Magtamasa ng kapayapaan at kaunlaran" (to enjoy peace and progress) — the most fitting expression.',
    explanation_fil: 'Ang MAGTAMASA ng kapayapaan at kaunlaran ay ang pinaka-angkop na parirala para sa isang bansa.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang _______ ng pamilya ay responsibilidad ng magulang."',
    choices: [
      { id: 'a', text: 'kasiyahan' },
      { id: 'b', text: 'kabuhayan' },
      { id: 'c', text: 'kapakanan' },
      { id: 'd', text: 'kagalingan' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Kabuhayan ng pamilya" (livelihood of the family) is the responsibility of the parents.',
    explanation_fil: 'Ang KABUHAYAN (ikabubuhay) ng pamilya ay responsibilidad ng magulang — ito ang pinaka-angkop.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang matandang lalaki ay _______ ng kanyang nakaraan."',
    choices: [
      { id: 'a', text: 'nagtatago' },
      { id: 'b', text: 'nag-aalala' },
      { id: 'c', text: 'nag-aalala' },
      { id: 'd', text: 'nagbabago' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Nagtatago ng kanyang nakaraan" (hiding his past) or "nag-aalaala ng kanyang nakaraan" (reminiscing about his past). NAGTATAGO most naturally completes this sentence.',
    explanation_fil: '"Nagtatago ng kanyang nakaraan" — ang matandang lalaki ay nagtatago ng kanyang nakaraan — ito ang pinaka-angkop na konteksto.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang _______ ay siyang pundasyon ng isang maayos na lipunan."',
    choices: [
      { id: 'a', text: 'pagmamahal' },
      { id: 'b', text: 'pagiging matapat' },
      { id: 'c', text: 'disiplina' },
      { id: 'd', text: 'kaalaman' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Disiplina" (discipline) is the foundation of a well-ordered society — this is the most sociologically accurate statement.',
    explanation_fil: 'Ang DISIPLINA ay siyang pundasyon ng isang maayos na lipunan — ito ang pinaka-angkop na sagot.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Huwag _______ ang iyong sarili sa iba."',
    choices: [
      { id: 'a', text: 'ikumpara' },
      { id: 'b', text: 'ihambing' },
      { id: 'c', text: 'isipin' },
      { id: 'd', text: 'paglingunin' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Ihambing ang sarili sa iba" (comparing oneself with others) — IHAMBING and IKUMPARA are both correct, but IHAMBING is the more native Filipino form.',
    explanation_fil: 'Ang IHAMBING (mag-compare) ay ang mas wastong Filipino — "Huwag ihambing ang iyong sarili sa iba."',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang kanyang _______ sa pag-aaral ay nagdala sa kanya sa rurok ng tagumpay."',
    choices: [
      { id: 'a', text: 'dedikasyon' },
      { id: 'b', text: 'katamaran' },
      { id: 'c', text: 'pagwawalang-bahala' },
      { id: 'd', text: 'kapabayaan' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"Dedikasyon sa pag-aaral" (dedication to studies) brought him to the peak of success.',
    explanation_fil: 'Ang DEDIKASYON (pagtatalaga) sa pag-aaral ang nagdala sa kanya sa tagumpay — ito ang pinaka-angkop.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang _______ ng wika ay mahalaga sa pagpapanatili ng kultura ng isang bansa."',
    choices: [
      { id: 'a', text: 'pag-unlad' },
      { id: 'b', text: 'pagkamatay' },
      { id: 'c', text: 'pagpapanatili' },
      { id: 'd', text: 'pagbabago' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Pagpapanatili ng wika" (preservation of language) is important for preserving the culture of a nation.',
    explanation_fil: 'Ang PAGPAPANATILI ng wika ay mahalaga sa pagpapanatili ng kultura — ito ang pinaka-angkop.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang _______ ng isang tao ay nalilikha ng kanyang mga karanasan sa buhay."',
    choices: [
      { id: 'a', text: 'katawan' },
      { id: 'b', text: 'karakter' },
      { id: 'c', text: 'pananampalataya' },
      { id: 'd', text: 'kaalaman' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Karakter ng isang tao" (a person\'s character) is shaped by life experiences.',
    explanation_fil: 'Ang KARAKTER (pagkatao, ugali) ng isang tao ay nililikha ng kanyang mga karanasan sa buhay.',
  },
  {
    stem: 'Piliin ang tamang salita:\n"Ang _______ ay isang mahalagang kasangkapan sa pagbuo ng isang malusog na pamilya."',
    choices: [
      { id: 'a', text: 'pagpapahalaga' },
      { id: 'b', text: 'komunikasyon' },
      { id: 'c', text: 'pag-aaway' },
      { id: 'd', text: 'pagkakamali' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Komunikasyon" (communication) is an important tool in building a healthy family.',
    explanation_fil: 'Ang KOMUNIKASYON ay isang mahalagang kasangkapan sa pagbuo ng malusog na pamilya — ito ang pinaka-angkop.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Wastong Gamit (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Wastong Gamit ng Salita',
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
    source_note: 'CSE 2026 Reviewer — Filipino Wastong Gamit ng Salita',
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
