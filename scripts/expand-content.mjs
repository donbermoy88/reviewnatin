/**
 * Expands demo question bank:
 * - Creates missing topics for CSE Sub, PNLE, LET
 * - Adds 10+ questions per topic
 *
 * Run: node scripts/expand-content.mjs
 */

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://yohewfdafdmwntsbzgxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvaGV3ZmRhZmRtd250c2J6Z3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUwNjQ0NCwiZXhwIjoyMDk1MDgyNDQ0fQ.lTZKF3B-9DpxpskSgRPP-f1-m5QddGv0I4wt74gv3sE',
  { auth: { persistSession: false } }
);

// ── helpers ────────────────────────────────────────────────────────────────────

async function ensureTopic(examSlug, subjectSlug, topicSlug, topicName, sortOrder = 99) {
  // get subject_area id
  const { data: sa, error: saErr } = await sb
    .from('subject_areas')
    .select('id')
    .eq('slug', subjectSlug)
    .filter('exam_type_id', 'in', `(select id from exam_types where slug = '${examSlug}')`)
    .maybeSingle();
  if (saErr || !sa) {
    // try with a join
    const { data: sa2 } = await sb
      .from('subject_areas')
      .select('id, exam_types!inner(slug)')
      .eq('slug', subjectSlug)
      .eq('exam_types.slug', examSlug)
      .maybeSingle();
    if (!sa2) throw new Error(`Subject area not found: ${subjectSlug}/${examSlug}`);
    return ensureTopicInSubject(sa2.id, topicSlug, topicName, sortOrder);
  }
  return ensureTopicInSubject(sa.id, topicSlug, topicName, sortOrder);
}

