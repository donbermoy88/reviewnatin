/**
 * CSE-18: Philippine Constitution & Government — 30 questions
 * Pro: constitution topic | Sub: phil-government topic
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_PRO = '66b572bd-cfb1-469e-84e2-bb73d33b2309'; // constitution
const TOPIC_SUB = 'deb97a8a-da6a-4175-af1d-4b4d3eb937f8'; // phil-government

const QUESTIONS = [
  {
    stem: 'The Philippine Constitution adopted in 1987 is officially known as —',
    choices: [
      { id: 'a', text: 'The Malolos Constitution' },
      { id: 'b', text: 'The Commonwealth Constitution' },
      { id: 'c', text: 'The 1987 Constitution of the Republic of the Philippines' },
      { id: 'd', text: 'The Freedom Constitution' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The current Philippine Constitution, ratified in 1987 under President Corazon Aquino, is officially called "The 1987 Constitution of the Republic of the Philippines."',
    explanation_fil: 'Ang kasalukuyang Konstitusyon ng Pilipinas, na pinagtibay noong 1987 sa ilalim ni Pangulong Corazon Aquino, ay opisyal na tinatawag na "The 1987 Constitution of the Republic of the Philippines."',
  },
  {
    stem: 'The 1987 Philippine Constitution was ratified on —',
    choices: [
      { id: 'a', text: 'February 2, 1987' },
      { id: 'b', text: 'June 12, 1987' },
      { id: 'c', text: 'July 4, 1946' },
      { id: 'd', text: 'February 25, 1987' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The 1987 Philippine Constitution was ratified by the Filipino people through a plebiscite on February 2, 1987.',
    explanation_fil: 'Ang 1987 Konstitusyon ng Pilipinas ay pinagtibay ng mga Pilipino sa pamamagitan ng plebisito noong Pebrero 2, 1987.',
  },
  {
    stem: 'The Philippine government is composed of three branches. Which of the following correctly identifies all three?',
    choices: [
      { id: 'a', text: 'Executive, Legislative, and Judicial' },
      { id: 'b', text: 'President, Senate, and House of Representatives' },
      { id: 'c', text: 'National, Local, and Regional' },
      { id: 'd', text: 'Civil, Military, and Religious' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'The Philippine government has three co-equal branches: the Executive (President), Legislative (Congress), and Judicial (Supreme Court).',
    explanation_fil: 'Ang pamahalaan ng Pilipinas ay may tatlong magkakatambal na sangay: Ehekutibo (Pangulo), Lehislatibo (Kongreso), at Hudikatura (Korte Suprema).',
  },
  {
    stem: 'Under the 1987 Constitution, who heads the Executive Branch of the Philippine government?',
    choices: [
      { id: 'a', text: 'The Chief Justice' },
      { id: 'b', text: 'The Senate President' },
      { id: 'c', text: 'The President of the Philippines' },
      { id: 'd', text: 'The Speaker of the House' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Under Article VII of the 1987 Constitution, the President of the Philippines heads the Executive Branch.',
    explanation_fil: 'Sa ilalim ng Artikulo VII ng 1987 Konstitusyon, ang Pangulo ng Pilipinas ang nangunguna sa Sangay Ehekutibo.',
  },
  {
    stem: 'The term of office of the President of the Philippines is —',
    choices: [
      { id: 'a', text: '4 years without re-election' },
      { id: 'b', text: '6 years without re-election' },
      { id: 'c', text: '6 years with one re-election' },
      { id: 'd', text: '4 years with two re-elections' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Under Section 4, Article VII of the 1987 Constitution, the President serves a single six-year term and is not eligible for re-election.',
    explanation_fil: 'Sa ilalim ng Seksyon 4, Artikulo VII ng 1987 Konstitusyon, ang Pangulo ay nagsisilbi nang anim na taon at hindi maaaring muling tumakbo.',
  },
  {
    stem: 'The Philippine Congress is composed of —',
    choices: [
      { id: 'a', text: 'Only the Senate' },
      { id: 'b', text: 'The Senate and the House of Representatives' },
      { id: 'c', text: 'The House of Representatives only' },
      { id: 'd', text: 'The Senate, House of Representatives, and Local Government Units' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Article VI of the 1987 Constitution provides that the Legislative power is vested in the Congress of the Philippines, consisting of a Senate and a House of Representatives.',
    explanation_fil: 'Ang Artikulo VI ng 1987 Konstitusyon ay nagsasaad na ang kapangyarihang pangbatas ay nasa Kongreso ng Pilipinas, na binubuo ng Senado at Kapulungan ng mga Kinatawan.',
  },
  {
    stem: 'How many senators are there in the Philippine Senate?',
    choices: [
      { id: 'a', text: '12' },
      { id: 'b', text: '24' },
      { id: 'c', text: '36' },
      { id: 'd', text: '300' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The Philippine Senate consists of 24 senators elected at large for a six-year term.',
    explanation_fil: 'Ang Senado ng Pilipinas ay binubuo ng 24 na senador na inihalal sa buong bansa para sa anim na taong termino.',
  },
  {
    stem: 'The term of office of a Philippine Senator is —',
    choices: [
      { id: 'a', text: '3 years' },
      { id: 'b', text: '4 years' },
      { id: 'c', text: '6 years' },
      { id: 'd', text: '9 years' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Under the 1987 Constitution, senators serve a six-year term with a limit of two consecutive terms.',
    explanation_fil: 'Sa ilalim ng 1987 Konstitusyon, ang mga senador ay nagsisilbi nang anim na taon, na may limitasyon ng dalawang magkakasunod na termino.',
  },
  {
    stem: 'The highest court in the Philippines is —',
    choices: [
      { id: 'a', text: 'The Court of Appeals' },
      { id: 'b', text: 'The Regional Trial Court' },
      { id: 'c', text: 'The Sandiganbayan' },
      { id: 'd', text: 'The Supreme Court' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: 'The Supreme Court is the highest court in the Philippines, composed of a Chief Justice and fourteen Associate Justices.',
    explanation_fil: 'Ang Korte Suprema ang pinakamataas na hukuman sa Pilipinas, na binubuo ng isang Punong Mahistrado at labing-apat na Kasama ng Mahistrado.',
  },
  {
    stem: 'Which article of the 1987 Philippine Constitution contains the Bill of Rights?',
    choices: [
      { id: 'a', text: 'Article II' },
      { id: 'b', text: 'Article III' },
      { id: 'c', text: 'Article IV' },
      { id: 'd', text: 'Article VI' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Article III of the 1987 Philippine Constitution is titled "Bill of Rights" and contains the fundamental rights of Filipino citizens.',
    explanation_fil: 'Ang Artikulo III ng 1987 Konstitusyon ay pinamagatang "Bill of Rights" at naglalaman ng mga pangunahing karapatan ng mga mamamayang Pilipino.',
  },
  {
    stem: 'The principle of separation of powers means —',
    choices: [
      { id: 'a', text: 'The three branches of government have equal power and do not interfere with each other.' },
      { id: 'b', text: 'Each branch of government has separate and distinct functions.' },
      { id: 'c', text: 'The President can override the decisions of the Supreme Court.' },
      { id: 'd', text: 'Congress can remove any official without due process.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Separation of powers means each branch of government (Executive, Legislative, Judicial) has separate and distinct functions to prevent concentration of power.',
    explanation_fil: 'Ang paghahating-kapangyarihan ay nangangahulugang ang bawat sangay ng pamahalaan ay may hiwalay at natatanging tungkulin upang maiwasan ang pagtitipon ng kapangyarihan sa iisang kamay.',
  },
  {
    stem: 'What is "checks and balances" in government?',
    choices: [
      { id: 'a', text: 'A system where the government checks financial records.' },
      { id: 'b', text: 'A system where each branch of government has powers to limit or check the other branches.' },
      { id: 'c', text: 'The President\'s power to approve or veto legislation.' },
      { id: 'd', text: 'The power of the Supreme Court to create laws.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Checks and balances is a system where each branch of government has powers to limit, review, and restrain the actions of the other branches.',
    explanation_fil: 'Ang checks and balances ay isang sistema kung saan ang bawat sangay ng pamahalaan ay may kapangyarihang limitahan at baguhin ang mga aksyon ng iba pang sangay.',
  },
  {
    stem: 'The right to vote in the Philippines is guaranteed under —',
    choices: [
      { id: 'a', text: 'Article V of the 1987 Constitution' },
      { id: 'b', text: 'Article III, Section 1 of the Constitution' },
      { id: 'c', text: 'The Philippine Election Code' },
      { id: 'd', text: 'The COMELEC Resolution' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Article V of the 1987 Constitution provides for suffrage — the right of qualified citizens to vote in elections.',
    explanation_fil: 'Ang Artikulo V ng 1987 Konstitusyon ay nagtatakda ng karapatang bumoto ng mga kwalipikadong mamamayan.',
  },
  {
    stem: 'The minimum age requirement to vote in Philippine national elections is —',
    choices: [
      { id: 'a', text: '15 years old' },
      { id: 'b', text: '18 years old' },
      { id: 'c', text: '21 years old' },
      { id: 'd', text: '25 years old' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Under Article V of the 1987 Constitution, the minimum voting age in the Philippines is 18 years old.',
    explanation_fil: 'Sa ilalim ng Artikulo V ng 1987 Konstitusyon, ang minimum na edad upang bumoto sa Pilipinas ay 18 taong gulang.',
  },
  {
    stem: 'Which body is primarily responsible for conducting elections in the Philippines?',
    choices: [
      { id: 'a', text: 'The Civil Service Commission (CSC)' },
      { id: 'b', text: 'The Commission on Audit (COA)' },
      { id: 'c', text: 'The Commission on Elections (COMELEC)' },
      { id: 'd', text: 'The Department of Interior and Local Government (DILG)' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The Commission on Elections (COMELEC) is the constitutional body responsible for enforcing election laws and conducting elections in the Philippines.',
    explanation_fil: 'Ang Commission on Elections (COMELEC) ay ang katawan ng konstitusyon na responsable sa pagpapatupad ng mga batas sa halalan at pagsasagawa ng mga halalan sa Pilipinas.',
  },
  {
    stem: 'The three Constitutional Commissions of the Philippines are —',
    choices: [
      { id: 'a', text: 'COMELEC, COA, and CSC' },
      { id: 'b', text: 'COA, DOJ, and CSC' },
      { id: 'c', text: 'COMELEC, DILG, and CSC' },
      { id: 'd', text: 'COMELEC, COA, and DOF' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The three Constitutional Commissions are: Commission on Elections (COMELEC), Commission on Audit (COA), and Civil Service Commission (CSC).',
    explanation_fil: 'Ang tatlong Komisyong Konstitusyonal ay: Commission on Elections (COMELEC), Commission on Audit (COA), at Civil Service Commission (CSC).',
  },
  {
    stem: 'The Civil Service Commission (CSC) is responsible for —',
    choices: [
      { id: 'a', text: 'Conducting national elections' },
      { id: 'b', text: 'Auditing government funds and expenditures' },
      { id: 'c', text: 'Administering and regulating the civil service system' },
      { id: 'd', text: 'Enforcing environmental laws' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'The Civil Service Commission (CSC) is the central personnel agency of the Philippine government, responsible for administering and regulating the civil service system.',
    explanation_fil: 'Ang Civil Service Commission (CSC) ang sentral na ahensya ng kawani ng pamahalaan ng Pilipinas, na responsable sa pangangasiwa at regulasyon ng sistema ng serbisyong sibil.',
  },
  {
    stem: 'The State policy on the separation of Church and State is found in —',
    choices: [
      { id: 'a', text: 'Article I' },
      { id: 'b', text: 'Article II, Section 6' },
      { id: 'c', text: 'Article III, Section 5' },
      { id: 'd', text: 'Article XIV' },
    ],
    correct: 'b',
    difficulty: 3,
    explanation_en: 'Article II, Section 6 of the 1987 Constitution states: "The separation of Church and State shall be inviolable."',
    explanation_fil: 'Ang Artikulo II, Seksyon 6 ng 1987 Konstitusyon ay nagsasaad: "Ang paghihiwalay ng Simbahan at Estado ay hindi maaaring labagin."',
  },
  {
    stem: 'The principle that "sovereignty resides in the people" means —',
    choices: [
      { id: 'a', text: 'The President holds ultimate power over the nation.' },
      { id: 'b', text: 'The Supreme Court is the ultimate authority.' },
      { id: 'c', text: 'The ultimate source of political authority comes from the people.' },
      { id: 'd', text: 'The military controls the government.' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Article II, Section 1 states sovereignty resides in the people and all government authority emanates from them — the people are the ultimate source of political power.',
    explanation_fil: 'Ang kapangyarihang pampulitika ay nagmumula sa mga tao — sila ang pinagmumulan ng lahat ng awtoridad ng pamahalaan.',
  },
  {
    stem: 'Under the 1987 Constitution, which branch has the power to declare war?',
    choices: [
      { id: 'a', text: 'The President' },
      { id: 'b', text: 'The Supreme Court' },
      { id: 'c', text: 'Congress' },
      { id: 'd', text: 'The Department of National Defense' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Under Section 23, Article VI of the 1987 Constitution, Congress (not the President alone) has the power to declare war.',
    explanation_fil: 'Sa ilalim ng Seksyon 23, Artikulo VI ng 1987 Konstitusyon, ang Kongreso ang may kapangyarihang magdeklara ng digmaan.',
  },
  {
    stem: 'Martial law in the Philippines may be declared by —',
    choices: [
      { id: 'a', text: 'The Supreme Court' },
      { id: 'b', text: 'Congress' },
      { id: 'c', text: 'The President, subject to congressional review' },
      { id: 'd', text: 'The Secretary of Defense' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Under Article VII, Section 18, the President may declare martial law for a period not exceeding 60 days, subject to review and revocation by Congress.',
    explanation_fil: 'Sa ilalim ng Artikulo VII, Seksyon 18, maaaring magdeklara ng batas militar ang Pangulo sa loob ng hindi hihigit sa 60 araw, na napapailalim sa pagsusuri at pagbawi ng Kongreso.',
  },
  {
    stem: 'The right of habeas corpus protects citizens from —',
    choices: [
      { id: 'a', text: 'Unlawful search and seizure' },
      { id: 'b', text: 'Arbitrary detention or imprisonment without legal cause' },
      { id: 'c', text: 'Denial of free speech' },
      { id: 'd', text: 'Unfair trial procedures' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Habeas corpus requires that a person under arrest be brought before a judge, protecting against unlawful or arbitrary detention without legal cause.',
    explanation_fil: 'Ang habeas corpus ay nag-aatas na ang isang taong inaresto ay harapin ang hukom, upang maprotektahan laban sa walang batayang pagkulong.',
  },
  {
    stem: 'The term "eminent domain" refers to the power of —',
    choices: [
      { id: 'a', text: 'The government to tax its citizens' },
      { id: 'b', text: 'The government to take private property for public use, with just compensation' },
      { id: 'c', text: 'The Supreme Court to strike down laws' },
      { id: 'd', text: 'The President to pardon criminals' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Eminent domain is the power of the State to take private property for public use, provided that just compensation is paid to the owner.',
    explanation_fil: 'Ang eminent domain ay ang kapangyarihan ng Estado na kumuha ng pribadong ari-arian para sa pampublikong gamit, sa kondisyon na may makatarungang kabayaran.',
  },
  {
    stem: 'The Commission on Audit (COA) is responsible for —',
    choices: [
      { id: 'a', text: 'Conducting civil service examinations' },
      { id: 'b', text: 'Examining and auditing all accounts of the government' },
      { id: 'c', text: 'Overseeing the conduct of elections' },
      { id: 'd', text: 'Enforcing labor laws' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The Commission on Audit (COA) is constitutionally mandated to examine, audit, and settle all accounts of the government.',
    explanation_fil: 'Ang Commission on Audit (COA) ay may mandatong konstitusyonal na suriin, mag-audit, at ayusin ang lahat ng account ng pamahalaan.',
  },
  {
    stem: 'The local government unit (LGU) system in the Philippines is governed by —',
    choices: [
      { id: 'a', text: 'Republic Act 7160, or the Local Government Code' },
      { id: 'b', text: 'The Civil Service Law' },
      { id: 'c', text: 'Presidential Decree 1185' },
      { id: 'd', text: 'The Revised Penal Code' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Republic Act 7160 or the Local Government Code of 1991 governs local government units (LGUs) in the Philippines.',
    explanation_fil: 'Ang Republic Act 7160 o ang Local Government Code of 1991 ang namamahala sa mga lokal na yunit ng pamahalaan (LGU) sa Pilipinas.',
  },
  {
    stem: 'Which of the following is a basic right guaranteed under the Bill of Rights (Article III)?',
    choices: [
      { id: 'a', text: 'Right to work' },
      { id: 'b', text: 'Right to education' },
      { id: 'c', text: 'Right to due process of law' },
      { id: 'd', text: 'Right to free housing' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The right to due process of law is guaranteed under Section 1, Article III (Bill of Rights) of the 1987 Constitution.',
    explanation_fil: 'Ang karapatang may prosesong naaayon sa batas ay ginagarantiyahan ng Seksyon 1, Artikulo III (Bill of Rights) ng 1987 Konstitusyon.',
  },
  {
    stem: 'The national territory of the Philippines is defined in —',
    choices: [
      { id: 'a', text: 'Article I of the 1987 Constitution' },
      { id: 'b', text: 'Article II of the 1987 Constitution' },
      { id: 'c', text: 'Article X of the 1987 Constitution' },
      { id: 'd', text: 'The Treaty of Paris' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Article I of the 1987 Constitution defines the national territory of the Philippines, including all islands, bodies of water, and airspace.',
    explanation_fil: 'Ang Artikulo I ng 1987 Konstitusyon ang nagtatakda ng pambansang teritoryo ng Pilipinas, kasama ang lahat ng isla, katubigan, at espasyong hangin.',
  },
  {
    stem: 'The Preamble of the 1987 Philippine Constitution states that the Filipino people invoke the aid of —',
    choices: [
      { id: 'a', text: 'The United Nations' },
      { id: 'b', text: 'Almighty God' },
      { id: 'c', text: 'The ASEAN' },
      { id: 'd', text: 'The International Court of Justice' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The Preamble of the 1987 Constitution begins: "We, the sovereign Filipino people, imploring the aid of Almighty God..."',
    explanation_fil: 'Ang pambungad ng 1987 Konstitusyon ay nagsisimula sa: "Kami, ang mga balaong mamamayang Pilipino, na tumatawag sa tulong ng Makapangyarihang Diyos..."',
  },
  {
    stem: 'The principle of "popular sovereignty" means —',
    choices: [
      { id: 'a', text: 'Popular celebrities hold political power.' },
      { id: 'b', text: 'Political power comes from and is exercised by the people.' },
      { id: 'c', text: 'The military controls the government on behalf of the people.' },
      { id: 'd', text: 'The Church represents the people in government.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Popular sovereignty means that political authority comes from the people and is exercised by them through elected representatives.',
    explanation_fil: 'Ang popular sovereignty ay nangangahulugang ang kapangyarihang pampulitika ay nagmumula sa mga tao at isinasagawa ng mga hinirang nilang kinatawan.',
  },
  {
    stem: 'Under the 1987 Constitution, who is the Commander-in-Chief of the Armed Forces of the Philippines?',
    choices: [
      { id: 'a', text: 'The Secretary of National Defense' },
      { id: 'b', text: 'The Chief of Staff of the AFP' },
      { id: 'c', text: 'The President of the Philippines' },
      { id: 'd', text: 'The Vice President' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Under Article VII, Section 18 of the 1987 Constitution, the President of the Philippines is the Commander-in-Chief of all armed forces.',
    explanation_fil: 'Sa ilalim ng Artikulo VII, Seksyon 18, ang Pangulo ng Pilipinas ang Kumander-in-Tsip ng lahat ng sandatahang lakas.',
  },
  {
    stem: 'The power of judicial review — the power to declare laws unconstitutional — belongs to —',
    choices: [
      { id: 'a', text: 'The President' },
      { id: 'b', text: 'The Senate' },
      { id: 'c', text: 'The Supreme Court' },
      { id: 'd', text: 'The Office of the Solicitor General' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The Supreme Court exercises the power of judicial review — it can declare laws, executive acts, and government actions unconstitutional.',
    explanation_fil: 'Ang Korte Suprema ang nagtataglay ng kapangyarihang pagsuri ng hudikatura — maaari nitong ideklara na ang mga batas at aksyon ng pamahalaan ay labag sa Konstitusyon.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Philippine Constitution/Government (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Philippine Constitution & Government',
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
    source_note: 'CSE 2026 Reviewer — Philippine Constitution & Government',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro constitution: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub phil-government: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
