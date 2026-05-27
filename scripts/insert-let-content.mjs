import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://yohewfdafdmwntsbzgxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvaGV3ZmRhZmRtd250c2J6Z3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUwNjQ0NCwiZXhwIjoyMDk1MDgyNDQ0fQ.lTZKF3B-9DpxpskSgRPP-f1-m5QddGv0I4wt74gv3sE',
  { auth: { persistSession: false } });

// Known topic IDs
const TOPICS = {
  'let-elem-english':   '3877345e-1219-457b-ad0e-db0125050754',
  'let-sec-english':    '458de06f-3074-48e3-a3c5-ef91a35de48a',
};

// Helper to find or create a topic under a known parent subject area
async function findOrCreateTopic(examSlug, subjectSlug, slug, name) {
  const { data: sa } = await sb.from('subject_areas')
    .select('id, exam_types!inner(slug)')
    .eq('slug', subjectSlug).eq('exam_types.slug', examSlug).maybeSingle();
  if (!sa) { console.error(`No subject area: ${subjectSlug}/${examSlug}`); return null; }
  const { data: existing } = await sb.from('topics').select('id')
    .eq('subject_area_id', sa.id).eq('slug', slug).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb.from('topics')
    .insert({ subject_area_id: sa.id, slug, name, sort_order: 99 }).select('id').single();
  if (error) { console.error(`Create topic ${slug}: ${error.message}`); return null; }
  console.log(`  📁 Created: ${name}`);
  return data.id;
}

async function insert(topicId, qs) {
  let ok = 0;
  for (const q of qs) {
    const { error } = await sb.from('questions').insert({
      topic_id: topicId, stem: q.stem, choices: q.choices,
      correct_choice_id: q.correct, explanation_en: q.exp_en,
      explanation_fil: q.exp_fil, difficulty: q.diff || 2, status: 'published',
    });
    if (error) console.error(`  ❌ ${q.stem.slice(0,50)}: ${error.message}`);
    else ok++;
  }
  return ok;
}

// ── Questions ────────────────────────────────────────────────────────────────

