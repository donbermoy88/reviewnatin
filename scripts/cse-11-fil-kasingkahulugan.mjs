/**
 * CSE-11: Filipino — Kasingkahulugan (Synonyms) — 25 questions
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
    stem: 'Piliin ang salitang kasingkahulugan ng MAPAGKAKATIWALAAN.',
    choices: [
      { id: 'a', text: 'maaasahan' },
      { id: 'b', text: 'mapagsamantala' },
      { id: 'c', text: 'malikhaín' },
      { id: 'd', text: 'matiyaga' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MAPAGKAKATIWALAAN means trustworthy or reliable — MAAASAHAN means someone you can rely on.',
    explanation_fil: 'Ang MAPAGKAKATIWALAAN ay nangangahulugang karapat-dapat pagkatiwalaan — ang MAAASAHAN ay may kaparehong kahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng PABAYA.',
    choices: [
      { id: 'a', text: 'maingat' },
      { id: 'b', text: 'tamad' },
      { id: 'c', text: 'walang-malasakit' },
      { id: 'd', text: 'masipag' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'PABAYA means negligent or careless — WALANG-MALASAKIT (indifferent) is the closest synonym.',
    explanation_fil: 'Ang PABAYA ay nangangahulugang kapabayaan o kawalang-ingat — ang WALANG-MALASAKIT ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAPANGHUSGA.',
    choices: [
      { id: 'a', text: 'mapagpatawad' },
      { id: 'b', text: 'mapanuri' },
      { id: 'c', text: 'mabuti' },
      { id: 'd', text: 'matulungin' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'MAPANGHUSGA means judgmental or critical — MAPANURI (analytical/critical) is the closest synonym.',
    explanation_fil: 'Ang MAPANGHUSGA ay nangangahulugang mapagpuna — ang MAPANURI ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng KASIPHAYO.',
    choices: [
      { id: 'a', text: 'kaligayahan' },
      { id: 'b', text: 'kapaguran' },
      { id: 'c', text: 'kalungkutan' },
      { id: 'd', text: 'kasamaan' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'KASIPHAYO means disappointment and discouragement — KAPAGURAN (weariness/exhaustion) is closely related but KALUNGKUTAN (sadness) is the most correct match in context.',
    explanation_fil: 'Ang KASIPHAYO ay nangangahulugang panlulumo at pagkabigo — ang pinaka-angkop na kasingkahulugan ay KALUNGKUTAN.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAGINOO.',
    choices: [
      { id: 'a', text: 'magalang' },
      { id: 'b', text: 'mayaman' },
      { id: 'c', text: 'marangal' },
      { id: 'd', text: 'makapangyarihan' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'MAGINOO refers to a nobleman or gentleman — MARANGAL (honorable/respectable) is the closest synonym.',
    explanation_fil: 'Ang MAGINOO ay tumutukoy sa isang marangal na tao — ang MARANGAL ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAGPAKABABA.',
    choices: [
      { id: 'a', text: 'magpakumbaba' },
      { id: 'b', text: 'magmataas' },
      { id: 'c', text: 'magmalabis' },
      { id: 'd', text: 'magpahirap' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MAGPAKABABA and MAGPAKUMBABA are synonyms meaning to humble oneself.',
    explanation_fil: 'Ang MAGPAKABABA at MAGPAKUMBABA ay magkasingkahulugan — parehong nangangahulugang magpakumbaba.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng SALAWAHAN.',
    choices: [
      { id: 'a', text: 'tapat' },
      { id: 'b', text: 'mapagpalalo' },
      { id: 'c', text: 'pabago-bago' },
      { id: 'd', text: 'masipag' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'SALAWAHAN means two-faced or fickle/inconsistent — PABAGO-BAGO (changeable/inconsistent) is the closest synonym.',
    explanation_fil: 'Ang SALAWAHAN ay nangangahulugang hindi tapat, dalawang mukha — ang PABAGO-BAGO ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAGASPANG.',
    choices: [
      { id: 'a', text: 'malambot' },
      { id: 'b', text: 'patag' },
      { id: 'c', text: 'matulis' },
      { id: 'd', text: 'hindi pantay' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'MAGASPANG means rough or coarse — HINDI PANTAY (uneven/not smooth) is the closest synonym.',
    explanation_fil: 'Ang MAGASPANG ay nangangahulugang hindi makinis — ang HINDI PANTAY ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng HALINA.',
    choices: [
      { id: 'a', text: 'pumunta ka' },
      { id: 'b', text: 'umalis ka' },
      { id: 'c', text: 'huwag kang sumama' },
      { id: 'd', text: 'hintayin mo ako' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'HALINA is an invitation meaning "come here" or "come with me" — PUMUNTA KA is the closest equivalent.',
    explanation_fil: 'Ang HALINA ay isang imbitasyon na nangangahulugang "halikayo" — ang PUMUNTA KA ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAPAGPANGGAP.',
    choices: [
      { id: 'a', text: 'taimtim' },
      { id: 'b', text: 'mapagkunwari' },
      { id: 'c', text: 'mapagbigay' },
      { id: 'd', text: 'maingat' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'MAPAGPANGGAP means pretentious or hypocritical — MAPAGKUNWARI (pretending/hypocritical) is the synonym.',
    explanation_fil: 'Ang MAPAGPANGGAP ay nangangahulugang nagkukunwari — ang MAPAGKUNWARI ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng TAKOT.',
    choices: [
      { id: 'a', text: 'pangamba' },
      { id: 'b', text: 'galit' },
      { id: 'c', text: 'lungkot' },
      { id: 'd', text: 'hiya' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'TAKOT (fear) is synonymous with PANGAMBA (apprehension/dread).',
    explanation_fil: 'Ang TAKOT at PANGAMBA ay magkasingkahulugan — parehong tumutukoy sa pagkatakot.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAPAGMATAAS.',
    choices: [
      { id: 'a', text: 'mapagkumbaba' },
      { id: 'b', text: 'palalo' },
      { id: 'c', text: 'mabait' },
      { id: 'd', text: 'matulungin' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'MAPAGMATAAS means arrogant or proud — PALALO (boastful/arrogant) is the synonym.',
    explanation_fil: 'Ang MAPAGMATAAS ay nangangahulugang hambog — ang PALALO ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng WASAK.',
    choices: [
      { id: 'a', text: 'bago' },
      { id: 'b', text: 'buo' },
      { id: 'c', text: 'sirang-sira' },
      { id: 'd', text: 'mainam' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'WASAK means broken/destroyed — SIRANG-SIRA (completely ruined/destroyed) is the synonym.',
    explanation_fil: 'Ang WASAK ay nangangahulugang sira na — ang SIRANG-SIRA ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MALIKHAÍN.',
    choices: [
      { id: 'a', text: 'matino' },
      { id: 'b', text: 'mapanlikha' },
      { id: 'c', text: 'matalino' },
      { id: 'd', text: 'mapangarapin' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'MALIKHAÍN means creative/innovative — MAPANLIKHA (creative) is the synonym.',
    explanation_fil: 'Ang MALIKHAÍN ay nangangahulugang malikhain at mapanlikha — ang MAPANLIKHA ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng BANTOG.',
    choices: [
      { id: 'a', text: 'kilala' },
      { id: 'b', text: 'tanyag' },
      { id: 'c', text: 'palasak' },
      { id: 'd', text: 'dating' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'BANTOG means famous/renowned — TANYAG is the closest synonym meaning well-known.',
    explanation_fil: 'Ang BANTOG ay nangangahulugang sikat o kilala — ang TANYAG ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAINGAT.',
    choices: [
      { id: 'a', text: 'mapagmahal' },
      { id: 'b', text: 'mapagbantay' },
      { id: 'c', text: 'matino' },
      { id: 'd', text: 'mabilis' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'MAINGAT means careful/meticulous — MAPAGBANTAY (watchful/careful) is the synonym.',
    explanation_fil: 'Ang MAINGAT ay nangangahulugang maingat at mapagbantay — ang MAPAGBANTAY ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng KAHABAG-HABAG.',
    choices: [
      { id: 'a', text: 'kapuri-puri' },
      { id: 'b', text: 'kasiya-siya' },
      { id: 'c', text: 'kaawa-awa' },
      { id: 'd', text: 'kataka-taka' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'KAHABAG-HABAG means pitiable/miserable — KAAWA-AWA (pitiful) is the synonym.',
    explanation_fil: 'Ang KAHABAG-HABAG ay nangangahulugang kaawa-awa — ang KAAWA-AWA ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAGILIW.',
    choices: [
      { id: 'a', text: 'mainit-ulo' },
      { id: 'b', text: 'mapagmahal' },
      { id: 'c', text: 'sungit' },
      { id: 'd', text: 'palasak' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'MAGILIW means warm/affectionate — MAPAGMAHAL (loving/affectionate) is the synonym.',
    explanation_fil: 'Ang MAGILIW ay nangangahulugang mainit ang pakikitungo — ang MAPAGMAHAL ang kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng TAPANG.',
    choices: [
      { id: 'a', text: 'lakas' },
      { id: 'b', text: 'katapangan' },
      { id: 'c', text: 'sigasig' },
      { id: 'd', text: 'tibay' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'TAPANG (bravery) and KATAPANGAN (courage) are synonyms.',
    explanation_fil: 'Ang TAPANG at KATAPANGAN ay magkasingkahulugan — parehong nangangahulugang lakas ng loob.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MALIIT.',
    choices: [
      { id: 'a', text: 'munti' },
      { id: 'b', text: 'malaki' },
      { id: 'c', text: 'matangkad' },
      { id: 'd', text: 'mababa' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'MALIIT (small) and MUNTI (tiny/small) are synonyms.',
    explanation_fil: 'Ang MALIIT at MUNTI ay magkasingkahulugan — parehong nangangahulugang maliit.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng PAGOD.',
    choices: [
      { id: 'a', text: 'mainit' },
      { id: 'b', text: 'antok' },
      { id: 'c', text: 'gutom' },
      { id: 'd', text: 'hapay' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'PAGOD (tired/exhausted) — HAPAY (very tired/worn-out) is the closest synonym.',
    explanation_fil: 'Ang PAGOD (pagod na pagod) — ang HAPAY (sobrang pagod) ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng MAPANGANIB.',
    choices: [
      { id: 'a', text: 'ligtas' },
      { id: 'b', text: 'delikado' },
      { id: 'c', text: 'madali' },
      { id: 'd', text: 'matibay' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'MAPANGANIB (dangerous) and DELIKADO (dangerous/risky) are synonyms.',
    explanation_fil: 'Ang MAPANGANIB at DELIKADO ay magkasingkahulugan — parehong nangangahulugang may panganib.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng TALINO.',
    choices: [
      { id: 'a', text: 'husay' },
      { id: 'b', text: 'isip' },
      { id: 'c', text: 'dunong' },
      { id: 'd', text: 'lakas' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'TALINO (intelligence/cleverness) — DUNONG (knowledge/wisdom) is the closest synonym.',
    explanation_fil: 'Ang TALINO (katalinuhan) — ang DUNONG (kaalaman) ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng POOT.',
    choices: [
      { id: 'a', text: 'pagmamahal' },
      { id: 'b', text: 'pagdurusa' },
      { id: 'c', text: 'pagkagalit' },
      { id: 'd', text: 'pagkalungkot' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'POOT means hatred/intense anger — PAGKAGALIT (anger) is the closest synonym.',
    explanation_fil: 'Ang POOT ay nangangahulugang galit at pagkapoot — ang PAGKAGALIT ang pinakamalapit na kasingkahulugan.',
  },
  {
    stem: 'Piliin ang salitang kasingkahulugan ng KASIPAGAN.',
    choices: [
      { id: 'a', text: 'katamaran' },
      { id: 'b', text: 'kalikutan' },
      { id: 'c', text: 'pagsisikap' },
      { id: 'd', text: 'kagustuhan' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'KASIPAGAN (diligence/hard work) — PAGSISIKAP (effort/diligence) is the synonym.',
    explanation_fil: 'Ang KASIPAGAN (pagiging masipag) — ang PAGSISIKAP ang kasingkahulugan.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Kasingkahulugan (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Kasingkahulugan',
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
    source_note: 'CSE 2026 Reviewer — Filipino Kasingkahulugan',
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