async function ensureTopicInSubject(subjectAreaId, topicSlug, topicName, sortOrder) {
  const { data: existing } = await sb
    .from('topics')
    .select('id')
    .eq('subject_area_id', subjectAreaId)
    .eq('slug', topicSlug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb
    .from('topics')
    .insert({ subject_area_id: subjectAreaId, slug: topicSlug, name: topicName, sort_order: sortOrder })
    .select('id')
    .single();
  if (error) throw new Error(`Create topic ${topicSlug}: ${error.message}`);
  console.log(`  📁 Created topic: ${topicName}`);
  return data.id;
}

async function insertQuestions(topicId, questions) {
  let ok = 0;
  for (const q of questions) {
    const { error } = await sb.from('questions').insert({
      topic_id: topicId,
      stem: q.stem,
      choices: q.choices,
      correct_choice_id: q.correct,
      explanation_en: q.exp_en,
      explanation_fil: q.exp_fil,
      difficulty: q.diff || 2,
      status: 'published',
    });
    if (error) { console.error(`    ❌ ${q.stem.slice(0,50)}: ${error.message}`); }
    else ok++;
  }
  return ok;
}

// ── Question bank ──────────────────────────────────────────────────────────────

const BANK = {

  // ── CSE Subprofessional ──────────────────────────────────────────────────────

  'cse-subprofessional': {

    'verbal': {
      'vocabulary': {
        topicName: 'Vocabulary',
        questions: [
          {
            stem: 'What does the word "diligent" mean?',
            choices: [{ id:'a', text:'Lazy' }, { id:'b', text:'Hardworking and careful' }, { id:'c', text:'Dishonest' }, { id:'d', text:'Talkative' }],
            correct: 'b', diff: 1,
            exp_en: '"Diligent" means showing steady, careful effort in work or duties. A diligent student reviews notes every day.',
            exp_fil: 'Ang "diligent" ay nangangahulugang masipag at maingat sa trabaho. Halimbawa: isang magsasaral na diligent ay nag-aaral araw-araw.',
          },
          {
            stem: 'Choose the word that means the opposite of "generous".',
            choices: [{ id:'a', text:'Kind' }, { id:'b', text:'Giving' }, { id:'c', text:'Stingy' }, { id:'d', text:'Helpful' }],
            correct: 'c', diff: 1,
            exp_en: 'The antonym of "generous" (giving freely) is "stingy" (unwilling to give). The other options are synonyms of generous.',
            exp_fil: 'Ang kabaligtaran ng "generous" (mapagbigay) ay "stingy" (kuripot o hindi mapagbigay).',
          },
          {
            stem: 'Which word best completes the sentence: "The judge gave an ___ verdict."',
            choices: [{ id:'a', text:'impartial' }, { id:'b', text:'biased' }, { id:'c', text:'emotional' }, { id:'d', text:'hasty' }],
            correct: 'a', diff: 2,
            exp_en: '"Impartial" means not favouring either side — fair and unbiased, which is the expected quality of a judge.',
            exp_fil: '"Impartial" ay nangangahulugang walang kinikilingan — makatarungan, na siyang inaasahan sa isang hukom.',
          },
          {
            stem: 'What is the synonym of "eloquent"?',
            choices: [{ id:'a', text:'Fluent and persuasive' }, { id:'b', text:'Silent' }, { id:'c', text:'Rude' }, { id:'d', text:'Confused' }],
            correct: 'a', diff: 2,
            exp_en: '"Eloquent" means expressing ideas clearly and persuasively. A good public speaker is eloquent.',
            exp_fil: '"Eloquent" ay nangangahulugang malinaw at nakakahikayat na pagsasalita. Ang isang magaling na tagapagsalita ay eloquent.',
          },
          {
            stem: 'The word "mandatory" is closest in meaning to:',
            choices: [{ id:'a', text:'Optional' }, { id:'b', text:'Required' }, { id:'c', text:'Suggested' }, { id:'d', text:'Forbidden' }],
            correct: 'b', diff: 1,
            exp_en: '"Mandatory" means required by law or rule. Wearing a seatbelt is mandatory in most places.',
            exp_fil: '"Mandatory" ay nangangahulugang sapilitan ayon sa batas o patakaran. Ang pagsuot ng seatbelt ay mandatory sa karamihang lugar.',
          },
          {
            stem: 'Choose the correct meaning of "concise".',
            choices: [{ id:'a', text:'Long and detailed' }, { id:'b', text:'Brief and clear' }, { id:'c', text:'Confusing' }, { id:'d', text:'Repetitive' }],
            correct: 'b', diff: 1,
            exp_en: '"Concise" means giving information clearly using few words, without unnecessary details.',
            exp_fil: '"Concise" ay nangangahulugang maikli ngunit malinaw. Hindi sobra-sobra ang mga salita.',
          },
          {
            stem: 'Which word is an antonym of "rigid"?',
            choices: [{ id:'a', text:'Strict' }, { id:'b', text:'Firm' }, { id:'c', text:'Flexible' }, { id:'d', text:'Hard' }],
            correct: 'c', diff: 2,
            exp_en: '"Rigid" means stiff, inflexible, or unwilling to change. Its antonym is "flexible."',
            exp_fil: '"Rigid" ay nangangahulugang mahirap baguhin o matigas. Ang kabaligtaran nito ay "flexible" (mapaglaban, madaling baguhin).',
          },
          {
            stem: 'The word "prudent" means:',
            choices: [{ id:'a', text:'Careless' }, { id:'b', text:'Reckless' }, { id:'c', text:'Wise and careful' }, { id:'d', text:'Generous' }],
            correct: 'c', diff: 2,
            exp_en: '"Prudent" means acting with care and thought for the future — showing good judgment.',
            exp_fil: '"Prudent" ay nangangahulugang maingat at marunong mag-isip bago kumilos — nagpapakita ng matalinong pagpapasya.',
          },
          {
            stem: 'What does "novice" mean?',
            choices: [{ id:'a', text:'Expert' }, { id:'b', text:'Beginner' }, { id:'c', text:'Veteran' }, { id:'d', text:'Instructor' }],
            correct: 'b', diff: 1,
            exp_en: 'A "novice" is someone who is new to a skill or subject. A novice employee needs training.',
            exp_fil: 'Ang "novice" ay isang taong bago sa isang trabaho o kasanayan. Kailangan ng pagsasanay ng isang novice na empleyado.',
          },
          {
            stem: 'Choose the best synonym for "commence".',
            choices: [{ id:'a', text:'End' }, { id:'b', text:'Begin' }, { id:'c', text:'Pause' }, { id:'d', text:'Delay' }],
            correct: 'b', diff: 1,
            exp_en: '"Commence" means to begin or start. The graduation ceremony will commence at 9 AM.',
            exp_fil: '"Commence" ay nangangahulugang magsimula. Ang seremonya ay magsisimula (commence) ng ika-9 ng umaga.',
          },
        ],
      },
    },

    'numerical': {
      'basic-operations-sub': {
        topicName: 'Basic Arithmetic',
        questions: [
          {
            stem: 'What is 45 + 78?',
            choices: [{ id:'a', text:'113' }, { id:'b', text:'123' }, { id:'c', text:'133' }, { id:'d', text:'143' }],
            correct: 'b', diff: 1,
            exp_en: '45 + 78 = 123. Add the ones: 5+8=13, write 3, carry 1. Add the tens: 4+7+1=12. Result: 123.',
            exp_fil: '45 + 78 = 123. Dagdag ang mga yunit: 5+8=13, isulat ang 3, dalhin ang 1. Tens: 4+7+1=12. Sagot: 123.',
          },
          {
            stem: 'What is 15% of 200?',
            choices: [{ id:'a', text:'25' }, { id:'b', text:'30' }, { id:'c', text:'35' }, { id:'d', text:'40' }],
            correct: 'b', diff: 2,
            exp_en: '15% of 200 = (15/100) × 200 = 0.15 × 200 = 30.',
            exp_fil: '15% ng 200 = (15/100) × 200 = 0.15 × 200 = 30.',
          },
          {
            stem: 'A worker earns ₱480 per day. How much does he earn in 5 days?',
            choices: [{ id:'a', text:'₱2,200' }, { id:'b', text:'₱2,300' }, { id:'c', text:'₱2,400' }, { id:'d', text:'₱2,500' }],
            correct: 'c', diff: 1,
            exp_en: '₱480 × 5 = ₱2,400.',
            exp_fil: '₱480 × 5 = ₱2,400.',
          },
          {
            stem: 'Which fraction is equivalent to 0.75?',
            choices: [{ id:'a', text:'1/2' }, { id:'b', text:'2/3' }, { id:'c', text:'3/4' }, { id:'d', text:'4/5' }],
            correct: 'c', diff: 2,
            exp_en: '0.75 = 75/100 = 3/4. Divide numerator and denominator by 25.',
            exp_fil: '0.75 = 75/100 = 3/4. Hatiin ang numerator at denominator sa 25.',
          },
          {
            stem: 'What is the square root of 144?',
            choices: [{ id:'a', text:'11' }, { id:'b', text:'12' }, { id:'c', text:'13' }, { id:'d', text:'14' }],
            correct: 'b', diff: 1,
            exp_en: '√144 = 12, because 12 × 12 = 144.',
            exp_fil: '√144 = 12, sapagkat 12 × 12 = 144.',
          },
          {
            stem: 'What is 7² (7 squared)?',
            choices: [{ id:'a', text:'14' }, { id:'b', text:'42' }, { id:'c', text:'49' }, { id:'d', text:'56' }],
            correct: 'c', diff: 1,
            exp_en: '7² = 7 × 7 = 49.',
            exp_fil: '7² = 7 × 7 = 49.',
          },
          {
            stem: 'A bag of rice costs ₱55. How much do 6 bags cost?',
            choices: [{ id:'a', text:'₱300' }, { id:'b', text:'₱320' }, { id:'c', text:'₱330' }, { id:'d', text:'₱350' }],
            correct: 'c', diff: 1,
            exp_en: '₱55 × 6 = ₱330.',
            exp_fil: '₱55 × 6 = ₱330.',
          },
          {
            stem: 'Divide 360 by 12.',
            choices: [{ id:'a', text:'28' }, { id:'b', text:'30' }, { id:'c', text:'32' }, { id:'d', text:'36' }],
            correct: 'b', diff: 1,
            exp_en: '360 ÷ 12 = 30.',
            exp_fil: '360 ÷ 12 = 30.',
          },
          {
            stem: 'A store marks up an item by 20% from its cost of ₱500. What is the selling price?',
            choices: [{ id:'a', text:'₱520' }, { id:'b', text:'₱550' }, { id:'c', text:'₱580' }, { id:'d', text:'₱600' }],
            correct: 'd', diff: 2,
            exp_en: 'Mark-up = 20% × ₱500 = ₱100. Selling price = ₱500 + ₱100 = ₱600.',
            exp_fil: 'Mark-up = 20% × ₱500 = ₱100. Presyo ng pagbebenta = ₱500 + ₱100 = ₱600.',
          },
          {
            stem: 'What is the LCM of 4 and 6?',
            choices: [{ id:'a', text:'8' }, { id:'b', text:'10' }, { id:'c', text:'12' }, { id:'d', text:'24' }],
            correct: 'c', diff: 2,
            exp_en: 'Multiples of 4: 4, 8, 12… Multiples of 6: 6, 12… The LCM is 12.',
            exp_fil: 'Mga multiple ng 4: 4, 8, 12… Mga multiple ng 6: 6, 12… Ang LCM ay 12.',
          },
        ],
      },
      'number-series-sub': {
        topicName: 'Number Series',
        questions: [
          {
            stem: 'Complete the series: 5, 10, 15, 20, ___',
            choices: [{ id:'a', text:'22' }, { id:'b', text:'24' }, { id:'c', text:'25' }, { id:'d', text:'30' }],
            correct: 'c', diff: 1,
            exp_en: 'Each term increases by 5. 20 + 5 = 25.',
            exp_fil: 'Ang bawat term ay nagdaragdag ng 5. 20 + 5 = 25.',
          },
          {
            stem: 'Complete: 2, 4, 8, 16, ___',
            choices: [{ id:'a', text:'24' }, { id:'b', text:'28' }, { id:'c', text:'30' }, { id:'d', text:'32' }],
            correct: 'd', diff: 2,
            exp_en: 'Each term doubles: 2×2=4, 4×2=8, 8×2=16, 16×2=32.',
            exp_fil: 'Ang bawat term ay dinidoble: 2×2=4, 4×2=8, 8×2=16, 16×2=32.',
          },
          {
            stem: 'Complete: 50, 45, 40, 35, ___',
            choices: [{ id:'a', text:'28' }, { id:'b', text:'30' }, { id:'c', text:'32' }, { id:'d', text:'33' }],
            correct: 'b', diff: 1,
            exp_en: 'Each term decreases by 5. 35 − 5 = 30.',
            exp_fil: 'Ang bawat term ay bumababa ng 5. 35 − 5 = 30.',
          },
          {
            stem: 'Complete: 1, 3, 6, 10, 15, ___',
            choices: [{ id:'a', text:'18' }, { id:'b', text:'19' }, { id:'c', text:'21' }, { id:'d', text:'23' }],
            correct: 'c', diff: 3,
            exp_en: 'Differences: +2, +3, +4, +5 → next difference is +6. 15 + 6 = 21. (Triangular numbers)',
            exp_fil: 'Pagkakaiba: +2, +3, +4, +5 → susunod ay +6. 15 + 6 = 21. (Mga triangular number)',
          },
          {
            stem: 'Complete: 3, 6, 12, 24, ___',
            choices: [{ id:'a', text:'36' }, { id:'b', text:'42' }, { id:'c', text:'48' }, { id:'d', text:'56' }],
            correct: 'c', diff: 2,
            exp_en: 'Each term is multiplied by 2. 24 × 2 = 48.',
            exp_fil: 'Ang bawat term ay pinarami ng 2. 24 × 2 = 48.',
          },
        ],
      },
    },

    'clerical': {
      'filing-coding': {
        topicName: 'Filing and Coding',
        questions: [
          {
            stem: 'Records are arranged alphabetically. Which comes first: Santos, Cruz, Reyes, Garcia?',
            choices: [{ id:'a', text:'Santos' }, { id:'b', text:'Cruz' }, { id:'c', text:'Garcia' }, { id:'d', text:'Reyes' }],
            correct: 'b', diff: 1,
            exp_en: 'Alphabetical order: Cruz (C), Garcia (G), Reyes (R), Santos (S). Cruz comes first.',
            exp_fil: 'Ayon sa alpabeto: Cruz (C), Garcia (G), Reyes (R), Santos (S). Si Cruz ang una.',
          },
          {
            stem: 'If "A=1, B=2, C=3…" what is the code for "CAB"?',
            choices: [{ id:'a', text:'3-1-2' }, { id:'b', text:'1-2-3' }, { id:'c', text:'3-2-1' }, { id:'d', text:'2-1-3' }],
            correct: 'a', diff: 2,
            exp_en: 'C=3, A=1, B=2. So CAB = 3-1-2.',
            exp_fil: 'C=3, A=1, B=2. Kaya ang CAB = 3-1-2.',
          },
          {
            stem: 'A clerk needs to file documents by date, oldest first. Which set is correct?',
            choices: [
              { id:'a', text:'March 5, March 10, March 1' },
              { id:'b', text:'March 1, March 5, March 10' },
              { id:'c', text:'March 10, March 5, March 1' },
              { id:'d', text:'March 5, March 1, March 10' },
            ],
            correct: 'b', diff: 1,
            exp_en: 'Chronological order (oldest first): March 1, March 5, March 10.',
            exp_fil: 'Ayon sa petsa (pinakamatanda muna): Marso 1, Marso 5, Marso 10.',
          },
          {
            stem: 'Which filing system arranges records by subject or topic?',
            choices: [{ id:'a', text:'Alphabetical' }, { id:'b', text:'Numerical' }, { id:'c', text:'Subject filing' }, { id:'d', text:'Geographic' }],
            correct: 'c', diff: 2,
            exp_en: 'Subject filing arranges documents by topic or subject matter (e.g., "HR", "Finance", "Legal").',
            exp_fil: 'Ang subject filing ay nag-aayos ng mga dokumento ayon sa paksa o kategorya (hal. "HR", "Finance", "Legal").',
          },
          {
            stem: 'A numeric filing system assigns ___.',
            choices: [{ id:'a', text:'Names in alphabetical order' }, { id:'b', text:'Geographic locations' }, { id:'c', text:'Numbers to files' }, { id:'d', text:'Colors to folders' }],
            correct: 'c', diff: 1,
            exp_en: 'A numeric filing system assigns a unique number to each file, making records easy to locate by reference number.',
            exp_fil: 'Ang numeric filing system ay nagbibigay ng natatanging numero sa bawat file para madaling mahanap.',
          },
        ],
      },
      'data-checking': {
        topicName: 'Data Checking and Verification',
        questions: [
          {
            stem: 'A form shows "Date of Birth: 32/01/2000." What is the error?',
            choices: [{ id:'a', text:'The year is wrong' }, { id:'b', text:'The day is invalid (no 32nd day)' }, { id:'c', text:'The month is wrong' }, { id:'d', text:'No error' }],
            correct: 'b', diff: 1,
            exp_en: 'No month has 32 days. The day field "32" is invalid; it should be between 1 and 31.',
            exp_fil: 'Walang buwan na may 32 na araw. Ang "32" sa araw ay hindi tama; dapat nasa pagitan ng 1 at 31.',
          },
          {
            stem: 'Two records show the same ID number but different names. This indicates:',
            choices: [{ id:'a', text:'A data entry error' }, { id:'b', text:'Normal variation' }, { id:'c', text:'Correct duplicate' }, { id:'d', text:'Alphabetical order' }],
            correct: 'a', diff: 2,
            exp_en: 'ID numbers should be unique per person. Two records sharing the same ID with different names signals a data entry or assignment error.',
            exp_fil: 'Ang ID number ay dapat natatangi sa bawat tao. Kung magkaibang pangalan ang may parehong ID, may data entry error.',
          },
          {
            stem: 'An employee list shows salary "₱-500." What should a clerk do?',
            choices: [{ id:'a', text:'Accept it as correct' }, { id:'b', text:'Flag it for verification (negative salary is invalid)' }, { id:'c', text:'Delete the record' }, { id:'d', text:'Change it to ₱500 without informing the supervisor' }],
            correct: 'b', diff: 2,
            exp_en: 'A negative salary is invalid. The clerk should flag the record and report it for verification before making changes.',
            exp_fil: 'Ang negatibong sweldo ay hindi tama. Dapat i-flag ng clerk at iulat para ma-verify bago baguhin.',
          },
        ],
      },
    },
  },

  // ── PNLE ────────────────────────────────────────────────────────────────────

  'pnle': {

    'community': {
      'primary-health-care': {
        topicName: null, // existing topic
        questions: [
          {
            stem: 'Which element is the cornerstone of Primary Health Care (PHC)?',
            choices: [{ id:'a', text:'Specialist services' }, { id:'b', text:'Community participation' }, { id:'c', text:'Hospital care' }, { id:'d', text:'Technology' }],
            correct: 'b', diff: 2,
            exp_en: 'Community participation is the cornerstone of PHC. Communities must be actively involved in identifying needs and implementing health programs.',
            exp_fil: 'Ang paglahok ng komunidad (community participation) ang pangunahing haligi ng PHC. Aktibo dapat ang komunidad sa pagkilala ng pangangailangan at pagpapatupad ng mga programa.',
          },
          {
            stem: 'The "Health for All" goal was set by WHO in:',
            choices: [{ id:'a', text:'1977 — Alma Ata' }, { id:'b', text:'1978 — Alma Ata Declaration' }, { id:'c', text:'1980 — Ottawa Charter' }, { id:'d', text:'1986 — Jakarta Declaration' }],
            correct: 'b', diff: 3,
            exp_en: 'The Alma Ata Declaration of 1978 set the goal of "Health for All by the Year 2000" and established PHC as the key approach.',
            exp_fil: 'Ang Deklarasyon ng Alma Ata noong 1978 ang nagtatag ng layuning "Kalusugan para sa Lahat" at itinuring ang PHC bilang pangunahing diskarte.',
          },
          {
            stem: 'Oral rehydration therapy (ORT) is primarily used to treat:',
            choices: [{ id:'a', text:'Pneumonia' }, { id:'b', text:'Malnutrition' }, { id:'c', text:'Dehydration from diarrhea' }, { id:'d', text:'Fever' }],
            correct: 'c', diff: 2,
            exp_en: 'ORT replaces fluids and electrolytes lost during diarrhea. It is the first-line treatment for dehydration caused by acute diarrhea, especially in children.',
            exp_fil: 'Ang ORT ay nagpapalit ng likido at electrolytes na nawawala sa panahon ng diarrhea. Ito ang unang linya ng paggamot para sa dehydration.',
          },
          {
            stem: 'A 6-month-old infant should receive which vaccine according to the Philippine EPI?',
            choices: [{ id:'a', text:'MMR' }, { id:'b', text:'BCG only' }, { id:'c', text:'DPT and OPV (3rd dose)' }, { id:'d', text:'Hepatitis B booster only' }],
            correct: 'c', diff: 3,
            exp_en: 'At 6 months, the child receives the 3rd doses of DPT (Diphtheria-Pertussis-Tetanus) and OPV (Oral Polio Vaccine) under the Philippine EPI schedule.',
            exp_fil: 'Sa ika-6 na buwan, ang bata ay tumatanggap ng ika-3 dosis ng DPT at OPV ayon sa schedule ng Philippine EPI.',
          },
          {
            stem: 'Family planning falls under which level of prevention?',
            choices: [{ id:'a', text:'Tertiary' }, { id:'b', text:'Secondary' }, { id:'c', text:'Primary' }, { id:'d', text:'None of the above' }],
            correct: 'c', diff: 2,
            exp_en: 'Family planning is primary prevention — it prevents unintended pregnancies and promotes healthy spacing of births before problems occur.',
            exp_fil: 'Ang family planning ay pangunahing pag-iwas (primary prevention) — pinipigilan ang hindi gustong pagbubuntis at nagtataguyod ng maayos na pagitan ng mga panganganak.',
          },
          {
            stem: 'The nurse teaches a mother to check for danger signs in a sick child. This is an example of:',
            choices: [{ id:'a', text:'Curative care' }, { id:'b', text:'Rehabilitative care' }, { id:'c', text:'Preventive care' }, { id:'d', text:'Promotive care' }],
            correct: 'c', diff: 2,
            exp_en: 'Teaching mothers to recognize danger signs is preventive care — it enables early detection and prevents worsening of conditions.',
            exp_fil: 'Ang pagtuturo sa mga ina ng mga palatandaan ng panganib ay preventive care — nagbibigay-daan sa maagang pagtuklas at pag-iwas sa paglaala ng kalagayan.',
          },
          {
            stem: 'What is the normal respiratory rate for a healthy adult at rest?',
            choices: [{ id:'a', text:'8–12 breaths/min' }, { id:'b', text:'12–20 breaths/min' }, { id:'c', text:'20–30 breaths/min' }, { id:'d', text:'30–40 breaths/min' }],
            correct: 'b', diff: 2,
            exp_en: 'The normal respiratory rate for a healthy adult at rest is 12–20 breaths per minute. Above 20 may indicate tachypnea.',
            exp_fil: 'Ang normal na bilis ng paghinga para sa malusog na matatanda ay 12–20 beses bawat minuto. Higit sa 20 ay maaaring tachypnea.',
          },
          {
            stem: 'IMCI stands for:',
            choices: [
              { id:'a', text:'Integrated Management of Childhood Illness' },
              { id:'b', text:'Immediate Medical Care for Infants' },
              { id:'c', text:'Integrated Maternal and Child Immunization' },
              { id:'d', text:'International Maternal Care Initiative' },
            ],
            correct: 'a', diff: 2,
            exp_en: 'IMCI (Integrated Management of Childhood Illness) is a WHO/UNICEF strategy for child health that addresses leading causes of childhood death and illness.',
            exp_fil: 'Ang IMCI (Integrated Management of Childhood Illness) ay estratehiya ng WHO/UNICEF para sa kalusugan ng bata na tumutugon sa nangungunang dahilan ng pagkamatay at sakit ng bata.',
          },
          {
            stem: 'Breastfeeding should be initiated within ___ after delivery.',
            choices: [{ id:'a', text:'30 minutes' }, { id:'b', text:'1 hour' }, { id:'c', text:'2 hours' }, { id:'d', text:'4 hours' }],
            correct: 'b', diff: 2,
            exp_en: 'WHO recommends initiating breastfeeding within 1 hour of birth to ensure the baby receives colostrum and to establish milk supply.',
            exp_fil: 'Inirerekomenda ng WHO na simulan ang pagpapasuso sa loob ng 1 oras pagkatapos ng panganganak para matiyak na matatanggap ng sanggol ang colostrum.',
          },
          {
            stem: 'Schistosomiasis is caused by a:',
            choices: [{ id:'a', text:'Bacterium' }, { id:'b', text:'Virus' }, { id:'c', text:'Parasite (blood fluke)' }, { id:'d', text:'Fungus' }],
            correct: 'c', diff: 3,
            exp_en: 'Schistosomiasis is caused by parasitic blood flukes (Schistosoma japonicum in the Philippines). It is transmitted through contact with contaminated freshwater.',
            exp_fil: 'Ang schistosomiasis ay sanhi ng mga parasitikong dugo-uod (blood fluke) — Schistosoma japonicum sa Pilipinas. Nakukuha ito sa pakikipag-ugnayan sa naparuming tabang-tubig.',
          },
        ],
      },
    },

  },

  // ── LET Elementary ──────────────────────────────────────────────────────────

  'let-elementary': {

    'gened': {
      'english-gened-elem': {
        topicName: null, // existing
        questions: [
          {
            stem: 'Which of the following is a compound sentence?',
            choices: [
              { id:'a', text:'The cat slept.' },
              { id:'b', text:'The cat slept, and the dog barked.' },
              { id:'c', text:'Sleeping cats.' },
              { id:'d', text:'When the cat slept.' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'A compound sentence contains two independent clauses joined by a coordinating conjunction (FANBOYS). "The cat slept, and the dog barked" has two independent clauses joined by "and."',
            exp_fil: 'Ang compound sentence ay dalawang independent clause na pinagsama ng coordinating conjunction. "The cat slept, and the dog barked" — dalawang independent clause na pinagsama ng "and."',
          },
          {
            stem: 'Choose the sentence that uses the simple present tense correctly.',
            choices: [
              { id:'a', text:'She will run every day.' },
              { id:'b', text:'She ran every day.' },
              { id:'c', text:'She runs every day.' },
              { id:'d', text:'She is running every day.' },
            ],
            correct: 'c', diff: 1,
            exp_en: 'Simple present tense describes habitual actions. With a third-person singular subject (she), add "-s": "She runs every day."',
            exp_fil: 'Ang simple present tense ay para sa mga ugaling gawi. Sa third-person singular (she), dagdag ang "-s": "She runs every day."',
          },
          {
            stem: 'The primary purpose of a topic sentence in a paragraph is to:',
            choices: [
              { id:'a', text:'Support the main idea with evidence' },
              { id:'b', text:'State the main idea of the paragraph' },
              { id:'c', text:'Provide a conclusion' },
              { id:'d', text:'List supporting details' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'A topic sentence states the main idea (or controlling idea) of a paragraph. All other sentences in the paragraph support the topic sentence.',
            exp_fil: 'Ang topic sentence ay nagpapahayag ng pangunahing ideya ng isang talata. Lahat ng iba pang pangungusap ay sumusuporta dito.',
          },
          {
            stem: 'Which word is a proper adjective in: "I love Filipino food"?',
            choices: [{ id:'a', text:'love' }, { id:'b', text:'food' }, { id:'c', text:'Filipino' }, { id:'d', text:'I' }],
            correct: 'c', diff: 2,
            exp_en: '"Filipino" is a proper adjective — it is derived from a proper noun (Philippines) and describes the noun "food." Proper adjectives are always capitalized.',
            exp_fil: '"Filipino" ay isang proper adjective — galing sa proper noun (Philippines) at naglalarawan sa "food." Ang proper adjective ay laging may malaking titik.',
          },
          {
            stem: 'In the sentence "Maria, who is a nurse, works at PGH," the clause "who is a nurse" is:',
            choices: [
              { id:'a', text:'An adverbial clause' },
              { id:'b', text:'A noun clause' },
              { id:'c', text:'A relative/adjective clause' },
              { id:'d', text:'An independent clause' },
            ],
            correct: 'c', diff: 3,
            exp_en: '"Who is a nurse" is a relative (adjective) clause — it begins with a relative pronoun (who) and modifies the noun "Maria."',
            exp_fil: '"Who is a nurse" ay isang relative (adjective) clause — nagsisimula sa relative pronoun (who) at nagpapaliwanag ng pangngalang "Maria."',
          },
          {
            stem: 'Which literary device is used in "The wind whispered through the trees"?',
            choices: [{ id:'a', text:'Simile' }, { id:'b', text:'Personification' }, { id:'c', text:'Hyperbole' }, { id:'d', text:'Metaphor' }],
            correct: 'b', diff: 2,
            exp_en: 'Personification gives human qualities to non-human things. "Whispered" is a human action attributed to the wind.',
            exp_fil: 'Ang personification ay nagbibigay ng katangiang pantao sa mga bagay. Ang "whispered" ay kilos ng tao na inilapat sa hangin.',
          },
          {
            stem: 'The story of José Rizal sacrificing himself for the Philippines is best described as a:',
            choices: [{ id:'a', text:'Fable' }, { id:'b', text:'Myth' }, { id:'c', text:'Historical narrative' }, { id:'d', text:'Fairy tale' }],
            correct: 'c', diff: 2,
            exp_en: 'A historical narrative recounts actual past events based on documented facts. Rizal\'s story is supported by historical evidence.',
            exp_fil: 'Ang historical narrative ay nagkukuwento ng tunay na nakalipas na pangyayari batay sa mga nakatala. Ang kwento ni Rizal ay suportado ng makasaysayang katibayan.',
          },
          {
            stem: 'What is the correct plural form of "curriculum"?',
            choices: [{ id:'a', text:'Curriculums' }, { id:'b', text:'Curriculae' }, { id:'c', text:'Curricula' }, { id:'d', text:'Curriculum\'s' }],
            correct: 'c', diff: 3,
            exp_en: '"Curriculum" has a Latin origin. Its classical plural is "curricula." "Curriculums" is also accepted in modern English but "curricula" is the preferred form in academic contexts.',
            exp_fil: 'Ang "curriculum" ay may pinagmulan sa Latin. Ang klasikal na plural nito ay "curricula." Ito ang mas ginagamit sa akademikong konteksto.',
          },
          {
            stem: 'Which of the following is an example of a gerund?',
            choices: [
              { id:'a', text:'Running fast (as in "He is running fast")' },
              { id:'b', text:'Running is good exercise.' },
              { id:'c', text:'He ran fast.' },
              { id:'d', text:'Run fast!' },
            ],
            correct: 'b', diff: 3,
            exp_en: 'A gerund is a verb form ending in "-ing" that functions as a noun. In "Running is good exercise," "Running" is the subject (functioning as a noun), so it is a gerund.',
            exp_fil: 'Ang gerund ay anyong pandiwa na nagtatapos sa "-ing" ngunit gumagana bilang pangngalan. Sa "Running is good exercise," ang "Running" ay paksa ng pangungusap — gerund ito.',
          },
          {
            stem: 'What does "context clue" mean in reading?',
            choices: [
              { id:'a', text:'A dictionary definition of a word' },
              { id:'b', text:'Information in surrounding text that helps determine word meaning' },
              { id:'c', text:'A note from the author' },
              { id:'d', text:'A grammar rule' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'Context clues are hints found in surrounding sentences that help readers figure out the meaning of an unfamiliar word without a dictionary.',
            exp_fil: 'Ang context clue ay mga pahiwatig na matatagpuan sa paligid ng isang salita sa teksto na tumutulong sa mambabasa na maunawaan ang kahulugan ng hindi pamilyar na salita.',
          },
        ],
      },
    },

    'prof-ed': {
      'assessment-elem': {
        topicName: 'Assessment and Evaluation',
        questions: [
          {
            stem: 'Which type of assessment is given BEFORE instruction to find out what students already know?',
            choices: [{ id:'a', text:'Summative' }, { id:'b', text:'Formative' }, { id:'c', text:'Diagnostic' }, { id:'d', text:'Performance' }],
            correct: 'c', diff: 2,
            exp_en: 'Diagnostic assessment is given before instruction to identify prior knowledge and learning gaps. It helps teachers plan appropriate lessons.',
            exp_fil: 'Ang diagnostic assessment ay ibinibigay bago ang pagtuturo para malaman ang kaalaman ng mga mag-aaral at ang mga kakulangan sa pag-aaral.',
          },
          {
            stem: 'A teacher gives a quiz after each lesson to adjust teaching. This is:',
            choices: [{ id:'a', text:'Summative assessment' }, { id:'b', text:'Formative assessment' }, { id:'c', text:'Placement test' }, { id:'d', text:'Norm-referenced test' }],
            correct: 'b', diff: 2,
            exp_en: 'Formative assessment is ongoing assessment during instruction used to monitor learning and adjust teaching. Quizzes given after each lesson are formative.',
            exp_fil: 'Ang formative assessment ay patuloy na pagtatasa sa panahon ng pagtuturo para subaybayan ang pag-aaral at ayusin ang pagtuturo.',
          },
          {
            stem: 'Which learning objective is written in SMART format?',
            choices: [
              { id:'a', text:'Students will understand mathematics.' },
              { id:'b', text:'Students will solve 10 two-digit multiplication problems with 80% accuracy by Friday.' },
              { id:'c', text:'Students will learn about history.' },
              { id:'d', text:'Students will appreciate literature.' },
            ],
            correct: 'b', diff: 3,
            exp_en: 'SMART objectives are Specific, Measurable, Achievable, Relevant, and Time-bound. Option B specifies the task (solve multiplication), the criterion (80% accuracy), and the timeframe (by Friday).',
            exp_fil: 'Ang SMART na layunin ay tiyak (Specific), nasusukat (Measurable), makakamit (Achievable), may kaugnayan (Relevant), at may takdang panahon (Time-bound). Ang B ay nagtatakda ng gawain, pamantayan, at panahon.',
          },
          {
            stem: 'A test that compares a student\'s performance to other students is called:',
            choices: [{ id:'a', text:'Criterion-referenced' }, { id:'b', text:'Norm-referenced' }, { id:'c', text:'Performance-based' }, { id:'d', text:'Portfolio assessment' }],
            correct: 'b', diff: 2,
            exp_en: 'Norm-referenced tests compare individual performance to a normative group. IQ tests and standardized aptitude tests are norm-referenced.',
            exp_fil: 'Ang norm-referenced test ay naghahambing ng pagganap ng isang indibidwal sa grupong pamantayan (normative group). Ang IQ tests ay norm-referenced.',
          },
          {
            stem: 'Bloom\'s Taxonomy is primarily used to:',
            choices: [
              { id:'a', text:'Classify students by ability level' },
              { id:'b', text:'Rank schools by performance' },
              { id:'c', text:'Write learning objectives at different cognitive levels' },
              { id:'d', text:'Measure physical development' },
            ],
            correct: 'c', diff: 2,
            exp_en: 'Bloom\'s Taxonomy classifies educational objectives into cognitive levels — from lower-order (Remembering, Understanding) to higher-order (Analyzing, Evaluating, Creating).',
            exp_fil: 'Ginagamit ang Bloom\'s Taxonomy para magsulat ng mga layuning pang-edukasyon sa iba\'t ibang antas ng kaisipan — mula mababa (Pagtatanda, Pag-unawa) hanggang mataas na antas (Pagsusuri, Pagtataya, Paglikha).',
          },
        ],
      },
      'curriculum-elem': {
        topicName: 'Curriculum Development',
        questions: [
          {
            stem: 'The K to 12 curriculum in the Philippines added how many years to basic education?',
            choices: [{ id:'a', text:'1 year' }, { id:'b', text:'2 years' }, { id:'c', text:'3 years' }, { id:'d', text:'4 years' }],
            correct: 'b', diff: 1,
            exp_en: 'Republic Act 10533 (Enhanced Basic Education Act of 2013) added 2 years (Grades 11 and 12 — Senior High School) to the basic education cycle.',
            exp_fil: 'Ang Republic Act 10533 ay nagdagdag ng 2 taon (Grade 11 at 12 — Senior High School) sa pangunahing edukasyon.',
          },
          {
            stem: 'In curriculum design, the Tyler Rationale asks: "What educational purposes should the school seek to attain?" This is about:',
            choices: [{ id:'a', text:'Learning experiences' }, { id:'b', text:'Educational objectives' }, { id:'c', text:'Evaluation' }, { id:'d', text:'Organization' }],
            correct: 'b', diff: 3,
            exp_en: 'Ralph Tyler\'s four curriculum questions begin with educational objectives (purposes). The other three are: what experiences, how to organize, and how to evaluate.',
            exp_fil: 'Ang unang tanong ni Tyler ay tungkol sa mga layuning pang-edukasyon (objectives/purposes). Ang tatlo pa ay: anong mga karanasan, paano mag-organisa, at paano magtataya.',
          },
          {
            stem: 'Spiral curriculum means:',
            choices: [
              { id:'a', text:'Teaching one subject at a time' },
              { id:'b', text:'Topics are revisited with increasing depth and complexity across grade levels' },
              { id:'c', text:'Students learn at their own pace' },
              { id:'d', text:'The curriculum is arranged from simple to complex in one grade only' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'The spiral curriculum (Bruner) revisits topics across grade levels with increasing complexity, building on prior knowledge each time.',
            exp_fil: 'Ang spiral curriculum (ni Bruner) ay paulit-ulit na tinutukoy ang mga paksa sa iba\'t ibang antas ng pag-aaral, na nagpapalalalim sa bawat pagkakataon.',
          },
          {
            stem: 'The "hidden curriculum" refers to:',
            choices: [
              { id:'a', text:'The official school syllabus' },
              { id:'b', text:'Unwritten norms, values, and behaviors students learn at school' },
              { id:'c', text:'Extra-curricular activities' },
              { id:'d', text:'Government-mandated subjects' },
            ],
            correct: 'b', diff: 3,
            exp_en: 'The hidden curriculum includes the implicit lessons about values, norms, and expectations that students learn through school culture, routines, and interactions — not formally taught.',
            exp_fil: 'Ang hidden curriculum ay ang mga implikasyon ng mga halaga, pamantayan, at pag-uugali na natututo ang mga mag-aaral sa pamamagitan ng kultura at gawi ng paaralan — hindi itinuro nang pormal.',
          },
          {
            stem: 'Which approach integrates multiple subject areas around a central theme?',
            choices: [{ id:'a', text:'Subject-centered curriculum' }, { id:'b', text:'Integrated/thematic curriculum' }, { id:'c', text:'Core curriculum' }, { id:'d', text:'Activity-based curriculum' }],
            correct: 'b', diff: 2,
            exp_en: 'An integrated or thematic curriculum organizes learning around a central theme, connecting multiple subject areas. For example, a theme of "Water" covers science, social studies, language, and math.',
            exp_fil: 'Ang integrated o thematic curriculum ay nag-oorganisa ng pag-aaral sa paligid ng isang tema, na nagtatali ng iba\'t ibang asignatura. Halimbawa: tema ng "Tubig" na sumasaklaw sa agham, araling panlipunan, wika, at matematika.',
          },
        ],
      },
    },
  },

  // ── LET Secondary ───────────────────────────────────────────────────────────

  'let-secondary': {

    'gened': {
      'english-gened-sec': {
        topicName: null, // existing
        questions: [
          {
            stem: 'Which sentence demonstrates passive voice?',
            choices: [
              { id:'a', text:'The teacher graded the papers.' },
              { id:'b', text:'The papers were graded by the teacher.' },
              { id:'c', text:'The teacher is grading the papers.' },
              { id:'d', text:'Grade the papers!' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'In passive voice, the subject receives the action. "The papers were graded" — the papers (subject) received the action "graded."',
            exp_fil: 'Sa passive voice, ang paksa ay tatanggap ng kilos. "The papers were graded" — ang mga papel (paksa) ang tinanggap ng kilos na "graded."',
          },
          {
            stem: 'A thesis statement in an essay should:',
            choices: [
              { id:'a', text:'List all supporting details' },
              { id:'b', text:'State a broad general topic' },
              { id:'c', text:'Present the main argument or claim of the essay' },
              { id:'d', text:'Summarize the conclusion only' },
            ],
            correct: 'c', diff: 2,
            exp_en: 'A thesis statement presents the main claim or central argument of an essay. It guides the reader on what the essay will discuss and defend.',
            exp_fil: 'Ang thesis statement ay nagpapahayag ng pangunahing argumento o pahayag ng isang sanaysay. Ginagabayan nito ang mambabasa sa kung ano ang tatalakayin at ipapalaban ng sanaysay.',
          },
          {
            stem: 'The root word "aud" (as in audible, audience) means:',
            choices: [{ id:'a', text:'See' }, { id:'b', text:'Hear' }, { id:'c', text:'Write' }, { id:'d', text:'Speak' }],
            correct: 'b', diff: 2,
            exp_en: 'The Latin root "aud" means to hear. "Audible" = able to be heard; "audience" = a group that hears/watches.',
            exp_fil: 'Ang Latin root na "aud" ay nangangahulugang makinig. "Audible" = maririnig; "audience" = isang grupo na nakikinig/nanonood.',
          },
          {
            stem: 'An allusion in a text refers to:',
            choices: [
              { id:'a', text:'A direct quotation from a source' },
              { id:'b', text:'An indirect reference to a well-known person, event, or work' },
              { id:'c', text:'A comparison using "like" or "as"' },
              { id:'d', text:'A figure of speech that exaggerates' },
            ],
            correct: 'b', diff: 3,
            exp_en: 'An allusion is an indirect reference to a historical, cultural, mythological, or literary figure or event without fully explaining it. E.g., "She was his Achilles\' heel."',
            exp_fil: 'Ang allusion ay hindi direktang sanggunian sa isang kilalang tao, pangyayari, o akda nang hindi ito ganap na ipinaliwanag. Halimbawa: "Siya ang kaniyang Achilles\' heel."',
          },
          {
            stem: 'Which is an example of irony?',
            choices: [
              { id:'a', text:'The sky is blue.' },
              { id:'b', text:'A fire station burns down.' },
              { id:'c', text:'She sings beautifully.' },
              { id:'d', text:'The book is thick.' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'Situational irony occurs when the opposite of what is expected happens. A fire station burning down is ironic because fire stations are supposed to prevent fires.',
            exp_fil: 'Ang situational irony ay nangyayari kapag ang kabaligtaran ng inaasahan ay nangyari. Ang isang fire station na nasusunog ay ironic dahil ang fire station ay dapat na nagpoprotekta laban sa sunog.',
          },
          {
            stem: 'In critical reading, the purpose of identifying the author\'s bias is to:',
            choices: [
              { id:'a', text:'Reject the text entirely' },
              { id:'b', text:'Copy the author\'s point of view' },
              { id:'c', text:'Evaluate the reliability and objectivity of the text' },
              { id:'d', text:'Find grammar errors' },
            ],
            correct: 'c', diff: 3,
            exp_en: 'Identifying the author\'s bias helps readers critically evaluate whether the text presents a balanced view or a one-sided perspective, affecting its reliability.',
            exp_fil: 'Ang pag-kikilala ng pagkiling ng may-akda ay tumutulong sa mambabasa na kritikal na suriin kung ang teksto ay nagpapakita ng balanseng pananaw o isang-panig na pananaw.',
          },
          {
            stem: 'Which sentence is punctuated correctly?',
            choices: [
              { id:'a', text:'However I disagree with you.' },
              { id:'b', text:'However, I disagree with you.' },
              { id:'c', text:'However; I disagree with you.' },
              { id:'d', text:'However I disagree, with you.' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'When a conjunctive adverb (however, therefore, nevertheless) begins a sentence, it is followed by a comma.',
            exp_fil: 'Kapag ang conjunctive adverb (however, therefore, nevertheless) ay nagsisimula ng pangungusap, sinusundan ito ng kuwit.',
          },
          {
            stem: 'Which organizational pattern arranges events in the order they occurred?',
            choices: [{ id:'a', text:'Cause and effect' }, { id:'b', text:'Comparison/contrast' }, { id:'c', text:'Chronological order' }, { id:'d', text:'Problem-solution' }],
            correct: 'c', diff: 1,
            exp_en: 'Chronological order arranges information in time sequence — from first to last, or earliest to most recent.',
            exp_fil: 'Ang chronological order ay nag-aayos ng impormasyon ayon sa pagkakasunod ng oras — mula una hanggang huli, o mula pinakamatanda hanggang pinakabago.',
          },
          {
            stem: 'What is the function of a conjunction in a sentence?',
            choices: [
              { id:'a', text:'Names a person, place, or thing' },
              { id:'b', text:'Describes a noun' },
              { id:'c', text:'Joins words, phrases, or clauses' },
              { id:'d', text:'Shows action or state of being' },
            ],
            correct: 'c', diff: 1,
            exp_en: 'Conjunctions join words, phrases, or clauses. Coordinating conjunctions (FANBOYS: for, and, nor, but, or, yet, so) connect equal grammatical units.',
            exp_fil: 'Ang conjunction ay nag-uugnay ng mga salita, parirala, o sugnay. Ang coordinating conjunctions (FANBOYS) ay nagkokonekta ng pantay na bahagi ng balarila.',
          },
          {
            stem: 'The Latin phrase "et al." in academic writing means:',
            choices: [{ id:'a', text:'And others' }, { id:'b', text:'For example' }, { id:'c', text:'That is' }, { id:'d', text:'Note well' }],
            correct: 'a', diff: 2,
            exp_en: '"Et al." is an abbreviation of "et alia" (Latin for "and others"). It is used in citations when a work has multiple authors.',
            exp_fil: '"Et al." ay abbreviation ng "et alia" (Latin na "at iba pa"). Ginagamit ito sa mga citation kapag maraming may-akda ang isang akda.',
          },
        ],
      },
    },

    'prof-ed': {
      'teaching-strategies': {
        topicName: 'Teaching Strategies and Methods',
        questions: [
          {
            stem: 'Which method encourages students to discover concepts through guided exploration?',
            choices: [{ id:'a', text:'Direct instruction' }, { id:'b', text:'Inquiry-based learning' }, { id:'c', text:'Lecture method' }, { id:'d', text:'Drill and practice' }],
            correct: 'b', diff: 2,
            exp_en: 'Inquiry-based learning involves students asking questions, investigating, and discovering concepts through exploration and problem-solving rather than passive reception.',
            exp_fil: 'Ang inquiry-based learning ay nagpapalahok sa mga mag-aaral na magtanong, mag-imbestiga, at matuklasan ang mga konsepto sa pamamagitan ng pagsisiyasat at paglutas ng problema.',
          },
          {
            stem: 'Zone of Proximal Development (ZPD) was proposed by:',
            choices: [{ id:'a', text:'Jean Piaget' }, { id:'b', text:'Lev Vygotsky' }, { id:'c', text:'Jerome Bruner' }, { id:'d', text:'Benjamin Bloom' }],
            correct: 'b', diff: 2,
            exp_en: 'Lev Vygotsky introduced the ZPD — the gap between what a learner can do independently and what they can do with guidance. Scaffolding supports learning within the ZPD.',
            exp_fil: 'Si Lev Vygotsky ang nagpakilala ng ZPD — ang agwat sa pagitan ng magagawa ng isang mag-aaral nang mag-isa at kung ano ang magagawa niya sa tulong ng ibang tao.',
          },
          {
            stem: 'Cooperative learning is best characterized by:',
            choices: [
              { id:'a', text:'Students working alone on individual tasks' },
              { id:'b', text:'Students working in groups with shared goals and individual accountability' },
              { id:'c', text:'The teacher delivering information to passive students' },
              { id:'d', text:'Students competing for ranks' },
            ],
            correct: 'b', diff: 2,
            exp_en: 'Cooperative learning involves students working in structured groups toward shared goals, with each member accountable for individual and group success.',
            exp_fil: 'Ang cooperative learning ay nagpapalahok sa mga mag-aaral na magtrabaho sa mga istrukturadong grupo para sa mga naka-isang layunin, na ang bawat miyembro ay may responsibilidad para sa tagumpay ng indibidwal at grupo.',
          },
          {
            stem: 'Which learning theory emphasizes that learning occurs through observation and imitation?',
            choices: [{ id:'a', text:'Behaviorism' }, { id:'b', text:'Constructivism' }, { id:'c', text:'Social learning theory' }, { id:'d', text:'Cognitivism' }],
            correct: 'c', diff: 2,
            exp_en: 'Bandura\'s Social Learning Theory states that people learn by observing others\' behaviors and their consequences (observational learning/modeling).',
            exp_fil: 'Ang Social Learning Theory ni Bandura ay nagsasabi na natututo ang mga tao sa pamamagitan ng pagmamasid sa pag-uugali ng iba at ng mga kahihinatnan nito.',
          },
          {
            stem: 'A teacher provides "think time" after asking a question. This is called:',
            choices: [{ id:'a', text:'Cold calling' }, { id:'b', text:'Wait time' }, { id:'c', text:'Think-pair-share' }, { id:'d', text:'Scaffolding' }],
            correct: 'b', diff: 2,
            exp_en: 'Wait time (also called "think time") is the pause a teacher allows after asking a question — giving students time to process and formulate responses, leading to higher-quality answers.',
            exp_fil: 'Ang wait time ay ang pagpapahintulot ng guro sa mga mag-aaral na mag-isip pagkatapos ng isang tanong — nagbibigay ng oras para maproseso at mabuo ang mga sagot.',
          },
        ],
      },
    },
  },
};

// ─── helper to get topic id by slug + exam ─────────────────────────────────────

const topicIdCache = {};

async function getTopicIdBySlug(examSlug, subjectSlug, topicSlug) {
  const key = `${examSlug}|${subjectSlug}|${topicSlug}`;
  if (topicIdCache[key]) return topicIdCache[key];

  const { data, error } = await sb
    .from('topics')
    .select('id, subject_areas!inner(slug, exam_types!inner(slug))')
    .eq('slug', topicSlug)
    .eq('subject_areas.slug', subjectSlug)
    .eq('subject_areas.exam_types.slug', examSlug)
    .maybeSingle();
  if (error || !data) throw new Error(`Topic not found: ${topicSlug}/${subjectSlug}/${examSlug} — ${error?.message}`);
  topicIdCache[key] = data.id;
  return data.id;
}

// Known existing topic slugs / overrides
const EXISTING_TOPIC_SLUGS = {
  'cse-subprofessional|verbal|vocabulary':        'd32d7e74-2958-4e1e-9049-2901156a0a06',
  'let-elementary|gened|english':                  '3877345e-1219-457b-ad0e-db0125050754',
  'let-secondary|gened|english':                   '458de06f-3074-48e3-a3c5-ef91a35de48a',
  'pnle|community|primary-health-care':            '40be2829-8525-41c3-a6ca-da25c47fb076',
};

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let totalOk = 0, totalFail = 0;

  for (const [examSlug, subjects] of Object.entries(BANK)) {
    console.log(`\n🎓 ${examSlug}`);
    for (const [subjectSlug, topics] of Object.entries(subjects)) {
      for (const [localSlug, spec] of Object.entries(topics)) {
        let topicId;
        const cacheKey = `${examSlug}|${subjectSlug}|${localSlug}`;

        if (EXISTING_TOPIC_SLUGS[cacheKey]) {
          topicId = EXISTING_TOPIC_SLUGS[cacheKey];
          console.log(`  📚 ${spec.topicName ?? localSlug} [existing]`);
        } else {
          // Need to create topic
          console.log(`  📁 Creating topic: ${spec.topicName}...`);
          // Get subject area id
          const { data: sa } = await sb
            .from('subject_areas')
            .select('id, exam_types!inner(slug)')
            .eq('slug', subjectSlug)
            .eq('exam_types.slug', examSlug)
            .maybeSingle();
          if (!sa) {
            // Create subject area if missing
            const { data: et } = await sb.from('exam_types').select('id').eq('slug', examSlug).single();
            if (!et) { console.error(`    ❌ Exam type not found: ${examSlug}`); continue; }
            const { data: newSa } = await sb
              .from('subject_areas')
              .insert({ exam_type_id: et.id, slug: subjectSlug, name: subjectSlug, sort_order: 99 })
              .select('id')
              .single();
            if (!newSa) { console.error(`    ❌ Could not create subject area: ${subjectSlug}`); continue; }
            sa = newSa;
          }
          const { data: newTopic, error: tErr } = await sb
            .from('topics')
            .insert({ subject_area_id: sa.id, slug: localSlug, name: spec.topicName, sort_order: 99 })
            .select('id')
            .maybeSingle();
          if (tErr) {
            // might already exist
            const { data: existing } = await sb.from('topics').select('id').eq('subject_area_id', sa.id).eq('slug', localSlug).maybeSingle();
            if (existing) topicId = existing.id;
            else { console.error(`    ❌ ${tErr.message}`); continue; }
          } else {
            topicId = newTopic.id;
          }
        }

        const ok = await insertQuestions(topicId, spec.questions);
        totalOk += ok;
        if (ok < spec.questions.length) totalFail += spec.questions.length - ok;
        console.log(`     ✅ ${ok}/${spec.questions.length} questions inserted`);
      }
    }
  }

  console.log(`\n✅ Done: ${totalOk} inserted, ${totalFail} failed.`);
}

main().catch(console.error);