const LET_ELEM_ENGLISH = [
  { stem:'Which of the following is a compound sentence?', correct:'b', diff:2, choices:[{id:'a',text:'The cat slept.'},{id:'b',text:'The cat slept, and the dog barked.'},{id:'c',text:'Sleeping cats.'},{id:'d',text:'When the cat slept.'}], exp_en:'A compound sentence has two independent clauses joined by a coordinating conjunction. "The cat slept, and the dog barked" uses "and."', exp_fil:'Ang compound sentence ay dalawang independent clause na pinagsama ng coordinating conjunction. "The cat slept, and the dog barked" ay gumagamit ng "and."' },
  { stem:'Choose the sentence using simple present tense correctly.', correct:'c', diff:1, choices:[{id:'a',text:'She will run every day.'},{id:'b',text:'She ran every day.'},{id:'c',text:'She runs every day.'},{id:'d',text:'She is running every day.'}], exp_en:'Simple present tense with a third-person singular subject (she) requires "-s": "She runs every day."', exp_fil:'Ang simple present tense na may third-person singular (she) ay nangangailangan ng "-s": "She runs every day."' },
  { stem:'The primary purpose of a topic sentence is to:', correct:'b', diff:2, choices:[{id:'a',text:'Support the main idea with evidence'},{id:'b',text:'State the main idea of the paragraph'},{id:'c',text:'Provide a conclusion'},{id:'d',text:'List supporting details'}], exp_en:'A topic sentence states the main idea of a paragraph. All other sentences support it.', exp_fil:'Ang topic sentence ay nagpapahayag ng pangunahing ideya ng talata. Lahat ng iba pang pangungusap ay sumusuporta dito.' },
  { stem:'Which word is a proper adjective in: "I love Filipino food"?', correct:'c', diff:2, choices:[{id:'a',text:'love'},{id:'b',text:'food'},{id:'c',text:'Filipino'},{id:'d',text:'I'}], exp_en:'"Filipino" is a proper adjective derived from the proper noun "Philippines." Proper adjectives are always capitalized.', exp_fil:'"Filipino" ay proper adjective na galing sa proper noun na "Philippines." Laging may malaking titik ang proper adjective.' },
  { stem:'Which literary device is used in "The wind whispered through the trees"?', correct:'b', diff:2, choices:[{id:'a',text:'Simile'},{id:'b',text:'Personification'},{id:'c',text:'Hyperbole'},{id:'d',text:'Metaphor'}], exp_en:'Personification attributes human qualities to non-human things. "Whispered" is a human action given to the wind.', exp_fil:'Ang personification ay nagbibigay ng katangiang pantao sa mga bagay. Ang "whispered" ay kilos ng tao na inilapat sa hangin.' },
  { stem:'What is the correct plural form of "curriculum"?', correct:'c', diff:3, choices:[{id:'a',text:'Curriculums'},{id:'b',text:'Curriculae'},{id:'c',text:'Curricula'},{id:'d',text:'Curriculum\'s'}], exp_en:'"Curriculum" has a Latin origin. Its classical plural is "curricula," preferred in academic writing.', exp_fil:'Ang "curriculum" ay may Latin na pinagmulan. Ang klasikal na plural nito ay "curricula," na mas ginagamit sa akademikong pagsulat.' },
  { stem:'Which is an example of a gerund?', correct:'b', diff:3, choices:[{id:'a',text:'He is running fast.'},{id:'b',text:'Running is good exercise.'},{id:'c',text:'He ran fast.'},{id:'d',text:'Run fast!'}], exp_en:'A gerund is an -ing verb form functioning as a noun. In "Running is good exercise," "Running" is the subject — a noun use.', exp_fil:'Ang gerund ay anyong pandiwa na nagtatapos sa -ing na gumaganap bilang pangngalan. Sa "Running is good exercise," ang "Running" ay paksa ng pangungusap.' },
  { stem:'What does "context clue" mean?', correct:'b', diff:2, choices:[{id:'a',text:'A dictionary definition'},{id:'b',text:'Surrounding text hints that help determine word meaning'},{id:'c',text:'An author\'s footnote'},{id:'d',text:'A grammar rule'}], exp_en:'Context clues are hints in surrounding text that help readers figure out unfamiliar words without a dictionary.', exp_fil:'Ang context clue ay mga pahiwatig sa paligid ng salita na tumutulong sa mambabasa na maunawaan ang hindi pamilyar na salita nang walang diksyunaryo.' },
  { stem:'In the sentence "Maria, who is a nurse, works at PGH," the clause "who is a nurse" is:', correct:'c', diff:3, choices:[{id:'a',text:'An adverbial clause'},{id:'b',text:'A noun clause'},{id:'c',text:'A relative/adjective clause'},{id:'d',text:'An independent clause'}], exp_en:'"Who is a nurse" is a relative (adjective) clause — it begins with the relative pronoun "who" and modifies "Maria."', exp_fil:'"Who is a nurse" ay relative (adjective) clause — nagsisimula sa relative pronoun na "who" at nagpapaliwanag ng "Maria."' },
  { stem:'The story of José Rizal sacrificing himself for the Philippines is best described as a:', correct:'c', diff:2, choices:[{id:'a',text:'Fable'},{id:'b',text:'Myth'},{id:'c',text:'Historical narrative'},{id:'d',text:'Fairy tale'}], exp_en:'A historical narrative recounts actual documented past events. Rizal\'s story is supported by historical evidence.', exp_fil:'Ang historical narrative ay nagkukuwento ng tunay na nakalipas na pangyayari na may katibayan. Ang kwento ni Rizal ay suportado ng makasaysayang katibayan.' },
];

