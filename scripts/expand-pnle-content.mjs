/**
 * Expand PNLE content: add topics and questions for NP2-NP5.
 * Run: node scripts/expand-pnle-content.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing env vars'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const PNLE_ID = 'b0000001-0001-4000-8000-000000000005';
const SUBJECT_AREAS = {
  np1_community: 'd9d92e98-e928-40bb-a98e-f7b85a453d61',
  np2_maternal:  '080cce7e-722c-4cf4-bcab-e5625eab02c8',
  np3_altA:      '73fd6021-c355-4409-bda8-c0b160f72106',
  np4_altB:      '09bf2ae8-fc02-43c0-bea7-68c7e926548d',
  np5_altC:      'a2705e80-f27b-45d9-9d5e-68a4b4416313',
};

// Topics to create
const NEW_TOPICS = [
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np2_maternal,  slug: 'maternal-care',    name: 'Maternal Care & Midwifery',         sort_order: 1 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np2_maternal,  slug: 'pediatric-care',   name: 'Child Health & Pediatric Nursing',  sort_order: 2 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np3_altA,      slug: 'cardiovascular',   name: 'Cardiovascular Nursing',            sort_order: 1 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np3_altA,      slug: 'respiratory',      name: 'Respiratory Nursing',               sort_order: 2 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np4_altB,      slug: 'gastrointestinal', name: 'Gastrointestinal Nursing',          sort_order: 1 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np4_altB,      slug: 'neurological',     name: 'Neurological Nursing',              sort_order: 2 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np5_altC,      slug: 'psychiatric',      name: 'Psychiatric & Mental Health',       sort_order: 1 },
  { id: randomUUID(), subject_area_id: SUBJECT_AREAS.np5_altC,      slug: 'fundamentals',     name: 'Fundamentals of Nursing',           sort_order: 2 },
];

function q(topicId, stem, a, b, c, d, correct, en, fil) {
  return {
    id: randomUUID(),
    topic_id: topicId,
    stem,
    choices: [
      { id: 'a', text: a },
      { id: 'b', text: b },
      { id: 'c', text: c },
      { id: 'd', text: d },
    ],
    correct_choice_id: correct,
    explanation_en: en,
    explanation_fil: fil,
    difficulty: 2,
    status: 'published',
    source: 'ReviewNatin',
  };
}

function buildQuestions(topics) {
  const T = {};
  for (const t of topics) T[t.slug] = t.id;

  const qs = [];

  // ── NP2: Maternal Care ────────────────────────────────────────────
  qs.push(q(T['maternal-care'],
    'A pregnant woman is at 38 weeks AOG and reports severe headache and blurring of vision. Blood pressure is 160/110 mmHg. The PRIORITY nursing action is:',
    'Administer antihypertensive as ordered',
    'Place the patient in a dark, quiet room and notify the physician',
    'Encourage increased fluid intake',
    'Prepare for immediate cesarean delivery',
    'b',
    'Severe headache and visual disturbances with BP ≥160/110 mmHg in a pregnant woman indicate severe pre-eclampsia — a medical emergency. The PRIORITY nursing action is to protect the patient from sensory stimuli (dark, quiet room) that could trigger a seizure (eclampsia) and immediately notify the physician. Antihypertensives and delivery decisions follow physician orders.',
    'Ang matinding pananakit ng ulo at pagkalabo ng paningin na may BP ≥160/110 mmHg sa isang buntis ay nagpapahiwatig ng matinding pre-eclampsia — isang medikal na emerhensiya. Ang INUUNA na aksyon ng nars ay ang protektahan ang pasyente mula sa mga sensory stimuli (madilim, tahimik na silid) na maaaring makapagdulot ng seizure (eclampsia) at agad na abisuhan ang doktor.',
  ));

  qs.push(q(T['maternal-care'],
    'During labor, a nurse assesses the fetal heart rate (FHR) and notes a drop from 145 to 90 bpm that begins AFTER the peak of contractions. This pattern is called:',
    'Early deceleration',
    'Variable deceleration',
    'Late deceleration',
    'Acceleration',
    'c',
    'Late decelerations are FHR decreases that begin after the peak of a uterine contraction and return to baseline after the contraction ends. They indicate uteroplacental insufficiency (reduced oxygen supply to the fetus) and are considered ominous. Early decelerations (mirror the contraction) result from head compression and are benign. Variable decelerations are abrupt and due to cord compression.',
    'Ang late deceleration ay pagbaba ng FHR na nagsisimula pagkatapos ng pinakamataas na punto ng uterine contraction at bumabalik sa baseline pagkatapos ng kontraksiyon. Nagpapahiwatig ito ng uteroplacental insufficiency (nabawasan ang suplay ng oxygen sa fetus) at itinuturing na mapanganib. Ang early decelerations ay salamin ng kontraksiyon at resulta ng head compression — benign. Ang variable decelerations ay biglaan at dulot ng cord compression.',
  ));

  qs.push(q(T['maternal-care'],
    'A woman delivered a baby 30 minutes ago. The nurse assesses her uterus and finds it soft and boggy, displaced to the right. The FIRST nursing action is:',
    'Administer oxytocin as ordered',
    'Ask her to urinate or catheterize the bladder',
    'Massage the fundus vigorously',
    'Call the physician immediately',
    'b',
    'A boggy, displaced uterus (especially to the right) after delivery is most commonly caused by a full bladder pushing the uterus to the side and preventing it from contracting properly. The FIRST action is to help the patient empty her bladder (void or catheterize). Once the bladder is empty, if the uterus is still boggy, fundal massage and oxytocin follow.',
    'Ang malambot at naka-displace na uterus (lalo na sa kanan) pagkatapos ng panganganak ay kadalasang sanhi ng isang puno na pantog na nagtutulak sa uterus sa gilid at pumipigil sa tamang pag-urong nito. Ang UNA na aksyon ay ang tulungan ang pasyente na alisan ng ihi ang pantog. Kapag wala nang ihi, kung ang uterus ay malambot pa rin, sundan ng fundal massage at oxytocin.',
  ));

  qs.push(q(T['maternal-care'],
    'Which of the following is a sign of placenta previa?',
    'Painful uterine contractions with absent FHR',
    'Painless, bright red vaginal bleeding in the third trimester',
    'Sudden severe abdominal pain with board-like abdomen',
    'Hypertension and proteinuria',
    'b',
    'Placenta previa is characterized by PAINLESS, bright red vaginal bleeding in the third trimester, caused by the placenta partially or completely covering the cervical os. Abruptio placentae presents with painful bleeding and a board-like abdomen. Pre-eclampsia presents with hypertension, proteinuria, and edema — not bleeding.',
    'Ang placenta previa ay nailalarawan sa WALANG SAKIT, maliwanag na pulang pagdurugo sa ikatlong trimester, na dulot ng placenta na bahagyan o ganap na sumasaklaw sa cervical os. Ang abruptio placentae ay nagpapakita ng masakit na pagdurugo at tiyan na parang tabla. Ang pre-eclampsia ay nagpapakita ng hypertension, proteinuria, at edema — hindi pagdurugo.',
  ));

  qs.push(q(T['maternal-care'],
    'The nurse is teaching a breastfeeding mother about signs of effective latch. Which finding indicates the baby is latched correctly?',
    'The mother feels sharp pain throughout the feeding',
    'Only the nipple is inside the baby\'s mouth',
    'The baby\'s chin touches the breast and lips are flanged outward',
    'The baby feeds for only 5 minutes per breast',
    'c',
    'Signs of a correct latch include: baby\'s chin touching the breast, lips flanged (turned out) around the areola, wide open mouth, most of the areola is in the baby\'s mouth, and comfortable feeding for the mother. A correct latch should not be painful. Only the nipple in the mouth indicates an incorrect latch and will cause nipple pain and poor milk transfer.',
    'Ang mga palatandaan ng tamang latch ay: ang baba ng sanggol ay nakaabot sa dibdib, ang mga labi ay nakalabas sa paligid ng areola, malawak ang bibig, karamihan ng areola ay nasa loob ng bibig ng sanggol, at komportable ang ina sa panahon ng pagpapasuso. Ang tamang latch ay hindi dapat masakit. Kapag ang nipple lamang ang nasa bibig, ito ay maling latch at magdudulot ng sakit sa nipple at mahinang paglipat ng gatas.',
  ));

  // ── NP2: Pediatric Care ───────────────────────────────────────────
  qs.push(q(T['pediatric-care'],
    'A 3-year-old child is brought in with a high fever. The nurse should assess for signs of febrile seizures. What is the MOST COMMON age group for febrile seizures?',
    '6 months to 5 years',
    'Newborn to 6 months',
    '5 years to 10 years',
    'Adolescents',
    'a',
    'Febrile seizures occur most commonly between 6 months and 5 years of age (peak: 18 months to 2 years). They are triggered by a rapid rise in body temperature, not necessarily the height of the fever. They are generally benign and self-limiting. After the seizure, the priority is airway management and fever reduction.',
    'Ang febrile seizures ay pinaka-karaniwan sa pagitan ng 6 na buwan at 5 taon ng edad (peak: 18 buwan hanggang 2 taon). Sila ay nati-trigger ng mabilis na pagtaas ng temperatura ng katawan, hindi kinakailangan ang taas ng lagnat. Sila ay karaniwang benign at self-limiting. Pagkatapos ng seizure, ang priyoridad ay ang pamamahala ng airway at pagbabawas ng lagnat.',
  ));

  qs.push(q(T['pediatric-care'],
    'A child with suspected epiglottitis is brought to the emergency room. Which nursing action is CONTRAINDICATED?',
    'Preparing for emergency intubation at bedside',
    'Keeping the child in an upright position',
    'Examining the throat with a tongue depressor',
    'Administering humidified oxygen',
    'c',
    'Examining the throat with a tongue depressor is CONTRAINDICATED in suspected epiglottitis because stimulating the throat can cause a laryngospasm leading to complete airway obstruction. Epiglottitis (bacterial) is a life-threatening emergency. The child should be kept calm, in an upright position, and immediate intubation equipment should be at bedside.',
    'Ang pagsusuri ng lalamunan gamit ang tongue depressor ay KONTRAINDIKASYON sa pinaghihinalaang epiglottitis dahil ang paggising ng lalamunan ay maaaring magdulot ng laryngospasm na nagdudulot ng kumpletong pag-block ng airway. Ang epiglottitis (bacterial) ay isang buhay na mapanganib na emerhensiya. Ang bata ay dapat panatilihing tahimik, nasa tuwid na posisyon, at ang kagamitan para sa agad na intubation ay dapat nasa tabi ng kama.',
  ));

  qs.push(q(T['pediatric-care'],
    'A 2-month-old infant has been diagnosed with intussusception. Which symptom is CLASSIC for this condition?',
    'Bright red blood per rectum with no pain',
    'Currant jelly stools with intermittent colicky pain',
    'Projectile vomiting after feeding',
    'Abdominal distension with absent bowel sounds',
    'b',
    '"Currant jelly" stools (blood and mucus mixed together, resembling red currant jelly) combined with intermittent, severe colicky abdominal pain is the CLASSIC presentation of intussusception — a condition where one segment of bowel telescopes into another. Projectile vomiting (especially non-bilious) after feeding is classic for pyloric stenosis.',
    '"Currant jelly" na dumi (dugo at mucus na halo-halo, kahawig ng pulang currant jelly) kasama ang intermittent, matinding kolicky na sakit sa tiyan ay ang KLASIKONG pagpapakita ng intussusception — isang kondisyon kung saan ang isang segment ng bituka ay nagtuturo sa isa pa. Ang projectile vomiting (lalo na ang non-bilious) pagkatapos ng pagkain ay klasiko para sa pyloric stenosis.',
  ));

  // ── NP3: Cardiovascular ────────────────────────────────────────────
  qs.push(q(T['cardiovascular'],
    'A patient presents with crushing chest pain radiating to the left arm, diaphoresis, and nausea. The nurse\'s PRIORITY action is:',
    'Administer sublingual nitroglycerin',
    'Perform a 12-lead ECG',
    'Obtain IV access and draw cardiac enzymes',
    'Administer aspirin 325 mg and call for an ECG immediately',
    'd',
    'The presentation is classic for acute myocardial infarction (AMI). The PRIORITY action following activation of the rapid response system is to give aspirin (antiplatelet — reduces thrombus extension) and obtain an ECG to confirm the diagnosis. Aspirin is given first because it is the most time-sensitive intervention while awaiting the ECG, which confirms STEMI vs NSTEMI and guides further management.',
    'Ang pagpapakita ay klasiko para sa acute myocardial infarction (AMI). Ang INUUNA na aksyon pagkatapos ng pag-activate ng rapid response system ay ang magbigay ng aspirin (antiplatelet — nagpapababa ng pagpapalawak ng thrombus) at magkuha ng ECG upang kumpirmahin ang diagnosis. Ang aspirin ay unang ibinibigay dahil ito ang pinaka-time-sensitive na interbensyon habang naghihintay ng ECG, na nagkukumpirma ng STEMI vs NSTEMI at gumagabay sa karagdagang pamamahala.',
  ));

  qs.push(q(T['cardiovascular'],
    'A patient with heart failure is receiving furosemide (Lasix). The nurse should monitor for which electrolyte imbalance?',
    'Hyperkalemia',
    'Hypokalemia',
    'Hypernatremia',
    'Hypermagnesemia',
    'b',
    'Furosemide is a loop diuretic that inhibits sodium-potassium-chloride reabsorption in the ascending loop of Henle. This causes loss of potassium (hypokalemia) as a side effect. Hypokalemia can cause dangerous cardiac arrhythmias, muscle weakness, and can worsen digitalis toxicity. The nurse should monitor serum K⁺ and teach the patient to eat potassium-rich foods (bananas, oranges) or take potassium supplements as ordered.',
    'Ang furosemide ay isang loop diuretic na pumipigil sa reabsorption ng sodium-potassium-chloride sa ascending loop of Henle. Nagdudulot ito ng pagkawala ng potassium (hypokalemia) bilang side effect. Ang hypokalemia ay maaaring magdulot ng mapanganib na cardiac arrhythmias, kahinaan ng kalamnan, at maaaring magpalala ng digitalis toxicity. Dapat subaybayan ng nars ang serum K⁺ at turuan ang pasyente na kumain ng mga pagkaing mayaman sa potassium (saging, dalandan) o uminom ng potassium supplements ayon sa order.',
  ));

  qs.push(q(T['cardiovascular'],
    'Which position is BEST for a patient experiencing pulmonary edema?',
    'Supine with legs elevated',
    'Trendelenburg',
    'High Fowler\'s (sitting upright, 90°)',
    'Left lateral position',
    'c',
    'High Fowler\'s position (sitting upright at 90°) allows gravity to pool fluid in the dependent areas (legs), reducing venous return to the heart and decreasing preload. This relieves the fluid accumulation in the lungs and makes breathing easier for the patient. Trendelenburg and legs-elevated positions increase venous return and would worsen pulmonary edema.',
    'Ang posisyon ng High Fowler (nakaupo nang tuwid sa 90°) ay nagpapahintulot sa gravity na iipon ang likido sa dependent na mga lugar (binti), na nagpapababa ng venous return sa puso at nagpapababa ng preload. Ito ay nagpapagaan ng akumulasyon ng likido sa mga baga at nagpapadali ng paghinga para sa pasyente. Ang Trendelenburg at posisyon na nakataas ang binti ay nagpapataas ng venous return at magpapalala ng pulmonary edema.',
  ));

  // ── NP3: Respiratory ──────────────────────────────────────────────
  qs.push(q(T['respiratory'],
    'A patient with COPD is receiving oxygen therapy. The nurse knows that oxygen flow should be kept at LOW concentrations (1-2 L/min). Why?',
    'To prevent oxygen toxicity to the lungs',
    'Because COPD patients rely on hypoxic drive to breathe',
    'To conserve oxygen supply',
    'Because high flow oxygen causes bronchospasm in COPD',
    'b',
    'In patients with chronic COPD, the normal chemoreceptor response (rising CO₂ triggering breathing) may be blunted due to chronic CO₂ retention. These patients may rely on low O₂ (hypoxic drive) to stimulate breathing. Administering high-flow oxygen can suppress this hypoxic drive, leading to respiratory depression or even apnea. Hence, O₂ is titrated to maintain SpO₂ at 88-92%.',
    'Sa mga pasyenteng may COPD, ang normal na chemoreceptor response (pagtaas ng CO₂ na nag-trigger ng paghinga) ay maaaring mapurol dahil sa matagal na pagtitipon ng CO₂. Maaaring umasa ang mga pasyenteng ito sa mababang O₂ (hypoxic drive) upang ma-stimulate ang paghinga. Ang pag-administer ng mataas na oxygen flow ay maaaring mapigilan ang hypoxic drive na ito, na nagdudulot ng respiratory depression o apnea. Kaya naman, ang O₂ ay tinatakda upang mapanatili ang SpO₂ sa 88-92%.',
  ));

  qs.push(q(T['respiratory'],
    'A patient undergoes thoracentesis. After the procedure, which complication should the nurse assess for FIRST?',
    'Infection',
    'Pneumothorax',
    'Pleural effusion recurrence',
    'Hypovolemia',
    'b',
    'Pneumothorax (air entering the pleural space) is the most common and immediately life-threatening complication of thoracentesis. The nurse should auscultate breath sounds bilaterally, monitor oxygen saturation, and watch for sudden chest pain and respiratory distress after the procedure. A post-procedure chest X-ray is typically ordered to rule out pneumothorax.',
    'Ang pneumothorax (hangin na pumapasok sa pleural space) ay ang pinaka-karaniwan at agad na buhay-mapanganib na komplikasyon ng thoracentesis. Dapat pakinggan ng nars ang mga tunog ng paghinga sa magkabilang panig, subaybayan ang oxygen saturation, at bantayan ang biglang sakit sa dibdib at respiratory distress pagkatapos ng pamamaraan. Ang post-procedure chest X-ray ay karaniwang ino-order upang ibukod ang pneumothorax.',
  ));

  // ── NP4: Gastrointestinal ─────────────────────────────────────────
  qs.push(q(T['gastrointestinal'],
    'A patient with liver cirrhosis develops asterixis (flapping tremor) and confusion. These findings suggest:',
    'Hepatorenal syndrome',
    'Portal hypertension',
    'Hepatic encephalopathy',
    'Spontaneous bacterial peritonitis',
    'c',
    'Asterixis (flapping tremor of outstretched hands) and altered mental status/confusion are hallmark signs of hepatic encephalopathy — a complication of severe liver disease where the liver cannot detoxify ammonia, leading to ammonia accumulation in the brain. Treatment includes lactulose (to promote ammonia excretion), dietary protein restriction, and rifaximin.',
    'Ang asterixis (flapping tremor ng mga palad na nakabukas) at altered mental status/kalituhan ay mga hallmark na palatandaan ng hepatic encephalopathy — isang komplikasyon ng matinding sakit sa atay kung saan hindi kayang i-detoxify ng atay ang ammonia, na nagdudulot ng akumulasyon ng ammonia sa utak. Ang paggamot ay kinabibilangan ng lactulose (upang itaguyod ang paglabas ng ammonia), dietary protein restriction, at rifaximin.',
  ));

  qs.push(q(T['gastrointestinal'],
    'A nurse is caring for a post-appendectomy patient on day 1. Which assessment finding would require IMMEDIATE notification of the surgeon?',
    'Mild incision pain rated 4/10',
    'Temperature of 37.5°C (99.5°F)',
    'Absent bowel sounds',
    'Rigid, board-like abdomen with absent bowel sounds and high fever',
    'd',
    'A rigid, board-like abdomen with absent bowel sounds and high fever in a post-appendectomy patient suggests peritonitis — inflammation of the peritoneum, likely from a ruptured anastomosis or abscess. This is a surgical emergency requiring immediate physician notification. Absent bowel sounds alone on day 1 post-op are expected (paralytic ileus). Mild pain and low-grade fever are normal post-op findings.',
    'Ang matibay, parang talong tiyan na may absent na tunog ng bituka at mataas na lagnat sa isang pasyenteng post-appendectomy ay nagmumungkahi ng peritonitis — pamamaga ng peritoneum, malamang mula sa isang nasira na anastomosis o abscess. Ito ay isang surgical na emerhensiya na nangangailangan ng agad na abiso sa doktor. Ang absent na tunog ng bituka lamang sa araw 1 post-op ay inaasahan (paralytic ileus). Ang banayad na sakit at low-grade fever ay normal na post-op na mga natuklasan.',
  ));

  qs.push(q(T['gastrointestinal'],
    'A patient with peptic ulcer disease is prescribed pantoprazole. What is the mechanism of this drug?',
    'Neutralizes stomach acid',
    'Coats the ulcer to protect it from acid',
    'Blocks H₂ receptors to reduce acid secretion',
    'Irreversibly inhibits H⁺/K⁺-ATPase (proton pump) to reduce acid production',
    'd',
    'Pantoprazole is a Proton Pump Inhibitor (PPI). It irreversibly binds to and inhibits the H⁺/K⁺-ATPase enzyme in gastric parietal cells — the "proton pump" — preventing the final step of acid secretion. PPIs are more effective than H₂ blockers for ulcer healing. Antacids neutralize acid; sucralfate coats the ulcer; H₂ blockers (ranitidine, famotidine) block histamine H₂ receptors.',
    'Ang pantoprazole ay isang Proton Pump Inhibitor (PPI). Permanenteng iniuugnay at pinipigilan nito ang H⁺/K⁺-ATPase enzyme sa gastric parietal cells — ang "proton pump" — pinipigilan ang huling hakbang ng secretion ng acid. Ang mga PPI ay mas epektibo kaysa sa H₂ blockers para sa pagpapagaling ng ulcer. Ang mga antacid ay nagpapalamon ng acid; ang sucralfate ay nagtatakip ng ulcer; ang mga H₂ blocker (ranitidine, famotidine) ay nagba-block ng histamine H₂ receptors.',
  ));

  // ── NP4: Neurological ─────────────────────────────────────────────
  qs.push(q(T['neurological'],
    'A patient is admitted with right-sided weakness and aphasia. CT scan shows no hemorrhage. The nurse prepares for thrombolytic therapy. Tissue plasminogen activator (tPA) is most effective when given within:',
    '1 hour of symptom onset',
    '3-4.5 hours of symptom onset',
    '6-8 hours of symptom onset',
    '24 hours of symptom onset',
    'b',
    'IV tPA (alteplase) is the standard thrombolytic for acute ischemic stroke, approved for use within 3-4.5 hours of symptom onset (with certain exclusion criteria). Time is brain — every minute of ischemia destroys approximately 1.9 million neurons. The "time is brain" concept underscores the importance of rapid assessment and treatment.',
    'Ang IV tPA (alteplase) ay ang pamantayang thrombolytic para sa acute ischemic stroke, na naaprubahan para gamitin sa loob ng 3-4.5 oras mula sa simula ng mga sintomas (may ilang exclusion criteria). Ang oras ay utak — bawat minuto ng ischemia ay sumisira ng halos 1.9 milyong neuron. Ang konsepto ng "time is brain" ay binibigyang-diin ang kahalagahan ng mabilis na pagtatasa at paggamot.',
  ));

  qs.push(q(T['neurological'],
    'Which assessment tool is used to measure the level of consciousness in a neurologically impaired patient?',
    'APGAR score',
    'Glasgow Coma Scale (GCS)',
    'NIHSS (National Institutes of Health Stroke Scale)',
    'AVPU scale',
    'b',
    'The Glasgow Coma Scale (GCS) is the standard tool for assessing level of consciousness. It evaluates three parameters: Eye Opening (1-4), Verbal Response (1-5), and Motor Response (1-6), for a total score of 3-15. A GCS of 8 or below indicates coma and the need for airway protection. NIHSS is used specifically for stroke severity. AVPU (Alert, Voice, Pain, Unresponsive) is a simpler rapid assessment.',
    'Ang Glasgow Coma Scale (GCS) ay ang pamantayang kasangkapan para sa pagtatasa ng antas ng kamalayan. Sinusuri nito ang tatlong parameter: Eye Opening (1-4), Verbal Response (1-5), at Motor Response (1-6), para sa kabuuang marka ng 3-15. Ang GCS na 8 o mas mababa ay nagpapahiwatig ng coma at pangangailangan ng proteksyon ng airway. Ang NIHSS ay ginagamit nang partikular para sa kalubhaan ng stroke. Ang AVPU (Alert, Voice, Pain, Unresponsive) ay isang mas simpleng mabilis na pagtatasa.',
  ));

  // ── NP5: Psychiatric ──────────────────────────────────────────────
  qs.push(q(T['psychiatric'],
    'A nurse is caring for a patient who is experiencing auditory hallucinations. The BEST initial response is:',
    '"Those voices are not real. You need to ignore them."',
    '"I don\'t hear voices, but I understand you are hearing them and it must be distressing."',
    '"What do the voices say? I\'ll listen to them too."',
    '"You need medication to stop the voices."',
    'b',
    'The therapeutic response acknowledges the patient\'s subjective experience without reinforcing the hallucination or denying the patient\'s reality. Telling the patient the voices are "not real" is invalidating and damages trust. The nurse should not pretend to hear the voices (not therapeutic) or immediately focus on medication. The goal is to establish a therapeutic relationship and reduce distress.',
    'Ang therapeutic na tugon ay nagkilala sa subjective na karanasan ng pasyente nang hindi pinapalaki ang hallucination o tinatanggihan ang katotohanan ng pasyente. Ang pagsasabi sa pasyente na ang mga tinig ay "hindi totoo" ay nagpapawalang-bisa at nakakasama sa tiwala. Hindi dapat magkunwari ang nars na maririnig din ang mga tinig (hindi therapeutic) o agad na mag-focus sa gamot. Ang layunin ay magtatag ng therapeutic na relasyon at bawasan ang distress.',
  ));

  qs.push(q(T['psychiatric'],
    'A nurse is developing a care plan for a patient with major depressive disorder. Which nursing intervention has the HIGHEST priority for a patient expressing suicidal ideation?',
    'Encourage participation in group therapy',
    'Administer antidepressants as prescribed',
    'Assess suicide risk and ensure patient safety',
    'Improve sleep hygiene and daily routine',
    'c',
    'Safety is ALWAYS the highest priority when a patient expresses suicidal ideation. The nurse must perform a thorough suicide risk assessment (intent, plan, means, timeline), implement safety measures (remove harmful objects, constant observation, safe environment), and notify the treatment team. No other intervention can be implemented effectively if the patient\'s immediate safety is not secured.',
    'Ang kaligtasan ay PALAGING ang pinakamataas na priyoridad kapag ang isang pasyente ay nagpapahayag ng suicidal na kaisipan. Dapat magsagawa ng masusing pagsusuri ng suicide risk ang nars (intensyon, plano, paraan, timeline), magpatupad ng mga safety measures (alisin ang mga mapanganib na bagay, patuloy na pagmamasid, ligtas na kapaligiran), at abisuhan ang koponan ng paggamot. Walang ibang interbensyon ang maaaring epektibong maipatupad kung ang agarang kaligtasan ng pasyente ay hindi natiyak.',
  ));

  qs.push(q(T['psychiatric'],
    'A patient taking lithium reports nausea, tremors, and thirst. The nurse checks the lithium level and finds it is 1.8 mEq/L. This indicates:',
    'Therapeutic level — no action needed',
    'Subtherapeutic level — increase dose',
    'Early toxicity — notify physician and hold next dose',
    'Severe toxicity — immediate hemodialysis',
    'c',
    'The therapeutic range for lithium is 0.6-1.2 mEq/L (some sources say 0.8-1.0 for maintenance). A level of 1.8 mEq/L with symptoms (nausea, tremors, thirst) indicates early to mild toxicity. The nurse should hold the next dose and notify the physician immediately. Levels >2.0 mEq/L indicate severe toxicity requiring hospitalization. Levels >3.0 mEq/L may require hemodialysis.',
    'Ang therapeutic na antas ng lithium ay 0.6-1.2 mEq/L (ang ilang mapagkukunan ay nagsasabi ng 0.8-1.0 para sa maintenance). Ang antas na 1.8 mEq/L na may mga sintomas (pagduduwal, panginginig, uhaw) ay nagpapahiwatig ng maagang hanggang banayad na toxicity. Dapat pigilan ng nars ang susunod na dosis at agad na abisuhan ang doktor. Ang mga antas >2.0 mEq/L ay nagpapahiwatig ng matinding toxicity na nangangailangan ng hospitalization. Ang mga antas >3.0 mEq/L ay maaaring mangailangan ng hemodialysis.',
  ));

  // ── NP5: Fundamentals ────────────────────────────────────────────
  qs.push(q(T['fundamentals'],
    'When performing nasogastric (NG) tube feeding, which action is MOST important before initiating the feeding?',
    'Warm the formula to room temperature',
    'Verify tube placement and check gastric residual',
    'Flush the tube with 60 mL of water',
    'Elevate the head of bed to 30 degrees',
    'b',
    'Before any NG tube feeding, the nurse MUST verify tube placement (X-ray is gold standard; bedside methods include aspirating gastric fluid and checking pH, or auscultating air insufflation) and check gastric residual volume. A large residual (>250-500 mL or per institution protocol) suggests delayed gastric emptying and the feeding should be held. Aspiration is the most dangerous complication of improper tube feeding.',
    'Bago ang anumang NG tube feeding, dapat KUMPIRMAHIN ng nars ang placement ng tubo (ang X-ray ay gold standard; ang mga bedside na pamamaraan ay kinabibilangan ng pag-aspirate ng gastric fluid at pagsusuri ng pH, o pag-auscultate ng air insufflation) at suriin ang dami ng gastric residual. Ang malaking residual (>250-500 mL o ayon sa protocol ng institusyon) ay nagmumungkahi ng delayed na gastric emptying at dapat ihinto ang pagpapakain. Ang aspiration ay ang pinaka-mapanganib na komplikasyon ng hindi tamang tube feeding.',
  ));

  qs.push(q(T['fundamentals'],
    'A nurse is teaching a patient about wound irrigation. Which solution is recommended for irrigating a clean wound?',
    'Hydrogen peroxide (H₂O₂)',
    'Povidone-iodine (Betadine)',
    'Normal saline (0.9% NaCl)',
    'Dakin\'s solution',
    'c',
    'Normal saline (0.9% NaCl) is the PREFERRED solution for irrigating clean wounds. It is isotonic, non-toxic to healing tissues, and does not delay wound healing. Hydrogen peroxide and povidone-iodine are cytotoxic to fibroblasts and granulation tissue and can delay healing. Dakin\'s solution (diluted sodium hypochlorite) is used for infected wounds, not clean ones.',
    'Ang normal saline (0.9% NaCl) ay ang INIREREKOMENDANG solusyon para sa pag-irrigate ng malinis na sugat. Ito ay isotonic, non-toxic sa nagagaling na mga tisyu, at hindi nagpapantala ng pagpapagaling ng sugat. Ang hydrogen peroxide at povidone-iodine ay cytotoxic sa fibroblasts at granulation tissue at maaaring maantala ang pagpapagaling. Ang Dakin\'s solution (diluted sodium hypochlorite) ay ginagamit para sa mga nahawaang sugat, hindi sa malinis na mga sugat.',
  ));

  qs.push(q(T['fundamentals'],
    'A patient is ordered heparin 5,000 units subcutaneously. When administering this injection, the nurse should:',
    'Aspirate before injecting to check for blood',
    'Massage the site vigorously after injection',
    'Use the abdomen (2 inches from umbilicus) and avoid rubbing after injection',
    'Apply ice to the site before injection to reduce bruising',
    'c',
    'For subcutaneous heparin: use the abdomen (2 inches away from the umbilicus) as the preferred site for consistent absorption. Do NOT aspirate (increases risk of tissue damage and hematoma) and do NOT massage after injection (causes bruising and alters absorption rate). Use a 25-26 gauge, 5/8-inch needle at 90°. Rotate injection sites.',
    'Para sa subcutaneous heparin: gamitin ang tiyan (2 pulgada mula sa pusod) bilang preferred na lugar para sa consistent na absorption. HUWAG mag-aspirate (nagpapataas ng panganib ng pinsala sa tisyu at hematoma) at HUWAG mag-massage pagkatapos ng injection (nagdudulot ng pasa at nagbabago ng rate ng absorption). Gumamit ng 25-26 gauge, 5/8-inch na karayom sa 90°. Mag-rotate ng mga lugar ng injection.',
  ));

  qs.push(q(T['fundamentals'],
    'The nurse is preparing to administer a blood transfusion. Before starting, the nurse should:',
    'Warm the blood to body temperature in the microwave',
    'Check the patient\'s vital signs, verify consent, and confirm blood product with another nurse at the bedside',
    'Ask the patient to sign consent while the blood is being hung',
    'Pre-medicate the patient with diphenhydramine routinely',
    'b',
    'Before any blood transfusion: (1) verify informed consent is signed; (2) check the patient\'s vital signs (baseline); (3) two nurses must verify: patient identity (name + ID band vs. blood bank tag), blood type, Rh factor, expiration date, and blood product unit number. Blood should NEVER be warmed in a microwave (use a blood warmer device). Pre-medication is only given if the patient has a prior transfusion reaction history.',
    'Bago ang anumang blood transfusion: (1) kumpirmahin na ang informed consent ay napirmahan; (2) suriin ang mga vital signs ng pasyente (baseline); (3) dalawang nars ang dapat mag-verify: pagkakakilanlan ng pasyente (pangalan + ID band laban sa blood bank tag), blood type, Rh factor, petsa ng expiration, at unit number ng blood product. Ang dugo ay HINDI DAPAT initin sa microwave (gumamit ng blood warmer device). Ang pre-medication ay ibinibigay lamang kung ang pasyente ay may kasaysayan ng naunang transfusion reaction.',
  ));

  return qs;
}

async function main() {
  // Resolve PNLE topics — use existing DB IDs, create only if missing
  console.log('Resolving PNLE topic IDs from DB...');
  const saIds = [...new Set(NEW_TOPICS.map(t => t.subject_area_id))];
  const { data: dbTopics } = await sb.from('topics').select('id, slug, subject_area_id').in('subject_area_id', saIds);

  const topicData = [];
  for (const t of NEW_TOPICS) {
    const existing = dbTopics?.find(d => d.slug === t.slug && d.subject_area_id === t.subject_area_id);
    if (existing) {
      console.log(`  ✓ ${t.slug} → ${existing.id} [existing]`);
      topicData.push({ id: existing.id, slug: t.slug });
    } else {
      const { data: ins, error: insErr } = await sb
        .from('topics')
        .insert({ subject_area_id: t.subject_area_id, slug: t.slug, name: t.name, sort_order: t.sort_order, description: null, blueprint_topic_code: null })
        .select('id, slug').single();
      if (insErr) { console.error(`  ✗ ${t.slug}:`, insErr.message); continue; }
      console.log(`  ✓ ${t.slug} → ${ins.id} [created]`);
      topicData.push({ id: ins.id, slug: t.slug });
    }
  }
  console.log(`✅ Topics ready: ${topicData.length}`);

  const questions = buildQuestions(topicData);
  console.log(`\nInserting ${questions.length} PNLE questions...`);

  let success = 0;
  let failed = 0;

  // Insert in batches of 5
  for (let i = 0; i < questions.length; i += 5) {
    const batch = questions.slice(i, i + 5);
    const { error } = await sb.from('questions').insert(batch);
    if (error) {
      console.error(`❌ Batch ${i}-${i+5}:`, error.message);
      failed += batch.length;
    } else {
      console.log(`✅ Inserted questions ${i + 1}-${Math.min(i + 5, questions.length)}`);
      success += batch.length;
    }
  }

  console.log(`\nDone: ${success} questions inserted, ${failed} failed`);
}

main().catch(console.error);
