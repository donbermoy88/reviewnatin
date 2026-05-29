/**
 * Expand remaining content:
 * - CSE Sub general-info (0 questions → 15+)
 * - LET Elementary gen-ed add more
 * - CSE Sub clerical operations
 *
 * Run: node scripts/expand-remaining-content.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Subject area IDs
const CSE_SUB_GENINFO_SA = '52a47f94-ef83-40eb-9ceb-a43655eade5a';
const LET_ELEM_GENINFO_SA = 'f3f570c5-80f3-4cfa-9eda-4030198fb2ad'; // LET Sec gen-ed (same structure for elem)

// New topics to create
const NEW_TOPICS = [
  {
    id: randomUUID(),
    subject_area_id: CSE_SUB_GENINFO_SA,
    slug: 'phil-government',
    name: 'Philippine Government & History',
    sort_order: 1,
    description: null,
    blueprint_topic_code: null,
  },
  {
    id: randomUUID(),
    subject_area_id: CSE_SUB_GENINFO_SA,
    slug: 'laws-ethics-sub',
    name: 'Laws and Ethics for Public Service',
    sort_order: 2,
    description: null,
    blueprint_topic_code: null,
  },
];

function q(topicId, stem, a, b, c, d, correct, en, fil) {
  return {
    id: randomUUID(),
    topic_id: topicId,
    stem,
    choices: [{ id: 'a', text: a }, { id: 'b', text: b }, { id: 'c', text: c }, { id: 'd', text: d }],
    correct_choice_id: correct,
    explanation_en: en,
    explanation_fil: fil,
    difficulty: 2,
    status: 'published',
    source: 'ReviewNatin',
  };
}

function buildQuestions(govTopic, lawsTopic) {
  const qs = [];

  // ── CSE Sub: Philippine Government & History ──────────────────────
  qs.push(q(govTopic,
    'Who is considered the "Father of the Philippine Nation"?',
    'Emilio Aguinaldo',
    'Andres Bonifacio',
    'Jose Rizal',
    'Apolinario Mabini',
    'c',
    'Dr. Jose Rizal is considered the Father of the Philippine Nation and the country\'s national hero. His novels (Noli Me Tangere and El Filibusterismo) awakened Filipino nationalism. He was executed by the Spanish colonial government on December 30, 1896 (now celebrated as Rizal Day). Emilio Aguinaldo was the first President of the Philippines.',
    'Si Dr. Jose Rizal ay itinuturing na Ama ng Bansang Pilipinas at pambansang bayani ng bansa. Ang kanyang mga nobela (Noli Me Tangere at El Filibusterismo) ay nagising sa Filipino nationalism. Siya ay pinatay ng kolonyal na pamahalaan ng Espanya noong Disyembre 30, 1896.',
  ));
  qs.push(q(govTopic,
    'The Philippine Declaration of Independence was proclaimed on:',
    'June 12, 1898',
    'July 4, 1946',
    'February 25, 1986',
    'August 21, 1983',
    'a',
    'Philippine Independence was proclaimed on June 12, 1898 in Kawit, Cavite by General Emilio Aguinaldo — marking the end of Spanish colonial rule. However, formal international recognition took time. July 4, 1946 is when the US granted full independence. June 12 is now celebrated as Independence Day (a national holiday).',
    'Ang kalayaan ng Pilipinas ay isinanggunian noong Hunyo 12, 1898 sa Kawit, Cavite ni Heneral Emilio Aguinaldo — na nagmamarka ng pagtatapos ng kolonyal na pamamahala ng Espanya.',
  ));
  qs.push(q(govTopic,
    'How many members make up the House of Representatives at the lower limit set by the 1987 Constitution?',
    '200',
    '250',
    'Not more than 300',
    '350',
    'c',
    'Under Article VI, Section 5 of the 1987 Constitution, the House of Representatives shall be composed of not more than 250 members (later amended to not more than 300), unless otherwise fixed by law. Members serve 3-year terms and can serve a maximum of 3 consecutive terms. The current House has over 300 members.',
    'Sa ilalim ng Artikulo VI, Seksyon 5 ng 1987 Konstitusyon, ang Kapulungan ng mga Kinatawan ay binubuo ng hindi hihigit sa 300 miyembro maliban kung itakda ng batas.',
  ));
  qs.push(q(govTopic,
    'The Civil Service Commission (CSC) is a constitutional body under which article of the 1987 Philippine Constitution?',
    'Article IX-A',
    'Article IX-B',
    'Article XI',
    'Article XII',
    'b',
    'Article IX-B of the 1987 Philippine Constitution establishes the Civil Service Commission as the central personnel agency of the government. It covers career and non-career service, promotes merit and fitness, and administers examinations (including the CSE). Article IX-A establishes the constitutional commissions in general; Article IX-C covers COMELEC; Article IX-D covers COA.',
    'Ang Artikulo IX-B ng 1987 Konstitusyon ay nagtatatag ng Civil Service Commission bilang sentral na ahensya ng tauhan ng gobyerno. Pinoprotektahan nito ang serbisyong sibil at nangangasiwa sa mga pagsusulit.',
  ));
  qs.push(q(govTopic,
    'Which Philippine hero led the Katipunan revolutionary movement against Spanish rule?',
    'Jose Rizal',
    'Emilio Aguinaldo',
    'Andres Bonifacio',
    'Marcelo del Pilar',
    'c',
    'Andres Bonifacio founded the Katipunan (Kataastaasang Kagalanggalangang Katipunan ng mga Anak ng Bayan) in 1892 — a secret revolutionary society that started the Philippine Revolution against Spain in 1896. He is known as the "Father of the Philippine Revolution" and "Supremo" of the Katipunan. Emilio Aguinaldo later became president.',
    'Si Andres Bonifacio ang nagtatag ng Katipunan noong 1892 — isang lihim na rebolusyonaryong samahan na nagsimula ng Rebolusyon ng Pilipinas laban sa Espanya noong 1896.',
  ));
  qs.push(q(govTopic,
    'The Ombudsman of the Philippines is created under which office?',
    'Office of the President',
    'Office of the Ombudsman (Tanodbayan)',
    'Supreme Court',
    'Civil Service Commission',
    'b',
    'The Office of the Ombudsman (Tanodbayan) is an independent constitutional body created under Article XI of the 1987 Philippine Constitution. The Ombudsman acts as the "People\'s Protector" — investigating and prosecuting government officials for illegal acts, gross incompetence, and corruption. The office is independent from the executive, legislative, and judicial branches.',
    'Ang Office of the Ombudsman (Tanodbayan) ay isang independent na constitutional body na nilikha sa ilalim ng Artikulo XI ng 1987 Konstitusyon. Kinakatawan ng Ombudsman ang "Protektora ng Mamamayan" — nagsisiyasat at nagpoprosekuto ng mga opisyal ng gobyerno.',
  ));

  // ── CSE Sub: Laws & Ethics ────────────────────────────────────────
  qs.push(q(lawsTopic,
    'Under the Civil Service Law, a government employee who is absent for 30 or more consecutive working days without approved leave is considered:',
    'On forced leave',
    'Absent without official leave (AWOL)',
    'On indefinite suspension',
    'Terminated',
    'b',
    'Under CSC rules, an employee who incurs absences of 30 or more consecutive working days WITHOUT approved leave is considered Absent Without Official Leave (AWOL). This is grounds for dropping from the rolls (dismissal from service) without the need for a formal investigation under CSC Memorandum Circular No. 13 series of 2007.',
    'Sa ilalim ng mga panuntunan ng CSC, ang isang empleyado na lumiban ng 30 o higit pang magkakasunod na araw ng trabaho NANG WALANG naaprubahang pahintulot ay itinuturing na Absent Without Official Leave (AWOL).',
  ));
  qs.push(q(lawsTopic,
    'Graft and corruption in the Philippines is primarily punishable under:',
    'RA 3019 (Anti-Graft and Corrupt Practices Act)',
    'RA 6713 (Code of Conduct for Public Officials)',
    'RA 7160 (Local Government Code)',
    'PD 46 (Prohibiting gift-giving)',
    'a',
    'RA 3019, the Anti-Graft and Corrupt Practices Act, is the primary law penalizing corrupt practices of public officials in the Philippines. It prohibits acts like accepting bribes, giving undue advantage, granting licenses to disqualified parties, and causing undue injury to the government. RA 6713 governs conduct and ethics; PD 46 prohibits giving gifts on occasions.',
    'Ang RA 3019, ang Anti-Graft and Corrupt Practices Act, ay ang pangunahing batas na nagpaparusa ng corrupt na mga gawain ng mga opisyal ng gobyerno sa Pilipinas.',
  ));
  qs.push(q(lawsTopic,
    'The principle of "public office is a public trust" is found in which provision of the 1987 Constitution?',
    'Article II, Section 27',
    'Article XI, Section 1',
    'Article IX-B, Section 1',
    'Article III, Section 1',
    'b',
    'Article XI, Section 1 of the 1987 Philippine Constitution states: "Public office is a public trust. Public officers and employees must at all times be accountable to the people, serve them with utmost responsibility, integrity, loyalty, and efficiency, act with patriotism and justice, and lead modest lives." This is the constitutional basis for accountability of public servants.',
    'Ang Artikulo XI, Seksyon 1 ng 1987 Konstitusyon ay nagsasaad: "Ang katungkulang pampubliko ay isang tiwalaang pampubliko. Ang mga opisyal at empleyado ng gobyerno ay dapat palaging maging responsable sa mamamayan..."',
  ));
  qs.push(q(lawsTopic,
    'Which body is responsible for administering the Philippine Civil Service Examination?',
    'Professional Regulation Commission (PRC)',
    'Civil Service Commission (CSC)',
    'Department of Budget and Management (DBM)',
    'Office of the President',
    'b',
    'The Civil Service Commission (CSC) is the constitutional body mandated to administer the Career Service Examination (CSE), which includes the Paper-and-Pencil Test (CSE-PPT) and the Computerized Examination (CSE-COMEX). Passing the CSE is required for most first-level and second-level positions in the Philippine government.',
    'Ang Civil Service Commission (CSC) ay ang constitutional body na may mandatong pangasiwaan ang Career Service Examination (CSE), na kinabibilangan ng Paper-and-Pencil Test (CSE-PPT) at ang Computerized Examination (CSE-COMEX).',
  ));
  qs.push(q(lawsTopic,
    'Under RA 6713, which of the following is NOT prohibited for public officials?',
    'Soliciting gifts from persons with pending transactions in their office',
    'Engaging in private business without prior authority',
    'Accepting an award from a civic organization for community service',
    'Disclosing confidential government information',
    'c',
    'Accepting awards from civic organizations for community service is NOT prohibited under RA 6713 (Code of Conduct and Ethical Standards). The law prohibits: soliciting gifts, engaging in private business without approval, disclosing confidential info, using government resources for private use, etc. Awards and recognition for legitimate public service are explicitly allowed.',
    'Ang pagtanggap ng mga parangal mula sa mga civic organization para sa serbisyo sa komunidad ay HINDI ipinagbabawal sa ilalim ng RA 6713. Ipinagbabawal ng batas ang: paghihingi ng mga regalo, pakikisangkot sa pribadong negosyo nang walang pahintulot, pagsisiwalat ng kumpidensyal na impormasyon, atbp.',
  ));

  // ── LET Elementary: Additional Gen Ed ────────────────────────────
  // We'll use the existing LET Elem gen-ed english topic for more questions
  const LET_ELEM_ENGLISH = '3877345e-1219-457b-ad0e-db0125050754';
  qs.push(q(LET_ELEM_ENGLISH,
    'In teaching phonics to Grade 1 students, the teacher asks them to identify the beginning sound in "cat." This activity develops:',
    'Reading fluency',
    'Phonemic awareness',
    'Reading comprehension',
    'Vocabulary building',
    'b',
    'Phonemic awareness is the ability to hear, identify, and manipulate the individual sounds (phonemes) in spoken words. Identifying beginning sounds (onset) is a foundational phonemic awareness skill. Reading fluency is reading accurately and at a good pace. Phonics is the relationship between sounds and letters; phonemic awareness is purely oral/auditory.',
    'Ang phonemic awareness ay ang kakayahang marinig, matukoy, at manipulahin ang mga indibidwal na tunog (phonemes) sa mga salitang binibigkas. Ang pagtukoy ng mga simula ng tunog (onset) ay isang pangunahing kasanayan sa phonemic awareness.',
  ));
  qs.push(q(LET_ELEM_ENGLISH,
    'A Grade 3 teacher asks students to read a paragraph and then write a brief summary. This activity primarily assesses:',
    'Phonics and decoding skills',
    'Reading comprehension and summarizing skills',
    'Oral communication',
    'Creative writing',
    'b',
    'Reading a paragraph and writing a summary requires students to understand the main idea and important details (reading comprehension) and then express those ideas concisely in their own words (summarizing). This is a higher-order literacy skill that combines comprehension, critical thinking, and writing.',
    'Ang pagbabasa ng talata at pagsulat ng buod ay nangangailangan ng mga estudyante na maunawaan ang pangunahing ideya at mahahalagang detalye (reading comprehension) at pagkatapos ay ipahayag ang mga ideyang iyon nang maigsi sa kanilang sariling mga salita (summarizing).',
  ));

  return qs;
}

async function main() {
  // Resolve CSE Sub general-info topics (may already exist — use DB IDs)
  console.log('Resolving CSE Sub general-info topic IDs from DB...');
  const saIds = [...new Set(NEW_TOPICS.map(t => t.subject_area_id))];
  const { data: dbTopics } = await sb.from('topics').select('id, slug, subject_area_id').in('subject_area_id', saIds);

  const resolvedTopics = {};
  for (const t of NEW_TOPICS) {
    const existing = dbTopics?.find(d => d.slug === t.slug && d.subject_area_id === t.subject_area_id);
    if (existing) {
      console.log(`  ✓ ${t.slug} → ${existing.id} [existing]`);
      resolvedTopics[t.slug] = existing.id;
    } else {
      const { data: ins, error: insErr } = await sb
        .from('topics')
        .insert({ subject_area_id: t.subject_area_id, slug: t.slug, name: t.name, sort_order: t.sort_order })
        .select('id, slug').single();
      if (insErr) { console.error(`  ✗ ${t.slug}:`, insErr.message); continue; }
      console.log(`  ✓ ${t.slug} → ${ins.id} [created]`);
      resolvedTopics[t.slug] = ins.id;
    }
  }

  const govTopic = resolvedTopics['phil-government'];
  const lawsTopic = resolvedTopics['laws-ethics-sub'];

  const questions = buildQuestions(govTopic, lawsTopic);
  console.log(`\nInserting ${questions.length} questions...`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < questions.length; i += 5) {
    const batch = questions.slice(i, i + 5);
    const { error } = await sb.from('questions').insert(batch);
    if (error) {
      console.error(`❌ Batch ${i + 1}–${i + batch.length}:`, error.message);
      failed += batch.length;
    } else {
      console.log(`✅ Inserted ${i + 1}–${Math.min(i + 5, questions.length)}`);
      success += batch.length;
    }
  }
  console.log(`\nDone: ${success} inserted, ${failed} failed`);
}

main().catch(console.error);