const LET_ELEM_ASSESSMENT = [
  { stem:'Which type of assessment is given BEFORE instruction to find out what students already know?', correct:'c', diff:2, choices:[{id:'a',text:'Summative'},{id:'b',text:'Formative'},{id:'c',text:'Diagnostic'},{id:'d',text:'Performance'}], exp_en:'Diagnostic assessment before instruction identifies prior knowledge and gaps, helping teachers plan lessons.', exp_fil:'Ang diagnostic assessment ay ibinibigay bago ang pagtuturo para malaman ang kaalaman ng mga mag-aaral at mga kakulangan.' },
  { stem:'A teacher gives a quiz after each lesson to monitor learning. This is:', correct:'b', diff:2, choices:[{id:'a',text:'Summative assessment'},{id:'b',text:'Formative assessment'},{id:'c',text:'Placement test'},{id:'d',text:'Norm-referenced test'}], exp_en:'Formative assessment is ongoing assessment during instruction to monitor learning and adjust teaching.', exp_fil:'Ang formative assessment ay patuloy na pagtatasa habang nagaganap ang pagtuturo para subaybayan ang pag-aaral at ayusin ang pagtuturo.' },
  { stem:'Which is a SMART learning objective?', correct:'b', diff:3, choices:[{id:'a',text:'Students will understand mathematics.'},{id:'b',text:'Students will solve 10 multiplication problems with 80% accuracy by Friday.'},{id:'c',text:'Students will learn history.'},{id:'d',text:'Students will appreciate literature.'}], exp_en:'SMART objectives are Specific, Measurable, Achievable, Relevant, Time-bound. Option B meets all five criteria.', exp_fil:'Ang SMART na layunin ay Specific, Measurable, Achievable, Relevant, Time-bound. Ang B ay nakakatugon sa lahat ng limang pamantayan.' },
  { stem:'A test that compares student performance to other students is called:', correct:'b', diff:2, choices:[{id:'a',text:'Criterion-referenced'},{id:'b',text:'Norm-referenced'},{id:'c',text:'Performance-based'},{id:'d',text:'Portfolio assessment'}], exp_en:'Norm-referenced tests compare individual performance to a normative group. Standardized aptitude tests are norm-referenced.', exp_fil:'Ang norm-referenced test ay naghahambing ng pagganap ng isang indibidwal sa grupong pamantayan. Ang mga standardized aptitude test ay norm-referenced.' },
  { stem:'Bloom\'s Taxonomy is primarily used to:', correct:'c', diff:2, choices:[{id:'a',text:'Classify students by ability'},{id:'b',text:'Rank schools'},{id:'c',text:'Write objectives at different cognitive levels'},{id:'d',text:'Measure physical development'}], exp_en:'Bloom\'s Taxonomy classifies educational objectives from lower-order (Remembering, Understanding) to higher-order (Analyzing, Evaluating, Creating).', exp_fil:'Ginagamit ang Bloom\'s Taxonomy para magsulat ng mga layunin sa iba\'t ibang antas ng kaisipan — mula mababa hanggang mataas na antas ng pag-iisip.' },
];

const LET_ELEM_CURRICULUM = [
  { stem:'The K to 12 curriculum added how many years to basic education?', correct:'b', diff:1, choices:[{id:'a',text:'1 year'},{id:'b',text:'2 years'},{id:'c',text:'3 years'},{id:'d',text:'4 years'}], exp_en:'RA 10533 added 2 years (Grades 11 and 12 — Senior High School) to Philippine basic education.', exp_fil:'Ang RA 10533 ay nagdagdag ng 2 taon (Grade 11 at 12 — Senior High School) sa pangunahing edukasyon.' },
  { stem:'The Tyler Rationale\'s first question ("What educational purposes should the school attain?") is about:', correct:'b', diff:3, choices:[{id:'a',text:'Learning experiences'},{id:'b',text:'Educational objectives'},{id:'c',text:'Evaluation'},{id:'d',text:'Organization'}], exp_en:'Tyler\'s first of four curriculum questions concerns objectives/purposes. The others are: experiences, organization, and evaluation.', exp_fil:'Ang unang tanong ni Tyler sa curriculum ay tungkol sa mga layuning pang-edukasyon (objectives/purposes).' },
  { stem:'Spiral curriculum means topics are:', correct:'b', diff:2, choices:[{id:'a',text:'Taught once per grade'},{id:'b',text:'Revisited with increasing depth across grade levels'},{id:'c',text:'Learned at the student\'s own pace'},{id:'d',text:'Arranged from simple to complex in one grade only'}], exp_en:'Bruner\'s spiral curriculum revisits topics across grade levels with increasing complexity, building on prior knowledge.', exp_fil:'Ang spiral curriculum ni Bruner ay paulit-ulit na tinutukoy ang mga paksa sa iba\'t ibang antas ng pag-aaral, nagpapalalalim sa bawat pagkakataon.' },
  { stem:'The "hidden curriculum" refers to:', correct:'b', diff:3, choices:[{id:'a',text:'The official school syllabus'},{id:'b',text:'Unwritten norms and values students learn through school culture'},{id:'c',text:'Extra-curricular activities'},{id:'d',text:'Government-mandated subjects'}], exp_en:'The hidden curriculum includes implicit lessons about values, norms, and expectations learned through school culture — not formally taught.', exp_fil:'Ang hidden curriculum ay ang mga implikasyon ng mga halaga at pamantayan na natututo sa pamamagitan ng kultura ng paaralan — hindi itinuro nang pormal.' },
  { stem:'Which approach integrates multiple subjects around a central theme?', correct:'b', diff:2, choices:[{id:'a',text:'Subject-centered curriculum'},{id:'b',text:'Integrated/thematic curriculum'},{id:'c',text:'Core curriculum'},{id:'d',text:'Activity-based curriculum'}], exp_en:'Integrated/thematic curriculum organizes learning around a central theme connecting multiple subjects (e.g., "Water" covering science, social studies, language, math).', exp_fil:'Ang integrated/thematic curriculum ay nag-oorganisa ng pag-aaral sa paligid ng isang tema na nagtatali ng iba\'t ibang asignatura.' },
];

