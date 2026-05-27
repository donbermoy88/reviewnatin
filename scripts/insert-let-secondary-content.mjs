/**
 * Expand LET Secondary content.
 * Adds topics and questions for Gen Ed + Prof Ed.
 * Run: node scripts/insert-let-secondary-content.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SA = {
  genEd:  'f3f570c5-80f3-4cfa-9eda-4030198fb2ad',
  profEd: '966601ed-f401-4a1a-a03b-2973717417a1',
};

const NEW_TOPICS = [
  { id: randomUUID(), subject_area_id: SA.genEd,  slug: 'filipino',          name: 'Filipino Language & Literature', sort_order: 2 },
  { id: randomUUID(), subject_area_id: SA.genEd,  slug: 'social-studies',    name: 'Social Studies / Araling Panlipunan', sort_order: 3 },
  { id: randomUUID(), subject_area_id: SA.genEd,  slug: 'mathematics',       name: 'Mathematics',                    sort_order: 4 },
  { id: randomUUID(), subject_area_id: SA.genEd,  slug: 'science',           name: 'Science',                        sort_order: 5 },
  { id: randomUUID(), subject_area_id: SA.profEd, slug: 'curriculum',        name: 'Curriculum Development',         sort_order: 2 },
  { id: randomUUID(), subject_area_id: SA.profEd, slug: 'assessment',        name: 'Classroom Assessment',           sort_order: 3 },
  { id: randomUUID(), subject_area_id: SA.profEd, slug: 'learning-theories', name: 'Learning Theories',              sort_order: 4 },
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

function buildQuestions(topicMap) {
  const T = {};
  for (const t of topicMap) T[t.slug] = t.id;

  const qs = [];

  // ── Gen Ed: English ─────────────────────────────────────────────
  const ENG = '458de06f-3074-48e3-a3c5-ef91a35de48a';
  qs.push(q(ENG,
    'Which sentence uses the subjunctive mood correctly?',
    'If he was here, he would help us.',
    'If he were here, he would help us.',
    'If he is here, he helps us.',
    'If he will be here, he would help us.',
    'b',
    'The subjunctive mood uses "were" (not "was") for hypothetical or contrary-to-fact conditions. "If he were here" correctly expresses a situation that is not currently true. This is the past subjunctive form used in conditional sentences. "If he was here" is informal/colloquial but incorrect in formal written English.',
    'Ang subjunctive mood ay gumagamit ng "were" (hindi "was") para sa hypothetical o contrary-to-fact na mga kondisyon. Ang "If he were here" ay tamang nagpapahayag ng sitwasyon na hindi kasalukuyang totoo.',
  ));
  qs.push(q(ENG,
    'The figure of speech in "The stars danced in the night sky" is:',
    'Simile',
    'Metaphor',
    'Personification',
    'Hyperbole',
    'c',
    'Personification attributes human characteristics (dancing) to a non-human thing (stars). A simile uses "like" or "as" to compare. A metaphor states a direct comparison without "like" or "as." Hyperbole is an exaggeration for effect.',
    'Ang personification ay nagbibigay ng katangiang pantao (pagsayaw) sa isang bagay na hindi tao (mga bituin). Ang simile ay gumagamit ng "like" o "as". Ang metaphor ay direktang paghahambing. Ang hyperbole ay pagmamalabis.',
  ));
  qs.push(q(ENG,
    'Which type of context clue helps determine the meaning of an unfamiliar word through an example?',
    'Definition clue',
    'Restatement clue',
    'Contrast clue',
    'Example/Illustration clue',
    'd',
    'An example/illustration clue provides specific examples that illustrate the meaning of the unfamiliar word. Definition clues directly define the word. Restatement clues paraphrase the meaning. Contrast clues show the opposite meaning through antonyms or contrasting ideas.',
    'Ang example/illustration clue ay nagbibigay ng mga tiyak na halimbawa na naglalarawan ng kahulugan ng hindi kilalang salita. Ang definition clues ay direktang nagbibigay-kahulugan. Ang restatement clues ay nagpaparaphrase. Ang contrast clues ay nagpapakita ng kabaligtaran.',
  ));

  // ── Gen Ed: Filipino ───────────────────────────────────────────────
  qs.push(q(T['filipino'],
    'Alin sa mga sumusunod ang tamang paggamit ng "ng" at "nang"?',
    'Bumili nang mangga si Ana.',
    'Tumakbo ng mabilis ang bata.',
    'Nagbasa ng libro ang guro.',
    'Kumain nang marami ang mga bata.',
    'c',
    '"Ng" ay ginagamit bilang pangukol (preposition) na nagpapakita ng relasyon sa pangngalan, katulad ng pagmamay-ari, pakikinabangan, o direksyon. "Nagbasa ng libro" — ang "ng" ay nag-uugnay ng pandiwang "nagbasa" sa pantanging layon na "libro." "Nang" naman ay ginagamit bilang pang-abay (para sa oras o paraan). Halimbawa: "Natulog nang matagal" (tulog sa matagal na panahon).',
    '"Ng" is used as a preposition linking a verb to its object (nagbasa ng libro). "Nang" is used as an adverb (of time or manner). "Tumakbo nang mabilis" is correct — "nang" modifies the adverb "mabilis."',
  ));
  qs.push(q(T['filipino'],
    'Anong uri ng tayutay ang ginamit sa "Ang buhay ay isang paglalakbay"?',
    'Simili',
    'Metaporo',
    'Personipikasyon',
    'Pagmamalabis',
    'b',
    'Ang metaporo ay naghahambing ng dalawang magkaibang bagay nang walang paggamit ng "tulad" o "parang." Ang "Ang buhay ay isang paglalakbay" ay nagpapatukoy na ang buhay ay paglalakbay — direktang paghahambing. Ang simili ay gumagamit ng "tulad ng" o "parang." Ang personipikasyon ay nagbibigay ng katangiang tao sa hindi-tao.',
    'A metaphor directly equates two unlike things without "like" or "as." "Ang buhay ay isang paglalakbay" states that life IS a journey — a direct comparison.',
  ));

  // ── Gen Ed: Social Studies ─────────────────────────────────────────
  qs.push(q(T['social-studies'],
    'The EDSA People Power Revolution (1986) resulted in:',
    'The declaration of Martial Law',
    'The ousting of President Ferdinand Marcos and the restoration of democracy',
    'The ratification of the 1973 Constitution',
    'The independence of the Philippines from the United States',
    'b',
    'The EDSA People Power Revolution (February 22–25, 1986) was a peaceful mass uprising that ousted President Ferdinand Marcos after 20+ years of authoritarian rule (14 years of Martial Law). Corazon Aquino was installed as president, restoring democratic institutions. The 1987 Constitution was subsequently drafted and ratified.',
    'Ang EDSA People Power Revolution (Pebrero 22–25, 1986) ay isang mapayapang mass uprising na nagpaalis kay Pangulong Ferdinand Marcos pagkatapos ng mahigit 20 taon ng awtoritaryanong pamumuno. Si Corazon Aquino ay itinalagang pangulo, na nagpanumbalik ng mga demokratikong institusyon.',
  ));
  qs.push(q(T['social-studies'],
    'Which Philippine law mandates free basic education from Kindergarten through Grade 12 (K–12)?',
    'Republic Act 7836',
    'Republic Act 10533',
    'Republic Act 9155',
    'Republic Act 7160',
    'b',
    'RA 10533, the "Enhanced Basic Education Act of 2013," mandates the K–12 program in the Philippines — adding two years of Senior High School (Grades 11 & 12) to the basic education cycle. RA 9155 is the Governance of Basic Education Act; RA 7836 is the Philippine Teachers Professionalization Act; RA 7160 is the Local Government Code.',
    'Ang RA 10533, ang "Enhanced Basic Education Act of 2013," ay nagtatakda ng K–12 programa sa Pilipinas — nagdaragdag ng dalawang taon ng Senior High School (Grades 11 at 12) sa basic education cycle.',
  ));
  qs.push(q(T['social-studies'],
    'The concept of "Bayanihan" in Filipino culture refers to:',
    'Competition between barangays',
    'Community spirit and mutual cooperation',
    'Respect for elders',
    'Loyalty to one\'s family above all else',
    'b',
    '"Bayanihan" is a traditional Filipino value representing community spirit, mutual cooperation, and collective action. Originally it referred to the practice of neighbors helping a family move their house by carrying it together. Today it symbolizes Filipinos helping each other in times of need — a core value tested in the Social Studies LET.',
    'Ang "Bayanihan" ay isang tradisyonal na Filipino na halaga na kumakatawan sa community spirit, mutual cooperation, at collective action. Orihinal na tumutukoy ito sa gawi ng mga kapitbahay na tumutulong sa isang pamilya na ilipat ang kanilang bahay sa pamamagitan ng sabay-sabay na pagdadala nito.',
  ));

  // ── Gen Ed: Mathematics ───────────────────────────────────────────
  qs.push(q(T['mathematics'],
    'A rectangle has a length of 15 cm and a width of 8 cm. What is its area?',
    '46 cm²',
    '120 cm²',
    '46 cm',
    '23 cm²',
    'b',
    'Area of a rectangle = length × width = 15 cm × 8 cm = 120 cm². The perimeter would be 2(15 + 8) = 46 cm (not the area). Always include the correct unit: cm² for area.',
    'Ang sukat ng rektanggulo = haba × lapad = 15 cm × 8 cm = 120 cm². Ang perimetro ay 2(15 + 8) = 46 cm (hindi ang sukat).',
  ));
  qs.push(q(T['mathematics'],
    'What is the value of x in the equation 3x + 7 = 22?',
    'x = 3',
    'x = 5',
    'x = 7',
    'x = 9',
    'b',
    '3x + 7 = 22 → 3x = 22 – 7 = 15 → x = 15 ÷ 3 = 5. Verify: 3(5) + 7 = 15 + 7 = 22 ✓. Solving linear equations: isolate the variable by applying inverse operations.',
    '3x + 7 = 22 → 3x = 15 → x = 5. Suriin: 3(5) + 7 = 22 ✓',
  ));
  qs.push(q(T['mathematics'],
    'A class of 40 students scored a mean of 78 on a test. If 10 students are removed who had a mean of 70, what is the new mean of the remaining 30 students?',
    '80.67',
    '81.67',
    '82',
    '80',
    'a',
    'Total score of 40 students = 40 × 78 = 3,120. Score of 10 removed students = 10 × 70 = 700. Remaining total = 3,120 – 700 = 2,420. New mean = 2,420 ÷ 30 ≈ 80.67.',
    'Kabuuang marka ng 40 estudyante = 40 × 78 = 3,120. Marka ng 10 na tinanggal = 10 × 70 = 700. Natitirang kabuuan = 2,420. Bagong mean = 2,420 ÷ 30 ≈ 80.67.',
  ));

  // ── Gen Ed: Science ───────────────────────────────────────────────
  qs.push(q(T['science'],
    'Which type of cell does NOT have a membrane-bound nucleus?',
    'Animal cell',
    'Plant cell',
    'Prokaryotic cell',
    'Eukaryotic cell',
    'c',
    'Prokaryotic cells (bacteria and archaea) do not have a membrane-bound nucleus. Their genetic material (DNA) is located in the cytoplasm in a region called the nucleoid. All eukaryotic cells (animals, plants, fungi, protists) have a membrane-bound nucleus.',
    'Ang prokaryotic cells (bacteria at archaea) ay walang membrane-bound nucleus. Ang kanilang genetic material (DNA) ay nasa cytoplasm sa isang rehiyon na tinatawag na nucleoid. Lahat ng eukaryotic cells (hayop, halaman, fungi, protists) ay may membrane-bound nucleus.',
  ));
  qs.push(q(T['science'],
    'Photosynthesis in plants takes place primarily in the:',
    'Mitochondria',
    'Ribosomes',
    'Chloroplasts',
    'Vacuoles',
    'c',
    'Photosynthesis occurs in the chloroplasts, specifically in the thylakoid membranes (light reactions) and the stroma (Calvin cycle/dark reactions). Chloroplasts contain chlorophyll, the green pigment that absorbs light energy to convert CO₂ + H₂O → glucose + O₂. Mitochondria carry out cellular respiration.',
    'Ang photosynthesis ay nagaganap sa mga chloroplast, partikular sa thylakoid membranes (light reactions) at sa stroma (Calvin cycle/dark reactions). Ang mga chloroplast ay naglalaman ng chlorophyll.',
  ));

  // ── Prof Ed: Teaching Strategies ──────────────────────────────────
  const TS = 'ed29dc4d-9859-4a3f-a3bd-3293783311f4';
  qs.push(q(TS,
    'A teacher uses role-playing, debates, and games in the classroom. This approach is an example of:',
    'Direct instruction',
    'Active learning / experiential learning strategies',
    'Mastery learning',
    'Programmed instruction',
    'b',
    'Active learning strategies (role-playing, debates, simulations, games) engage students as active participants in the learning process, promoting higher-order thinking and retention. Experiential learning (Kolb) emphasizes learning through doing and reflection. Direct instruction is teacher-centered. Mastery learning requires students to achieve set criteria before moving forward.',
    'Ang active learning strategies (role-playing, debates, simulations, games) ay nagsasangkot ng mga estudyante bilang aktibong kalahok sa proseso ng pagkatuto, na nagtataguyod ng higher-order thinking at retention.',
  ));
  qs.push(q(TS,
    'According to Bloom\'s Taxonomy, which cognitive level requires students to JUDGE the value of work based on specific criteria?',
    'Application',
    'Analysis',
    'Synthesis',
    'Evaluation',
    'd',
    'Evaluation is the highest level of the original Bloom\'s Taxonomy (Knowledge, Comprehension, Application, Analysis, Synthesis, Evaluation). It involves judging or critiquing based on criteria and evidence. In the revised Bloom\'s Taxonomy (Anderson & Krathwohl), it is the second-highest level, with "Creating" at the top.',
    'Ang Evaluation ay ang pinakamataas na antas ng orihinal na Bloom\'s Taxonomy. Kinabibilangan ito ng paghuhukom o puna batay sa mga pamantayan at ebidensya.',
  ));
  qs.push(q(TS,
    'Which teaching strategy is MOST appropriate for developing critical thinking skills in secondary students?',
    'Lecture and note-taking',
    'Drill and practice exercises',
    'Socratic questioning and problem-based learning',
    'Memorization of key facts',
    'c',
    'Socratic questioning (asking probing questions that challenge assumptions) and problem-based learning (PBL — solving real-world problems) are highly effective for developing critical thinking. These strategies require students to analyze, evaluate, and create — higher-order thinking in Bloom\'s Taxonomy. Drill, lecture, and memorization address lower-order skills.',
    'Ang Socratic questioning at problem-based learning (PBL) ay lubos na epektibo para sa pagpapaunlad ng critical thinking. Kinakailangan ng mga estratehiyang ito ang mga estudyante na mag-analyze, mag-evaluate, at lumikha.',
  ));

  // ── Prof Ed: Curriculum Development ──────────────────────────────
  qs.push(q(T['curriculum'],
    'Tyler\'s curriculum model is based on answering which four fundamental questions?',
    'Who, What, When, How',
    'Purposes, Experiences, Organization, Evaluation',
    'Content, Methods, Materials, Assessment',
    'Objectives, Instruction, Assessment, Reflection',
    'b',
    'Ralph Tyler\'s (1949) model asks: (1) What educational purposes should the school seek to attain? (2) What educational experiences can be provided to attain these purposes? (3) How can these experiences be effectively organized? (4) How can we determine whether the purposes are being attained? This is the foundation of curriculum theory.',
    'Ang modelo ni Ralph Tyler (1949) ay nagtatanong ng: (1) Anong mga layuning pang-edukasyon ang dapat hangarin ng paaralan? (2) Anong mga karanasang pang-edukasyon ang maaaring ibigay? (3) Paano epektibong maioorganisa ang mga karanasan? (4) Paano matutukoy kung ang mga layunin ay naaabot?',
  ));
  qs.push(q(T['curriculum'],
    'The K–12 curriculum in the Philippines is designed using which framework?',
    'Spiral progression approach',
    'Scope and sequence only',
    'Subject-centered approach',
    'Outcomes-based education only',
    'a',
    'The K–12 Basic Education Curriculum (RA 10533) uses the SPIRAL PROGRESSION approach — key concepts and skills are revisited and deepened across grade levels and subject areas. This ensures students build on prior knowledge progressively. It is combined with outcomes-based education (OBE) principles.',
    'Ang K–12 Basic Education Curriculum ay gumagamit ng SPIRAL PROGRESSION approach — ang mga pangunahing konsepto at kasanayan ay binibisita ulit at pinalalim sa iba\'t ibang antas ng baitang. Tinitiyak nito na ang mga estudyante ay nagtatayo sa nakaraang kaalaman nang progresibo.',
  ));

  // ── Prof Ed: Assessment ───────────────────────────────────────────
  qs.push(q(T['assessment'],
    'A test is given at the END of an instructional unit to determine if learning objectives were achieved. This is called:',
    'Formative assessment',
    'Diagnostic assessment',
    'Summative assessment',
    'Performance-based assessment',
    'c',
    'Summative assessment evaluates student learning at the END of an instructional unit to measure achievement of learning objectives. It is assessment OF learning (e.g., final exams, unit tests, standardized tests). Formative assessment occurs DURING instruction (assessment FOR learning). Diagnostic assessment occurs BEFORE instruction to determine prior knowledge.',
    'Ang summative assessment ay sinusuri ang pagkatuto ng estudyante sa PAGTATAPOS ng instructional unit. Ito ay assessment OF learning (hal. final exams, unit tests). Ang formative assessment ay nangyayari HABANG nag-iinstruction (assessment FOR learning).',
  ));
  qs.push(q(T['assessment'],
    'Which type of test item BEST measures higher-order thinking skills?',
    'True-or-false items',
    'Multiple-choice items',
    'Essay items',
    'Matching-type items',
    'c',
    'Essay items BEST measure higher-order thinking (analysis, synthesis, evaluation) because they require students to organize and express complex ideas, defend positions, and demonstrate deep understanding. They are difficult to score objectively but assess complex cognition most authentically. True-false, multiple-choice, and matching items primarily measure recall and recognition (lower-order thinking).',
    'Ang essay items ay pinakamabisang sumusukat ng higher-order thinking (analysis, synthesis, evaluation) dahil kinakailangan ng mga estudyante na mag-organisa at magpahayag ng mga kumplikadong ideya. Ang true-false, multiple-choice, at matching items ay pangunahing sumusukat ng recall at recognition.',
  ));
  qs.push(q(T['assessment'],
    'Validity in assessment refers to:',
    'The consistency of scores across multiple administrations',
    'The extent to which a test measures what it is intended to measure',
    'The difficulty level of test items',
    'The objectivity of scoring procedures',
    'b',
    'Validity is the degree to which a test measures what it claims to measure. Types: content validity (covers the intended curriculum), construct validity (measures the theoretical construct), criterion-related validity (correlates with other measures). Reliability refers to consistency. Objectivity is related to reliability in scoring.',
    'Ang validity ay ang antas kung saan ang isang pagsusulit ay sumusukat ng inilalayong sukatin. Ang reliability naman ay tumutukoy sa consistency ng mga marka sa maraming administrasyon.',
  ));

  // ── Prof Ed: Learning Theories ────────────────────────────────────
  qs.push(q(T['learning-theories'],
    'Vygotsky\'s Zone of Proximal Development (ZPD) refers to:',
    'The maximum level of independent learning a student can achieve',
    'The range between what a learner can do independently and what they can do with guidance',
    'The zone in which students feel most comfortable learning',
    'The area of the brain responsible for language acquisition',
    'b',
    'Vygotsky\'s ZPD is the distance between what a learner can do independently (actual development level) and what they can accomplish with guidance from a more capable peer or adult (potential development level). It supports the concept of "scaffolding" — providing temporary support to help students reach higher levels of understanding.',
    'Ang ZPD ni Vygotsky ay ang agwat sa pagitan ng kaya ng mag-aaral nang mag-isa (actual development level) at ng kaya nilang gawin nang may gabay ng mas may kakayahang kapwa o matanda (potential development level). Sinusuportahan nito ang konsepto ng "scaffolding."',
  ));
  qs.push(q(T['learning-theories'],
    'According to Piaget, a child who understands that the amount of liquid remains the same regardless of the shape of the container has achieved:',
    'Object permanence',
    'Conservation',
    'Reversibility',
    'Egocentrism',
    'b',
    'Conservation (Piaget) is the understanding that quantity/amount remains the same even when the appearance changes (e.g., liquid poured into a different-shaped container). This develops in the Concrete Operational stage (ages 7–11). Object permanence (objects exist even when out of sight) develops in the Sensorimotor stage.',
    'Ang Conservation (Piaget) ay ang pag-unawa na ang dami ay nananatiling pareho kahit magbago ang hitsura (hal. likido na ibinuhos sa iba\'t ibang hugis ng lalagyan). Ito ay nagpapaunlad sa Concrete Operational stage (edad 7–11).',
  ));
  qs.push(q(T['learning-theories'],
    'Bandura\'s Social Learning Theory emphasizes that learning occurs through:',
    'Classical conditioning using stimuli and responses',
    'Operant conditioning using reinforcement and punishment',
    'Observation, imitation, and modeling of others\' behavior',
    'Insight and sudden problem-solving',
    'c',
    'Albert Bandura\'s Social Learning Theory (Social Cognitive Theory) posits that learning occurs through OBSERVATION, IMITATION, and MODELING — watching others and replicating behavior. Key concepts include: observational learning, self-efficacy (belief in one\'s ability to succeed), and vicarious reinforcement (learning from others\' consequences).',
    'Ang Social Learning Theory ni Bandura ay nagsasaad na ang pagkatuto ay nagaganap sa pamamagitan ng PAGMAMASID, PAGTULAD, at PAGMOMOLDO — pagmamasid sa iba at pagtulad ng gawi.',
  ));

  return qs;
}

async function main() {
  // Insert topics
  console.log('Creating LET Secondary topics...');
  const { data: topicData, error: topicErr } = await sb
    .from('topics')
    .insert(NEW_TOPICS.map(t => ({ ...t, description: null, blueprint_topic_code: null })))
    .select();

  if (topicErr) {
    console.error('Topic error:', topicErr.message);
    process.exit(1);
  }
  console.log(`✅ Created ${topicData.length} topics`);

  // Merge with existing topics for lookup
  const existingTopics = [
    { id: '458de06f-3074-48e3-a3c5-ef91a35de48a', slug: 'english' },
    { id: 'ed29dc4d-9859-4a3f-a3bd-3293783311f4', slug: 'teaching-strats' },
    ...topicData,
  ];

  const questions = buildQuestions(existingTopics);
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
