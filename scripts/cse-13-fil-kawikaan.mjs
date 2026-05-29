/**
 * CSE-13: Filipino — Kawikaan / Salawikain (Proverbs & Idioms) — 25 questions
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

const TOPIC_PRO = 'c2808ba1-5ba9-449c-afbf-a4dbd1d248dd';
const TOPIC_SUB = 'e4856eb1-2eaf-45e7-92b3-85953623a847';

const QUESTIONS = [
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Ang hindi marunong lumingon sa pinanggalingan ay hindi makararating sa paroroonan"?',
    choices: [
      { id: 'a', text: 'Ang taong hindi nagpapasalamat sa kanyang nakaraan ay maaaring hindi matagumpay sa kinabukasan.' },
      { id: 'b', text: 'Ang pagtanaw sa nakaraan ay nakakatulong sa pagiging matagumpay.' },
      { id: 'c', text: 'Dapat palaging huwag kalimutan ang iyong pinagmulan.' },
      { id: 'd', text: 'Ang taong walang malasakit sa nakaraan ay may maliwanag na kinabukasan.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'This proverb means: one who does not look back at where they came from will not reach their destination — you must acknowledge your roots and past to move forward successfully.',
    explanation_fil: 'Ang kawikaan na ito ay nangangahulugang kailangang kilalanin ang iyong pinagmulan upang makamit ang tagumpay sa hinaharap.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Kung sino ang may sala, siya ang galit"?',
    choices: [
      { id: 'a', text: 'Ang taong may kasalanan ay lagi ring nagagalit.' },
      { id: 'b', text: 'Ang taong may kasalanan ay nagtatangkang itago ito sa pamamagitan ng pagpapakita ng galit.' },
      { id: 'c', text: 'Ang galit ay nagpapahiwatig ng kasalanan.' },
      { id: 'd', text: 'Dapat tayong magalit kapag may nagkamali.' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'This proverb means the guilty one is the one who gets angry — a sign of guilt is defensiveness and anger.',
    explanation_fil: 'Ang kawikaan na ito ay nagpapahiwatig na ang may kasalanan ay nagpapakita ng galit upang itago ang katotohanan.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Ang magandang asal ay kayamanan ng mahirap"?',
    choices: [
      { id: 'a', text: 'Ang mga mahihirap ay mayaman sa asal.' },
      { id: 'b', text: 'Ang mabuting ugali ay isang haligi ng tagumpay.' },
      { id: 'c', text: 'Ang mabuting asal ay mas mahalaga kaysa kayamanan, lalo na para sa mahirap.' },
      { id: 'd', text: 'Ang kahirapan ay nagdudulot ng mabuting ugali.' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Good manners are the wealth of the poor — even without material wealth, good character is a treasure that anyone can have.',
    explanation_fil: 'Ang mabuting asal ay kayamanan ng mahirap — kahit walang pera, ang mabuting ugali ay kayamanan para sa lahat.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Aanhin pa ang damo kung patay na ang kabayo"?',
    choices: [
      { id: 'a', text: 'Walang silbi ang anumang bagay kapag huli na ang lahat.' },
      { id: 'b', text: 'Ang kabayo ay kailangan ng damo upang mabuhay.' },
      { id: 'c', text: 'Dapat na ihanda ang lahat ng kailangan bago pa man ito kailangan.' },
      { id: 'd', text: 'Ang pagkaantala ay nagdudulot ng pagkabigo.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'What use is the grass when the horse is already dead? — It is useless to offer help or remedy when it is already too late.',
    explanation_fil: 'Walang silbi ang anumang tulong o lunas kapag huli na ang lahat — kailangang kumilos agad bago pa mahuli ang lahat.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "may tinik sa dibdib"?',
    choices: [
      { id: 'a', text: 'may sakit sa puso' },
      { id: 'b', text: 'may lihim na naghihirap sa puso' },
      { id: 'c', text: 'may gulat' },
      { id: 'd', text: 'may pag-aalala sa puso' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"May tinik sa dibdib" means having a worry or concern weighing heavily on the heart/chest.',
    explanation_fil: 'Ang "may tinik sa dibdib" ay nangangahulugang may mabigat na alalahanin o bagabag sa puso.',
  },
  {
    stem: 'Ano ang kahulugan ng salawikain: "Sa mahal ng buhay, iligtas ang sarili"?',
    choices: [
      { id: 'a', text: 'Ang buhay ay mahal kaysa anumang bagay.' },
      { id: 'b', text: 'Sa panahon ng kagipitan, ang pag-iingat sa sarili ang pinakamahalagang bagay.' },
      { id: 'c', text: 'Ang pagpapahalaga sa buhay ay dapat na nauuna.' },
      { id: 'd', text: 'Dapat iligtas ang isa\'t isa sa panahon ng kagipitan.' },
    ],
    correct: 'a',
    difficulty: 3,
    explanation_en: 'This means: when life is precious/at stake, save yourself — self-preservation in times of danger.',
    explanation_fil: 'Ang salawikain na ito ay nangangahulugang sa panahon ng panganib, ang pagliligtas sa sarili ang pangunahing dapat gawin.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "nanghihina ang tuhod"?',
    choices: [
      { id: 'a', text: 'nasugatan ang tuhod' },
      { id: 'b', text: 'sobrang nagtrabaho' },
      { id: 'c', text: 'takot at kinakabahan' },
      { id: 'd', text: 'gutom at pagod' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"Nanghihina ang tuhod" literally means knees are weakening, used idiomatically to mean feeling frightened or nervous.',
    explanation_fil: 'Ang "nanghihina ang tuhod" ay nangangahulugang pakiramdam na takot at kinakabahan.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Ang bata ay siyang ama ng tao"?',
    choices: [
      { id: 'a', text: 'Ang bata ay dapat sundin ang ama.' },
      { id: 'b', text: 'Ang batang mabuti ay magiging mabuting tao.' },
      { id: 'c', text: 'Ang karakter ng tao bilang bata ay humuhubog sa kanyang karakter bilang matanda.' },
      { id: 'd', text: 'Ang mga bata ay nagbibigay ng kinabukasan sa lipunan.' },
    ],
    correct: 'd',
    difficulty: 3,
    explanation_en: '"The child is the father of the man" — the character formed in childhood shapes the adult.',
    explanation_fil: 'Ang karakter na nabuo sa pagkabata ang humuhubog sa pagkatao ng isang tao bilang matanda.',
  },
  {
    stem: 'Ano ang kahulugan ng salawikain: "Kapag maikli ang kumot, matutong mamaluktot"?',
    choices: [
      { id: 'a', text: 'Kalimitan ay kulang ang kumot.' },
      { id: 'b', text: 'Kapag kulang ang lahat ng kailangan, kailangang matutong magtipid at umangkop.' },
      { id: 'c', text: 'Kailangan ng maayos na pagpaplanong pangkabuhayan.' },
      { id: 'd', text: 'Ang kakulangan ay nagdudulot ng kahirapan.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'If the blanket is short, learn to curl up — when resources are limited, one must adapt and make do.',
    explanation_fil: 'Kapag maikli ang kumot, matutong mamaluktot — kapag kulang ang lahat, kailangang umangkop at magtipid.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "mataas ang lipad"?',
    choices: [
      { id: 'a', text: 'nakakaaliw' },
      { id: 'b', text: 'ambisyoso at palalo' },
      { id: 'c', text: 'matalino at mabuti' },
      { id: 'd', text: 'maliksi at mabilis' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Mataas ang lipad" (high-flying) means someone ambitious, proud, or thinking very highly of themselves.',
    explanation_fil: 'Ang "mataas ang lipad" ay nangangahulugang ambisyoso o mapagmataas, para bang siya ay espesyal.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Ang walang pinag-aralan ay walang alam"?',
    choices: [
      { id: 'a', text: 'Ang edukasyon ay kailangan sa buhay.' },
      { id: 'b', text: 'Ang lahat ng kaalaman ay nakukuha sa paaralan.' },
      { id: 'c', text: 'Ang hindi nag-aral ay walang kinabukasan.' },
      { id: 'd', text: 'Ang pag-aaral ay ang tanging paraan upang maging marunong.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'This proverb emphasizes the importance of education as the foundation of knowledge and wisdom.',
    explanation_fil: 'Ang kawikain ay binibigyang-diin ang kahalagahan ng edukasyon bilang pundasyon ng kaalaman.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "mahabang dila"?',
    choices: [
      { id: 'a', text: 'mahilig kumain' },
      { id: 'b', text: 'tsismoso o tsismosa' },
      { id: 'c', text: 'matapang magsalita' },
      { id: 'd', text: 'palabiro at masaya' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Mahabang dila" means gossipy — a person who spreads gossip or talks too much about others.',
    explanation_fil: 'Ang "mahabang dila" ay nangangahulugang tsismoso/tsismosa — isang taong mahilig magsalita nang masama tungkol sa iba.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Sa isang kahig, isang tuka"?',
    choices: [
      { id: 'a', text: 'Dapat magtipid para sa hinaharap.' },
      { id: 'b', text: 'Ang manok ay nangangarap ng sapat na pagkain.' },
      { id: 'c', text: 'Ang isa ay kumikita lamang ng sapat para sa pang-araw-araw na pangangailangan.' },
      { id: 'd', text: 'Kailangang magtrabaho nang malakas.' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Sa isang kahig, isang tuka" (for every scratch, one peck) — earning just enough to get by day by day, living hand to mouth.',
    explanation_fil: 'Nangangahulugan na ang isa ay kumikita lamang ng sapat para sa araw na iyon, walang natitipid.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "walang habas"?',
    choices: [
      { id: 'a', text: 'walang tigil o hinto' },
      { id: 'b', text: 'walang sapat na kakayahan' },
      { id: 'c', text: 'walang pakialam' },
      { id: 'd', text: 'walang kapatid' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Walang habas" means without restraint or without stopping — relentless.',
    explanation_fil: 'Ang "walang habas" ay nangangahulugang walang tigil, walang hinto, tuluy-tuloy.',
  },
  {
    stem: 'Ano ang kahulugan ng salawikain: "Ang taong nagigipit, sa patalim man ay kakapit"?',
    choices: [
      { id: 'a', text: 'Ang taong desperado ay handa sa anumang panganib.' },
      { id: 'b', text: 'Kapag may patalim, magigipit ang tao.' },
      { id: 'c', text: 'Ang isa ay handang kumapit sa anumang bagay kapag desperado na.' },
      { id: 'd', text: 'Ang kahirapan ay nagdudulot ng karahasan.' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'A desperate man will even grasp a blade — when in dire need, a person will resort to any means available, even dangerous ones.',
    explanation_fil: 'Ang taong desperado ay kumakapit sa kahit anong bagay, kahit mapanganib, upang makaalpas sa kahirapan.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Huwag nang maghanap ng butas sa buwan"?',
    choices: [
      { id: 'a', text: 'Huwag mag-alinlangan sa pagkakataon.' },
      { id: 'b', text: 'Huwag mangarap ng imposible.' },
      { id: 'c', text: 'Huwag maghanap ng perpeksyon sa imperpektong mundo.' },
      { id: 'd', text: 'Huwag mag-isip nang sobra.' },
    ],
    correct: 'a',
    difficulty: 3,
    explanation_en: 'Do not look for holes in the moon — do not look for faults in something good or be overly critical of perfection.',
    explanation_fil: 'Ang kawikaan na ito ay nangangahulugang huwag maghanap ng depekto sa isang bagay na maganda o mabuti.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "nangagat sa pain"?',
    choices: [
      { id: 'a', text: 'napagkamalan' },
      { id: 'b', text: 'nalinlang' },
      { id: 'c', text: 'nabigo' },
      { id: 'd', text: 'napahiya' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Nangagat sa pain" means to be tricked or to take the bait — to be deceived or fooled.',
    explanation_fil: 'Ang "nangagat sa pain" ay nangangahulugang nalinlang o nauto — kumagat sa bitag ng iba.',
  },
  {
    stem: 'Ano ang kahulugan ng salawikain: "Ang puno ng mangga ay namumungang mangga"?',
    choices: [
      { id: 'a', text: 'Ang mga magulang ay may epekto sa kanilang mga anak.' },
      { id: 'b', text: 'Ang bawat bagay ay may naaangkop na bunga.' },
      { id: 'c', text: 'Ang mangga ay isang masustansiyang prutas.' },
      { id: 'd', text: 'Ang taong mabuti ay nagbubunga ng kabutihan.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'A mango tree bears mango fruit — like parents, like children; like cause, like effect.',
    explanation_fil: 'Ang puno ng mangga ay nagbubunga ng mangga — ang mga magulang ang nagbibigay ng kinabukasan at ugali sa kanilang mga anak.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Walang taong perpekto"?',
    choices: [
      { id: 'a', text: 'Lahat ay may kakulangan at kamalian.' },
      { id: 'b', text: 'Ang perpeksyon ay imposible.' },
      { id: 'c', text: 'Dapat tanggapin ang mga kamalian ng iba.' },
      { id: 'd', text: 'Ang taong may depekto ay hindi matagumpay.' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'No one is perfect — everyone has flaws and shortcomings, which should lead to understanding and forgiveness.',
    explanation_fil: 'Walang taong perpekto — lahat ay may kakulangan, kaya naman dapat tayong maging mapagpatawad at matulungin.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "bukas ang palad"?',
    choices: [
      { id: 'a', text: 'mahilig umutos' },
      { id: 'b', text: 'mapagbigay at bukas ang loob' },
      { id: 'c', text: 'walang itinatago' },
      { id: 'd', text: 'mahilig magtrabaho' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Bukas ang palad" (open palm) means generous and open-handed — willing to give freely.',
    explanation_fil: 'Ang "bukas ang palad" ay nangangahulugang mapagbigay at bukas ang loob — handang tumulong sa iba.',
  },
  {
    stem: 'Ano ang kahulugan ng salawikain: "Ang taong matiyaga ay tagumpay ang wakas"?',
    choices: [
      { id: 'a', text: 'Ang matiyagang tao ay magiging mayaman.' },
      { id: 'b', text: 'Ang patuloy na pagsisikap ay humahantong sa tagumpay.' },
      { id: 'c', text: 'Ang tagumpay ay para lamang sa matiisin.' },
      { id: 'd', text: 'Ang tiyaga at tagumpay ay magkasama.' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The patient person finds success in the end — perseverance leads to eventual success.',
    explanation_fil: 'Ang taong matiyaga ay makakamit ang tagumpay sa huli — ang patuloy na pagsisikap ay nagdadala ng tagumpay.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "lumang sombrero"?',
    choices: [
      { id: 'a', text: 'bagay na mahal' },
      { id: 'b', text: 'lumang estilo ng damit' },
      { id: 'c', text: 'isang bagay na lumuma na at walang saysay' },
      { id: 'd', text: 'matandang tao' },
    ],
    correct: 'd',
    difficulty: 3,
    explanation_en: '"Lumang sombrero" (old hat) means something outdated or no longer useful/interesting.',
    explanation_fil: 'Ang "lumang sombrero" ay nangangahulugang isang bagay na lumuma na, wala nang saysay o interes.',
  },
  {
    stem: 'Ano ang kahulugan ng kawikaan: "Huwag mag-apoy sa silong ng salan"?',
    choices: [
      { id: 'a', text: 'Huwag magluto sa bahay.' },
      { id: 'b', text: 'Huwag maglikha ng panganib sa loob ng tahanan.' },
      { id: 'c', text: 'Huwag sumubok ng anumang nakakapinsala.' },
      { id: 'd', text: 'Mag-ingat sa apoy.' },
    ],
    correct: 'c',
    difficulty: 3,
    explanation_en: 'Do not make fire under a bamboo floor — do not do dangerous things in a dangerous or sensitive place.',
    explanation_fil: 'Huwag gumawa ng mapanganib na bagay sa isang lugar o sitwasyong sensitibo — maaaring magdulot ng malaking pinsala.',
  },
  {
    stem: 'Ano ang kahulugan ng idyomang "mabuting loob"?',
    choices: [
      { id: 'a', text: 'masustansiyang katawan' },
      { id: 'b', text: 'nagmamalasakit at mapagbigay na puso' },
      { id: 'c', text: 'may tamang intensyon' },
      { id: 'd', text: 'matapang na kalooban' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Mabuting loob" means good heart/goodwill — kindness and generous spirit.',
    explanation_fil: 'Ang "mabuting loob" ay nangangahulugang mabuting puso, mapagbigay at nagmamalasakit sa kapwa.',
  },
  {
    stem: 'Ano ang kahulugan ng salawikain: "Nasa Diyos ang awa, nasa tao ang gawa"?',
    choices: [
      { id: 'a', text: 'Ang Diyos ang tagapagbigay ng lahat ng awa.' },
      { id: 'b', text: 'Ang Diyos ay maaawa sa mga nagtratrabaho.' },
      { id: 'c', text: 'Dapat ipag-dasal ang lahat ng nais sa buhay.' },
      { id: 'd', text: 'Ang biyaya ay mula sa Diyos ngunit ang pagsisikap ay responsibilidad ng tao.' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'Mercy is from God, but effort is from man — we must work hard while trusting that God will provide the grace.',
    explanation_fil: 'Ang awa ay mula sa Diyos ngunit ang pagsisikap at paggawa ay responsibilidad ng bawat tao.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Kawikaan/Salawikain (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Kawikaan at Salawikain',
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
    source_note: 'CSE 2026 Reviewer — Filipino Kawikaan at Salawikain',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro vocabulary-fil: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub vocabulary-fil: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