const LET_SEC_ENGLISH = [
  { stem:'Which sentence demonstrates passive voice?', correct:'b', diff:2, choices:[{id:'a',text:'The teacher graded the papers.'},{id:'b',text:'The papers were graded by the teacher.'},{id:'c',text:'The teacher is grading the papers.'},{id:'d',text:'Grade the papers!'}], exp_en:'Passive voice: subject receives the action. "The papers were graded" — papers (subject) received the action.', exp_fil:'Sa passive voice, ang paksa ay tatanggap ng kilos. "The papers were graded" — ang mga papel ang tinanggap ng kilos.' },
  { stem:'A thesis statement should:', correct:'c', diff:2, choices:[{id:'a',text:'List all supporting details'},{id:'b',text:'State a broad general topic'},{id:'c',text:'Present the main argument or claim of the essay'},{id:'d',text:'Summarize the conclusion only'}], exp_en:'A thesis statement presents the central argument of an essay, guiding the reader on what will be discussed and defended.', exp_fil:'Ang thesis statement ay nagpapahayag ng pangunahing argumento ng sanaysay, na ginagabayan ang mambabasa sa kung ano ang tatalakayin.' },
  { stem:'The root word "aud" (as in audible, audience) means:', correct:'b', diff:2, choices:[{id:'a',text:'See'},{id:'b',text:'Hear'},{id:'c',text:'Write'},{id:'d',text:'Speak'}], exp_en:'The Latin root "aud" means to hear. "Audible" = able to be heard; "audience" = a group that hears/watches.', exp_fil:'Ang Latin root na "aud" ay nangangahulugang makinig. "Audible" = maririnig; "audience" = isang grupo na nakikinig.' },
  { stem:'An allusion in a text refers to:', correct:'b', diff:3, choices:[{id:'a',text:'A direct quotation'},{id:'b',text:'An indirect reference to a well-known person, event, or work'},{id:'c',text:'A simile'},{id:'d',text:'Hyperbole'}], exp_en:'An allusion is an indirect reference to a historical, cultural, or literary figure/event without fully explaining it (e.g., "She was his Achilles\' heel").', exp_fil:'Ang allusion ay hindi direktang sanggunian sa isang kilalang tao o pangyayari nang hindi ito ganap na ipinaliwanag.' },
  { stem:'Which is an example of situational irony?', correct:'b', diff:2, choices:[{id:'a',text:'The sky is blue.'},{id:'b',text:'A fire station burns down.'},{id:'c',text:'She sings beautifully.'},{id:'d',text:'The book is thick.'}], exp_en:'Situational irony: the opposite of what is expected happens. A fire station burning is ironic because fire stations prevent fires.', exp_fil:'Ang situational irony ay nangyayari kapag ang kabaligtaran ng inaasahan ang nangyari. Ang isang fire station na nasusunog ay ironic.' },
  { stem:'Identifying the author\'s bias helps readers:', correct:'c', diff:3, choices:[{id:'a',text:'Reject the text entirely'},{id:'b',text:'Copy the author\'s view'},{id:'c',text:'Evaluate the reliability and objectivity of the text'},{id:'d',text:'Find grammar errors'}], exp_en:'Identifying bias helps readers critically evaluate whether the text presents a balanced or one-sided perspective, affecting its reliability.', exp_fil:'Ang pag-kikilala ng pagkiling ng may-akda ay tumutulong sa mambabasa na kritikal na suriin ang balanse at pagiging maaasahan ng teksto.' },
  { stem:'Which sentence is punctuated correctly?', correct:'b', diff:2, choices:[{id:'a',text:'However I disagree with you.'},{id:'b',text:'However, I disagree with you.'},{id:'c',text:'However; I disagree with you.'},{id:'d',text:'However I disagree, with you.'}], exp_en:'When a conjunctive adverb (however, therefore) begins a sentence, it is followed by a comma.', exp_fil:'Kapag ang conjunctive adverb (however, therefore) ay nagsisimula ng pangungusap, sinusundan ito ng kuwit.' },
  { stem:'Which pattern arranges events in the order they occurred?', correct:'c', diff:1, choices:[{id:'a',text:'Cause and effect'},{id:'b',text:'Comparison/contrast'},{id:'c',text:'Chronological order'},{id:'d',text:'Problem-solution'}], exp_en:'Chronological order arranges information in time sequence — from earliest to most recent.', exp_fil:'Ang chronological order ay nag-aayos ng impormasyon ayon sa pagkakasunod ng oras — mula pinakamatanda hanggang pinakabago.' },
  { stem:'What is the function of a conjunction?', correct:'c', diff:1, choices:[{id:'a',text:'Names a person, place, or thing'},{id:'b',text:'Describes a noun'},{id:'c',text:'Joins words, phrases, or clauses'},{id:'d',text:'Shows action'}], exp_en:'Conjunctions join words, phrases, or clauses. Coordinating conjunctions (FANBOYS) connect equal grammatical units.', exp_fil:'Ang conjunction ay nag-uugnay ng mga salita, parirala, o sugnay. Ang coordinating conjunctions (FANBOYS) ay nagkokonekta ng pantay na bahagi ng balarila.' },
  { stem:'The Latin phrase "et al." means:', correct:'a', diff:2, choices:[{id:'a',text:'And others'},{id:'b',text:'For example'},{id:'c',text:'That is'},{id:'d',text:'Note well'}], exp_en:'"Et al." abbreviates "et alia" (Latin for "and others"). Used in citations when a work has multiple authors.', exp_fil:'"Et al." ay abbreviation ng "et alia" (Latin na "at iba pa"). Ginagamit sa mga citation na may maraming may-akda.' },
];

