/**
 * CSE-12: Filipino — Kasalungat (Antonyms) — 25 questions
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
    stem: 'Piliin ang salitang KASALUNGAT ng MATAPANG.',
    choices: [
      { id: 'a', text: 'marahas' },
      { id: 'b', text: 'duwag' },
      { id: 'c', text: 'mabilis' },
      { id: 'd', text: 'maliksi' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'MATAPANG (brave) — its antonym is DUWAG (cowardly).',
    explanation_fil: 'Ang MATAPANG (matapang na tao) — ang kabaligtaran nito ay DUWAG (walang tapang).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MASIPAG.',
    choices: [
      { id: 'a', text: 'matiyaga' },
      { id: 'b', text: 'masikhay' },
      { id: 'c', text: 'tamad' },
      { id: 'd', text: 'mapagmahal' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'MASIPAG (diligent/hardworking) — its antonym is TAMAD (lazy).',
    explanation_fil: 'Ang MASIPAG (nagtatrabaho nang husto) — ang kabaligtaran nito ay TAMAD (hindi gustong magtrabaho).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAGAAN.',
    choices: [
      { id: 'a', text: 'mabigat' },
      { id: 'b', text: 'maliit' },
      { id: 'c', text: 'maingay' },
      { id: 'd', text: 'maluwag' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MAGAAN (light in weight) — its antonym is MABIGAT (heavy).',
    explanation_fil: 'Ang MAGAAN (hindi mabigat) — ang kabaligtaran nito ay MABIGAT (may malaking bigat).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAPAGBIGAY.',
    choices: [
      { id: 'a', text: 'maramot' },
      { id: 'b', text: 'masayahin' },
      { id: 'c', text: 'matulungin' },
      { id: 'd', text: 'mapagmahal' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MAPAGBIGAY (generous) — its antonym is MARAMOT (stingy/selfish).',
    explanation_fil: 'Ang MAPAGBIGAY (bukas-palad) — ang kabaligtaran nito ay MARAMOT (kuripot).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MATAAS.',
    choices: [
      { id: 'a', text: 'mababa' },
      { id: 'b', text: 'malakas' },
      { id: 'c', text: 'mahirap' },
      { id: 'd', text: 'malayo' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MATAAS (tall/high) — its antonym is MABABA (short/low).',
    explanation_fil: 'Ang MATAAS (malaking taas) — ang kabaligtaran nito ay MABABA (maliit ang taas).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MALIWANAG.',
    choices: [
      { id: 'a', text: 'madilim' },
      { id: 'b', text: 'mainit' },
      { id: 'c', text: 'malamig' },
      { id: 'd', text: 'malayo' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MALIWANAG (bright/clear) — its antonym is MADILIM (dark).',
    explanation_fil: 'Ang MALIWANAG (may liwanag) — ang kabaligtaran nito ay MADILIM (walang liwanag).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MABAIT.',
    choices: [
      { id: 'a', text: 'masaya' },
      { id: 'b', text: 'masamâ' },
      { id: 'c', text: 'matino' },
      { id: 'd', text: 'matalino' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'MABAIT (kind/good) — its antonym is MASAMÂ (bad/evil/unkind).',
    explanation_fil: 'Ang MABAIT (may mabuting ugali) — ang kabaligtaran nito ay MASAMÂ (may masamang ugali).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAINGAY.',
    choices: [
      { id: 'a', text: 'tahimik' },
      { id: 'b', text: 'malakas' },
      { id: 'c', text: 'malayo' },
      { id: 'd', text: 'masaya' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MAINGAY (noisy) — its antonym is TAHIMIK (quiet/silent).',
    explanation_fil: 'Ang MAINGAY (maraming ingay) — ang kabaligtaran nito ay TAHIMIK (walang ingay).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng TAGUMPAY.',
    choices: [
      { id: 'a', text: 'kaluguran' },
      { id: 'b', text: 'kaligayahan' },
      { id: 'c', text: 'kapabayaan' },
      { id: 'd', text: 'kabiguan' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'TAGUMPAY (success) — its antonym is KABIGUAN (failure).',
    explanation_fil: 'Ang TAGUMPAY (matagumpay) — ang kabaligtaran nito ay KABIGUAN (pagkabigo).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAPAGKUMBABA.',
    choices: [
      { id: 'a', text: 'matulungin' },
      { id: 'b', text: 'mabuti' },
      { id: 'c', text: 'mabait' },
      { id: 'd', text: 'palalo' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'MAPAGKUMBABA (humble) — its antonym is PALALO (arrogant/boastful).',
    explanation_fil: 'Ang MAPAGKUMBABA (may pagpapakumbaba) — ang kabaligtaran nito ay PALALO (hambog).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MALINIS.',
    choices: [
      { id: 'a', text: 'mayumi' },
      { id: 'b', text: 'marumi' },
      { id: 'c', text: 'maingat' },
      { id: 'd', text: 'maliwanag' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'MALINIS (clean) — its antonym is MARUMI (dirty).',
    explanation_fil: 'Ang MALINIS (walang dumi) — ang kabaligtaran nito ay MARUMI (may dumi).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MABILIS.',
    choices: [
      { id: 'a', text: 'mahina' },
      { id: 'b', text: 'mabigat' },
      { id: 'c', text: 'mabagal' },
      { id: 'd', text: 'matipuno' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'MABILIS (fast/quick) — its antonym is MABAGAL (slow).',
    explanation_fil: 'Ang MABILIS (may bilis) — ang kabaligtaran nito ay MABAGAL (walang bilis).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MASAYA.',
    choices: [
      { id: 'a', text: 'malungkot' },
      { id: 'b', text: 'mainit' },
      { id: 'c', text: 'maingat' },
      { id: 'd', text: 'maliwanag' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MASAYA (happy/joyful) — its antonym is MALUNGKOT (sad).',
    explanation_fil: 'Ang MASAYA (may saya) — ang kabaligtaran nito ay MALUNGKOT (may kalungkutan).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MATANDA.',
    choices: [
      { id: 'a', text: 'maliit' },
      { id: 'b', text: 'bata' },
      { id: 'c', text: 'kabataan' },
      { id: 'd', text: 'kabata' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MATANDA (old/elderly) — its antonym is BATA (young).',
    explanation_fil: 'Ang MATANDA (may gulang na) — ang kabaligtaran nito ay BATA (kabataan).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MALAKAS.',
    choices: [
      { id: 'a', text: 'mahina' },
      { id: 'b', text: 'mabagal' },
      { id: 'c', text: 'malambot' },
      { id: 'd', text: 'mababa' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MALAKAS (strong) — its antonym is MAHINA (weak).',
    explanation_fil: 'Ang MALAKAS (may lakas) — ang kabaligtaran nito ay MAHINA (walang lakas).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAHAL.',
    choices: [
      { id: 'a', text: 'mura' },
      { id: 'b', text: 'bihasa' },
      { id: 'c', text: 'bago' },
      { id: 'd', text: 'mababa' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'MAHAL (expensive) — its antonym is MURA (cheap).',
    explanation_fil: 'Ang MAHAL (malaking presyo) — ang kabaligtaran nito ay MURA (mababang presyo).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng PAGIBIG.',
    choices: [
      { id: 'a', text: 'kapootan' },
      { id: 'b', text: 'hiya' },
      { id: 'c', text: 'galit' },
      { id: 'd', text: 'lungkot' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'PAG-IBIG (love) — its antonym is KAPOOTAN (hatred).',
    explanation_fil: 'Ang PAG-IBIG — ang kabaligtaran nito ay KAPOOTAN (poot at galit).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAGALANG.',
    choices: [
      { id: 'a', text: 'bastos' },
      { id: 'b', text: 'matalino' },
      { id: 'c', text: 'maliksi' },
      { id: 'd', text: 'masaya' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MAGALANG (polite/respectful) — its antonym is BASTOS (rude/impolite).',
    explanation_fil: 'Ang MAGALANG (may galang) — ang kabaligtaran nito ay BASTOS (walang galang).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng KATOTOHANAN.',
    choices: [
      { id: 'a', text: 'kabutihan' },
      { id: 'b', text: 'kasinungalingan' },
      { id: 'c', text: 'kaalaman' },
      { id: 'd', text: 'kasabihan' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'KATOTOHANAN (truth) — its antonym is KASINUNGALINGAN (lie/falsehood).',
    explanation_fil: 'Ang KATOTOHANAN (totoo) — ang kabaligtaran nito ay KASINUNGALINGAN (hindi totoo).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MAPAYAPA.',
    choices: [
      { id: 'a', text: 'maingay' },
      { id: 'b', text: 'mainit' },
      { id: 'c', text: 'magulo' },
      { id: 'd', text: 'masaya' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'MAPAYAPA (peaceful) — its antonym is MAGULO (chaotic/unruly).',
    explanation_fil: 'Ang MAPAYAPA (may kapayapaan) — ang kabaligtaran nito ay MAGULO (walang kapayapaan).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng KARUNUNGAN.',
    choices: [
      { id: 'a', text: 'kamangmangan' },
      { id: 'b', text: 'kaalaman' },
      { id: 'c', text: 'kasipagan' },
      { id: 'd', text: 'katalasan' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'KARUNUNGAN (wisdom/knowledge) — its antonym is KAMANGMANGAN (ignorance).',
    explanation_fil: 'Ang KARUNUNGAN (dunong) — ang kabaligtaran nito ay KAMANGMANGAN (kawalan ng kaalaman).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng MARAMI.',
    choices: [
      { id: 'a', text: 'kaunti' },
      { id: 'b', text: 'wala' },
      { id: 'c', text: 'kakulangan' },
      { id: 'd', text: 'bawas' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MARAMI (many/much) — its antonym is KAUNTI (few/little).',
    explanation_fil: 'Ang MARAMI (napakarami) — ang kabaligtaran nito ay KAUNTI (iilan lamang).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng KATAMARAN.',
    choices: [
      { id: 'a', text: 'kasiyahan' },
      { id: 'b', text: 'kasipagan' },
      { id: 'c', text: 'kasamaan' },
      { id: 'd', text: 'katapatan' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'KATAMARAN (laziness) — its antonym is KASIPAGAN (diligence/hard work).',
    explanation_fil: 'Ang KATAMARAN (pagiging tamad) — ang kabaligtaran nito ay KASIPAGAN (pagiging masipag).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng KAMAY.',
    choices: [
      { id: 'a', text: 'paa' },
      { id: 'b', text: 'ulo' },
      { id: 'c', text: 'katawan' },
      { id: 'd', text: 'leeg' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'KAMAY (hand — upper extremity) — its opposite body part is PAA (foot — lower extremity).',
    explanation_fil: 'Ang KAMAY (nasa itaas) — ang kabaligtaran nitong bahagi ng katawan ay PAA (nasa ibaba).',
  },
  {
    stem: 'Piliin ang salitang KASALUNGAT ng KALAYAAN.',
    choices: [
      { id: 'a', text: 'kagalakan' },
      { id: 'b', text: 'kapangyarihan' },
      { id: 'c', text: 'pagkaalipin' },
      { id: 'd', text: 'kaligtasan' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'KALAYAAN (freedom) — its antonym is PAGKAALIPIN (slavery/bondage).',
    explanation_fil: 'Ang KALAYAAN (pagiging malaya) — ang kabaligtaran nito ay PAGKAALIPIN (pagiging alipin).',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Kasalungat (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Kasalungat',
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
    source_note: 'CSE 2026 Reviewer — Filipino Kasalungat',
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