const LET_SEC_TEACHING = [
  { stem:'Which method encourages discovery through guided exploration?', correct:'b', diff:2, choices:[{id:'a',text:'Direct instruction'},{id:'b',text:'Inquiry-based learning'},{id:'c',text:'Lecture method'},{id:'d',text:'Drill and practice'}], exp_en:'Inquiry-based learning involves students asking questions and discovering concepts through exploration and problem-solving.', exp_fil:'Ang inquiry-based learning ay nagpapalahok sa mga mag-aaral na magtanong at matuklasan ang mga konsepto sa pamamagitan ng pagsisiyasat.' },
  { stem:'Zone of Proximal Development (ZPD) was proposed by:', correct:'b', diff:2, choices:[{id:'a',text:'Jean Piaget'},{id:'b',text:'Lev Vygotsky'},{id:'c',text:'Jerome Bruner'},{id:'d',text:'Benjamin Bloom'}], exp_en:'Lev Vygotsky introduced ZPD — the gap between what a learner can do alone and with guidance. Scaffolding supports learning within the ZPD.', exp_fil:'Si Lev Vygotsky ang nagpakilala ng ZPD — ang agwat sa pagitan ng magagawa ng mag-aaral nang mag-isa at sa tulong ng ibang tao.' },
  { stem:'Cooperative learning involves students:', correct:'b', diff:2, choices:[{id:'a',text:'Working alone'},{id:'b',text:'Working in groups with shared goals and individual accountability'},{id:'c',text:'Listening passively to the teacher'},{id:'d',text:'Competing for ranks'}], exp_en:'Cooperative learning uses structured groups with shared goals, where each member is accountable for individual and group success.', exp_fil:'Ang cooperative learning ay nagpapalahok sa mga mag-aaral sa mga istrukturadong grupo na may naka-isang layunin at indibidwal na responsibilidad.' },
  { stem:'Which theory says learning occurs through observation and imitation?', correct:'c', diff:2, choices:[{id:'a',text:'Behaviorism'},{id:'b',text:'Constructivism'},{id:'c',text:'Social learning theory'},{id:'d',text:'Cognitivism'}], exp_en:'Bandura\'s Social Learning Theory states people learn by observing others\' behaviors and consequences (modeling).', exp_fil:'Ang Social Learning Theory ni Bandura ay nagsasabi na natututo ang mga tao sa pamamagitan ng pagmamasid sa pag-uugali ng iba at ng mga kahihinatnan nito.' },
  { stem:'A teacher allows "wait time" after asking a question. This is because:', correct:'b', diff:2, choices:[{id:'a',text:'The teacher forgot the answer'},{id:'b',text:'It gives students time to process and formulate quality responses'},{id:'c',text:'It wastes class time'},{id:'d',text:'Only slow learners need it'}], exp_en:'Wait time (think time) after a question gives students processing time, leading to more thoughtful and higher-quality answers.', exp_fil:'Ang wait time pagkatapos ng tanong ay nagbibigay ng oras sa mga mag-aaral na mag-isip, na nagbubunga ng mas matalinong mga sagot.' },
];

async function main() {
  let total = 0;

  // LET Elementary — existing English topic
  console.log('📚 LET Elementary — English (existing)');
  total += await insert(TOPICS['let-elem-english'], LET_ELEM_ENGLISH);
  console.log(`  ✅ ${LET_ELEM_ENGLISH.length} English questions`);

  // LET Elementary — new topics under prof-ed
  const profEdElemId = await findOrCreateTopic('let-elementary', 'prof-ed', 'assessment-elem', 'Assessment and Evaluation');
  if (profEdElemId) {
    total += await insert(profEdElemId, LET_ELEM_ASSESSMENT);
    console.log(`  ✅ ${LET_ELEM_ASSESSMENT.length} Assessment questions`);
  }
  const currElemId = await findOrCreateTopic('let-elementary', 'prof-ed', 'curriculum-elem', 'Curriculum Development');
  if (currElemId) {
    total += await insert(currElemId, LET_ELEM_CURRICULUM);
    console.log(`  ✅ ${LET_ELEM_CURRICULUM.length} Curriculum questions`);
  }

  // LET Secondary — existing English topic
  console.log('\n📚 LET Secondary — English (existing)');
  total += await insert(TOPICS['let-sec-english'], LET_SEC_ENGLISH);
  console.log(`  ✅ ${LET_SEC_ENGLISH.length} English questions`);

  // LET Secondary — Teaching Strategies
  const teachSecId = await findOrCreateTopic('let-secondary', 'prof-ed', 'teaching-strategies', 'Teaching Strategies and Methods');
  if (teachSecId) {
    total += await insert(teachSecId, LET_SEC_TEACHING);
    console.log(`  ✅ ${LET_SEC_TEACHING.length} Teaching Strategies questions`);
  }

  console.log(`\n✅ Done: ${total} questions inserted.`);
}

async function findOrCreateTopic(examSlug, subjectSlug, slug, name) {
  const { data: sa } = await sb.from('subject_areas')
    .select('id, exam_types!inner(slug)')
    .eq('slug', subjectSlug).eq('exam_types.slug', examSlug).maybeSingle();
  if (!sa) {
    // Create subject area
    const { data: et } = await sb.from('exam_types').select('id').eq('slug', examSlug).single();
    if (!et) { console.error(`Exam type not found: ${examSlug}`); return null; }
    const { data: newSa, error: saErr } = await sb.from('subject_areas')
      .insert({ exam_type_id: et.id, slug: subjectSlug, name: subjectSlug === 'prof-ed' ? 'Professional Education' : subjectSlug, sort_order: 99 })
      .select('id').single();
    if (saErr) { console.error(`Subject area error: ${saErr.message}`); return null; }
    const { data: t } = await sb.from('topics').insert({ subject_area_id: newSa.id, slug, name, sort_order: 99 }).select('id').single();
    console.log(`  📁 Created subject '${subjectSlug}' + topic '${name}'`);
    return t?.id ?? null;
  }
  const { data: ex } = await sb.from('topics').select('id').eq('subject_area_id', sa.id).eq('slug', slug).maybeSingle();
  if (ex) { console.log(`  📚 ${name} [existing]`); return ex.id; }
  const { data: t, error } = await sb.from('topics').insert({ subject_area_id: sa.id, slug, name, sort_order: 99 }).select('id').single();
  if (error) { console.error(`Create topic error: ${error.message}`); return null; }
  console.log(`  📁 Created topic: ${name}`);
  return t.id;
}

main().catch(console.error);
