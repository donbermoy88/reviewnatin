/**
 * Fix 36 remaining demo questions in the DB:
 * 1. Strip "[demo:cse-professional]" prefix from stem
 * 2. Add proper English and Filipino explanations
 *
 * Run: node scripts/fix-demo-questions.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// -------------------------------------------------------------------
// Each entry: id, clean stem (no prefix), explanation_en, explanation_fil
// -------------------------------------------------------------------
const FIXES = [
  {
    id: 'bc1848ef-f6f8-41ba-b485-64cf0dfe9249',
    stem: 'Which pair is closest in meaning? BRIEF : SHORT',
    explanation_en:
      '"Quick : Fast" is the correct answer. BRIEF and SHORT both mean of short duration or length. Similarly, "quick" and "fast" both describe something that happens or moves with speed. The other pairs are either antonyms (Hot : Cold, Old : New) or describe different physical dimensions (Long : Tall).',
    explanation_fil:
      '"Quick : Fast" ang tamang sagot. Ang BRIEF at SHORT ay magkaparehong kahulugan — pareho itong nagpapahayag ng maikling oras o haba. Ang "quick" at "fast" ay pareho ring nagpapahayag ng bilis. Ang ibang pares ay magkasalungat (Hot : Cold, Old : New) o nagpapalit ng ibang dimensyon (Long : Tall).',
  },
  {
    id: 'd7cf9512-8d63-480d-94bf-f9890832f3f1',
    stem: 'Which statement weakens the argument: "Traffic was heavy, so Ana was late."',
    explanation_en:
      '"Ana also stopped for coffee without needing to" weakens the argument. The argument claims traffic caused Ana\'s lateness. If Ana voluntarily stopped for coffee (an unnecessary detour), then traffic alone is not the true cause — another factor (her own choice) contributed to the delay. This directly undermines the claim that traffic was the (only) reason.',
    explanation_fil:
      '"Ana also stopped for coffee without needing to" ang nagpapahina ng argumento. Sinasabi ng argumento na ang trapiko ang dahilan ng pagiging huli ni Ana. Ngunit kung kusang-loob itong tumigil para sa kape (isang hindi kinakailangang pagtigil), hindi lamang ang trapiko ang dahilan — ang sariling desisyon niya ay nagdagdag din sa pagkaantala. Ito ay direktang pumipigil sa konklusyon.',
  },
  {
    id: 'f2220e47-5e90-4f2a-b636-bbfe5750c576',
    stem: 'If A then B. Not B. Therefore:',
    explanation_en:
      '"Not A" is correct. This is the logical form called Modus Tollens: if A → B, and ¬B (not B), then we can conclude ¬A (not A). Example: "If it rains, the ground gets wet. The ground is not wet. Therefore, it did not rain." This is one of the basic valid argument forms in logic.',
    explanation_fil:
      '"Not A" ang tamang sagot. Ito ang tinatawag na Modus Tollens sa lohika: kung A → B, at ¬B (hindi B), ang konklusyon ay ¬A (hindi A). Halimbawa: "Kung umulan, mababasa ang lupa. Hindi basa ang lupa. Samakatuwid, hindi umulan." Ito ay isa sa mga pangunahing valid na argumento sa lohika.',
  },
  {
    id: '72c70500-bd3e-4378-a642-a30646c5977a',
    stem: 'Table: Mon 10, Tue 15, Wed 12. What is the total for the three days?',
    explanation_en:
      '10 + 15 + 12 = 37. Adding the three daily values: Monday (10), Tuesday (15), Wednesday (12) gives a total of 37.',
    explanation_fil:
      '10 + 15 + 12 = 37. Kapag idinagdag ang tatlong araw-araw na halaga: Lunes (10), Martes (15), Miyerkules (12), ang kabuuan ay 37.',
  },
  {
    id: '40b333fe-216e-4da7-b9bb-9df87c02d56f',
    stem: 'If sales rose from 50 to 65, the percent increase is:',
    explanation_en:
      'The percent increase = (Change ÷ Original) × 100 = (15 ÷ 50) × 100 = 30%. "Both 15 and 30%" is marked correct here — the absolute increase is 15 units, and the percentage increase is 30%. Note that in standard math, only 30% is the percent increase; 15 is the absolute change.',
    explanation_fil:
      'Ang porsyentong pagtaas = (Pagbabago ÷ Orihinal) × 100 = (15 ÷ 50) × 100 = 30%. Ang absolute na pagtaas ay 15 yunit, at ang porsyentong pagtaas ay 30%. Sa karaniwan, 30% lamang ang itinuturing na porsyentong pagtaas; ang 15 ay ang absolute na pagbabago.',
  },
  {
    id: '7b3cb3b2-9d28-4c28-902c-5f7be6c1942c',
    stem: 'What is 144 ÷ 12?',
    explanation_en:
      '144 ÷ 12 = 12. You can verify: 12 × 12 = 144. This is also 12², the square of 12. Division is the inverse of multiplication.',
    explanation_fil:
      '144 ÷ 12 = 12. Maaaring suriin: 12 × 12 = 144. Ito rin ay 12², ang parisukat ng 12. Ang paghahati ay kabaligtaran ng pagpaparami.',
  },
  {
    id: '7c013ac0-7523-434e-93af-e7d1ebd8dcf5',
    stem: 'Complete the sequence: 3, 6, 12, 24, __',
    explanation_en:
      'The pattern is doubling (×2) each time: 3 → 6 → 12 → 24 → 48. Each term is twice the previous term, making this a geometric sequence with a common ratio of 2.',
    explanation_fil:
      'Ang pattern ay pagdoble (×2) sa bawat hakbang: 3 → 6 → 12 → 24 → 48. Ang bawat termino ay doble ng nakaraan, kaya ito ay isang geometric sequence na may common ratio na 2.',
  },
  {
    id: 'dfe44f08-50d1-4e0e-8987-19b22b250ef0',
    stem: 'If 5 pens cost ₱60, how much do 8 pens cost at the same rate?',
    explanation_en:
      'Cost per pen = ₱60 ÷ 5 = ₱12 per pen. Cost of 8 pens = 8 × ₱12 = ₱96. This is a direct proportion: as the number of pens increases, the total cost increases at the same rate.',
    explanation_fil:
      'Halaga ng bawat panulat = ₱60 ÷ 5 = ₱12. Halaga ng 8 panulat = 8 × ₱12 = ₱96. Ito ay direktang proporsyon: habang dumadami ang panulat, dumarami rin ang kabuuang halaga sa parehong rate.',
  },
  {
    id: 'd39997f5-862b-4214-9cf7-b871a0ad3565',
    stem: 'Anna scored 80, 90, and 70 on three quizzes. Her average score is:',
    explanation_en:
      'Average = Sum ÷ Count = (80 + 90 + 70) ÷ 3 = 240 ÷ 3 = 80. The arithmetic mean (average) is found by adding all values and dividing by the number of values.',
    explanation_fil:
      'Average = Kabuuan ÷ Bilang = (80 + 90 + 70) ÷ 3 = 240 ÷ 3 = 80. Ang arithmetic mean (average) ay nakukuha sa pamamagitan ng pagdaragdag ng lahat ng halaga at paghahati sa bilang ng mga halaga.',
  },
  {
    id: '23a51c1d-4e12-464e-b773-b06064f1ffea',
    stem: 'The Philippine Constitution of 1987 was ratified after the ___ regime.',
    explanation_en:
      'The 1987 Philippine Constitution was ratified on February 2, 1987, through a plebiscite, after the end of the Marcos regime. Ferdinand E. Marcos declared Martial Law in 1972 and ruled as a dictator until the People Power Revolution (EDSA Revolution) ousted him in February 1986. The Aquino administration then supervised the drafting and ratification of the 1987 Constitution.',
    explanation_fil:
      'Ang Saligang Batas ng Pilipinas ng 1987 ay pinagtibay noong Pebrero 2, 1987 sa pamamagitan ng plebisito, pagkatapos ng pagwawakas ng rehimen ni Marcos. Nagdeklara ng Martial Law si Ferdinand E. Marcos noong 1972 at namuno bilang diktador hanggang sa People Power Revolution (EDSA Revolution) noong Pebrero 1986. Ang administrasyon ni Aquino ang nangasiwa sa paggawa at pagpapatibay ng 1987 Konstitusyon.',
  },
  {
    id: '3d20082b-49ac-431f-b6a2-591062501d18',
    stem: 'RA 6713 is known as the ___ Act of 1989.',
    explanation_en:
      'Republic Act 6713, the "Code of Conduct and Ethical Standards for Public Officials and Employees," was enacted in 1989. It promotes a high standard of ethics in public service, requires public disclosure (SALN), prohibits gifts and conflicts of interest, and serves as the primary law governing ethical behavior of government workers in the Philippines.',
    explanation_fil:
      'Ang Republic Act 6713, ang "Code of Conduct and Ethical Standards for Public Officials and Employees," ay isinabatas noong 1989. Nagtataguyod ito ng mataas na pamantayan ng etika sa serbisyong publiko, nangangailangan ng pampublikong pagbubunyag (SALN), nagbabawal ng mga regalo at salungatan ng interes, at nagsisilbing pangunahing batas na namamahala sa etikal na pag-uugali ng mga manggagawa ng gobyerno sa Pilipinas.',
  },
  {
    id: 'a2c19c29-4589-48b8-96ac-3e8c9f7770cc',
    stem: 'Which transition word best connects two contrasting ideas?',
    explanation_en:
      '"However" is the best contrast connector. It signals that the second statement contradicts or limits the first. Other contrast transitions include "but," "yet," "nevertheless," "on the other hand," and "although." "However" is commonly used in formal writing (such as government documents and exams) to introduce a qualification or opposing point.',
    explanation_fil:
      '"However" ang pinakamainam na salitang nagpapahayag ng kaibahan o salungatan. Nagpapakita ito na ang pangalawang pangungusap ay sumasalungat o nagtatakda ng limitasyon sa una. Kabilang sa ibang salitang nagpapahayag ng kaibahan ang "but," "yet," "nevertheless," "on the other hand," at "although." Karaniwang ginagamit ang "however" sa pormal na pagsulat upang magpakilala ng isang kwalipikasyon o kataas-taasang punto.',
  },
  {
    id: '284743b4-1291-435d-a9f1-eb7f5feac7ef',
    stem: 'Tone: "Applicants must verify requirements on the official CSC website." The tone of this sentence is:',
    explanation_en:
      '"Instructional" is the correct tone. The sentence uses the word "must," which indicates a directive or requirement. An instructional tone is directive and tells the reader what to do. It differs from formal (polite and structured), persuasive (influencing), or narrative (storytelling) tones. Government notices and exam instructions commonly use an instructional tone.',
    explanation_fil:
      '"Instructional" ang tamang tono. Gumagamit ang pangungusap ng salitang "must," na nagpapahiwatig ng isang direktiba o kinakailangan. Ang instructional na tono ay nagtuturo at nagsasabi sa mambabasa kung ano ang dapat gawin. Naiiba ito sa pormal (magalang at maayos), persuasive (nakakaimpluwensya), o narrative (pagkukuwento) na mga tono. Karaniwang gumagamit ng instructional na tono ang mga abiso ng gobyerno at mga tagubilin sa pagsusulit.',
  },
  {
    id: 'efe1a086-eb29-4697-9a25-bcc0678de856',
    stem: 'Which pair has the same relationship as HOT : COLD?',
    explanation_en:
      '"Up : Down" is correct. HOT and COLD are antonyms (direct opposites). Similarly, UP and DOWN are direct opposites. The other pairs — Quick : Fast (synonyms), Tall : Short (scalar opposites but different dimension), and Big : Small (relative size) — do not perfectly mirror the HOT : COLD antonym relationship.',
    explanation_fil:
      '"Up : Down" ang tamang sagot. Ang HOT at COLD ay magkasalungat (antonyms). Gayundin, ang UP at DOWN ay direktang magkasalungat. Ang ibang pares — Quick : Fast (magkasinkahulugan), Tall : Short (magkasalungat sa ibang dimensyon), at Big : Small (relatibong laki) — ay hindi perpektong katulad ng relasyon ng HOT : COLD.',
  },
  {
    id: '131264ef-89ce-4280-9cec-5586cea36585',
    stem: 'Which word does NOT belong: apple, mango, banana, potato?',
    explanation_en:
      '"Potato" does not belong. Apple, mango, and banana are all fruits (they develop from the flower of a plant and contain seeds). A potato is a vegetable — specifically a root tuber. The category is "fruits," and potato is the odd one out.',
    explanation_fil:
      '"Potato" ang hindi kasama. Ang apple, mango, at banana ay mga prutas (nagmumula sa bulaklak ng halaman at naglalaman ng mga buto). Ang potato ay isang gulay — partikular, isang root tuber. Ang kategorya ay "mga prutas," at ang potato ang naiiba.',
  },
  {
    id: 'd39598c3-df66-4847-bf6c-e9f435d2bc67',
    stem: 'Statement: "All passers studied daily." Which is an underlying assumption?',
    explanation_en:
      '"Daily study guarantees passing" is the underlying assumption. The statement asserts that all passers studied daily, which implicitly assumes that studying daily is what led to passing (i.e., it is sufficient or at least strongly correlated with success). This is the premise taken for granted that makes the statement meaningful.',
    explanation_fil:
      '"Daily study guarantees passing" ang pinagbabatayang pagpapalagay. Ang pahayag ay nagtataglay na ang lahat ng pumasa ay nag-aral araw-araw, na nagpapahiwatig na ang pag-aaral araw-araw ang dahilan ng pagpasa (ibig sabihin, sapat ito o lubos na may kaugnayan sa tagumpay). Ito ang nahuhulagang pinagbatayan na nagbibigay-kahulugan sa pahayag.',
  },
  {
    id: '7526ade7-cee7-4dfe-bd19-825fc6150e13',
    stem: 'What is the underlying assumption in: "The office should hire more staff because workload increased."',
    explanation_en:
      '"Workload increased" is the stated reason (premise), but the underlying assumption is that current staff cannot handle the additional workload — meaning more people are needed. However, in this question, the answer is that the workload increase is taken as a given (assumed fact). The argument assumes that increased workload inherently requires more staff — i.e., the existing staff cannot cope.',
    explanation_fil:
      'Ang "Workload increased" ay ang nabanggit na dahilan (premise), ngunit ang pinagbabatayang pagpapalagay ay hindi kaya ng kasalukuyang kawani ang karagdagang trabaho — kailangan ng mas maraming tao. Ang argumento ay nagpapalagay na ang pagtaas ng trabaho ay nagangangailangan ng mas maraming kawani — ibig sabihin, hindi kayang harapin ng mga kasalukuyang empleyado ang pagbabago.',
  },
  {
    id: 'f55d6b25-6df9-4648-bebc-ba8cba3e7479',
    stem: 'Some nurses are bilingual. Maria is a nurse. We can conclude Maria ___',
    explanation_en:
      '"might be bilingual" is the correct conclusion. The statement says only "some" nurses are bilingual, not all. Since Maria is a nurse, she may or may not be bilingual — we cannot say for certain that she is (that would require "all nurses are bilingual"). Thus, the valid conclusion is that she "might be bilingual" (it is possible but not certain).',
    explanation_fil:
      '"might be bilingual" ang tamang konklusyon. Sinasabi ng pahayag na "ilang" (some) nurses lamang ang bilingual, hindi lahat. Dahil si Maria ay isang nurse, maaaring siya ay bilingual o hindi — hindi natin masasabi nang tiyak na siya ay bilingual (nangangailangan iyon ng "lahat ng nurses ay bilingual"). Kaya naman, ang tamang konklusyon ay na siya ay "maaaring bilingual" (posible ngunit hindi tiyak).',
  },
  {
    id: 'd9648ed2-6198-4470-b6ed-98eec491795b',
    stem: 'A chart shows 40% chose Option A, 25% chose B, and 35% chose C out of 200 respondents. How many chose Option A?',
    explanation_en:
      '40% of 200 = 0.40 × 200 = 80 respondents chose Option A. When working with percentages: convert the percentage to a decimal (40% = 0.40) and multiply by the total (200).',
    explanation_fil:
      '40% ng 200 = 0.40 × 200 = 80 na sumasagot ang pumili ng Option A. Kapag nagtatrabaho sa mga porsyento: gawing decimal ang porsyento (40% = 0.40) at i-multiply sa kabuuan (200).',
  },
  {
    id: '11ab0be3-e8b6-4d04-845e-45b3d166c1ea',
    stem: 'What is 15% of 200?',
    explanation_en:
      '15% of 200 = 0.15 × 200 = 30. To find a percentage of a number: convert the percent to a decimal (15% = 0.15) and multiply by the number. Alternatively: 10% of 200 = 20, 5% of 200 = 10, so 15% = 20 + 10 = 30.',
    explanation_fil:
      '15% ng 200 = 0.15 × 200 = 30. Para mahanap ang porsyento ng isang numero: gawing decimal ang porsyento (15% = 0.15) at i-multiply sa numero. Bilang kahalili: 10% ng 200 = 20, 5% ng 200 = 10, kaya 15% = 20 + 10 = 30.',
  },
  {
    id: 'ba095ab8-035c-4992-939c-a5073ecd2ee6',
    stem: 'If 7 × □ = 63, then □ =',
    explanation_en:
      '□ = 63 ÷ 7 = 9. To solve for an unknown in a multiplication equation, divide both sides by the known factor: □ = 63 ÷ 7 = 9. Check: 7 × 9 = 63 ✓',
    explanation_fil:
      '□ = 63 ÷ 7 = 9. Para mahanap ang hindi kilalang numero sa isang multiplication equation, hatiin ang magkabilang panig sa kilalang factor: □ = 63 ÷ 7 = 9. Suriin: 7 × 9 = 63 ✓',
  },
  {
    id: 'f28ecf2c-bf24-410a-8570-8fa7b8b6063e',
    stem: 'Complete the sequence: 1, 1, 2, 3, 5, 8, __',
    explanation_en:
      'The next number is 13. This is the Fibonacci sequence: each number is the sum of the two preceding ones. 0, 1, 1, 2, 3, 5, 8, 13, 21... In this sequence: 5 + 8 = 13.',
    explanation_fil:
      'Ang susunod na numero ay 13. Ito ang Fibonacci sequence: ang bawat numero ay kabuuan ng dalawang nauna. 0, 1, 1, 2, 3, 5, 8, 13, 21... Sa sequence na ito: 5 + 8 = 13.',
  },
  {
    id: '5de25fe2-3e4b-4a88-bd6a-ef5897abb8a4',
    stem: 'A train travels 120 km in 2 hours. Its average speed is:',
    explanation_en:
      'Speed = Distance ÷ Time = 120 km ÷ 2 hours = 60 km/h. This is the basic speed formula. Average speed = total distance traveled divided by total time taken.',
    explanation_fil:
      'Bilis = Distansya ÷ Oras = 120 km ÷ 2 oras = 60 km/h. Ito ang pangunahing formula ng bilis. Average speed = kabuuang distansyang nilakbay na hinati sa kabuuang oras na ginugol.',
  },
  {
    id: 'e86e09b0-9319-4c63-a280-6f3db4f3f01b',
    stem: 'The Bill of Rights is found in Article ___ of the 1987 Philippine Constitution.',
    explanation_en:
      'The Bill of Rights is found in Article III of the 1987 Philippine Constitution. It enumerates the fundamental rights and liberties of citizens, including the right to due process, equal protection, free speech, right against unreasonable searches, and more. Article I covers National Territory; Article II covers State Principles and Policies; Article IV covers Citizenship.',
    explanation_fil:
      'Ang Bill of Rights ay makikita sa Artikulo III ng 1987 na Saligang Batas ng Pilipinas. Inilalista nito ang mga pundamental na karapatan at kalayaan ng mga mamamayan, kabilang ang karapatang proseso ng batas, pantay na proteksyon, kalayaan sa pananalita, karapatang laban sa walang katwirang paghahalughog, at iba pa. Ang Artikulo I ay sumasaklaw sa Pambansang Teritoryo; Artikulo II sa Mga Simulain at Patakaran ng Estado; Artikulo IV sa Pagkamamamayan.',
  },
  {
    id: 'd0e53015-8cff-4cae-984a-bd82906c3d56',
    stem: 'Under RA 6713, public officials must submit their Statement of ___ declaration.',
    explanation_en:
      'Public officials must submit their SALN — Statement of Assets, Liabilities, and Net Worth. Under RA 6713 (Code of Conduct and Ethical Standards for Public Officials and Employees), this annual declaration is required to promote transparency and prevent corruption. It must be filed on or before April 30 of each year.',
    explanation_fil:
      'Ang mga opisyal ng gobyerno ay dapat magsumite ng kanilang SALN — Statement of Assets, Liabilities, and Net Worth. Sa ilalim ng RA 6713 (Code of Conduct and Ethical Standards for Public Officials and Employees), ang taunang deklarasyong ito ay kinakailangan upang maitaguyod ang transparency at maiwasan ang katiwalian. Dapat itong isumite sa o bago ang Abril 30 ng bawat taon.',
  },
  {
    id: '4f20bc2b-89d6-49db-8899-bdf2bcb44377',
    stem: 'The Universal Declaration of Human Rights was adopted in:',
    explanation_en:
      'The Universal Declaration of Human Rights (UDHR) was adopted by the United Nations General Assembly on December 10, 1948. It is a milestone document proclaiming the inalienable rights to which every human being is entitled, regardless of race, color, religion, sex, language, political opinion, or national origin. December 10 is celebrated as Human Rights Day.',
    explanation_fil:
      'Ang Universal Declaration of Human Rights (UDHR) ay pinagtibay ng United Nations General Assembly noong Disyembre 10, 1948. Ito ay isang makasaysayang dokumento na nagpapahayag ng mga di-maaring alisin na karapatang nararapat sa bawat tao, anuman ang lahi, kulay, relihiyon, kasarian, wika, politikal na opinyon, o pambansang pinagmulan. Ang Disyembre 10 ay ipinagdiriwang bilang Human Rights Day.',
  },
  {
    id: 'dc6d8662-5ab5-4421-a187-ba5f1cac2a77',
    stem: 'Sovereignty resides in the ___ and all government authority emanates from them.',
    explanation_en:
      '"People" is correct. Article II, Section 1 of the 1987 Philippine Constitution states: "The Philippines is a democratic and republican State. Sovereignty resides in the people and all government authority emanates from them." This establishes the fundamental principle that the government derives its power from the consent of the governed.',
    explanation_fil:
      '"People" ang tamang sagot. Sinasabi ng Artikulo II, Seksyon 1 ng 1987 na Saligang Batas ng Pilipinas: "Ang Pilipinas ay isang demokratiko at republikang Estado. Ang soberanya ay nananahan sa mamamayan at ang lahat ng awtoridad ng gobyerno ay nagmumula sa kanila." Itinatag nito ang pundamental na prinsipyo na ang kapangyarihan ng gobyerno ay nagmumula sa pahintulot ng mga pinamamahalaan.',
  },
  {
    id: 'ae52a1b1-60be-42f3-b80c-1bb689bc4e3a',
    stem: 'Nepotism in appointment to public office is generally prohibited under:',
    explanation_en:
      'Nepotism is prohibited under RA 6713 (Code of Conduct and Ethical Standards for Public Officials and Employees). Section 3(j) defines nepotism as the appointment of relatives within the third degree of consanguinity or affinity. However, the primary anti-nepotism provision is actually found in the Administrative Code (Section 59, Book V, EO 292). RA 6713 reinforces this by prohibiting acts that give unwarranted benefits, advantage, or preference to relatives.',
    explanation_fil:
      'Ang nepotismo ay ipinagbabawal sa ilalim ng RA 6713 (Code of Conduct and Ethical Standards for Public Officials and Employees). Inilalarawan ng Seksyon 3(j) ang nepotismo bilang pagtalaga ng mga kamag-anak sa loob ng ikatlong antas ng consanguinity o affinity. Gayunpaman, ang pangunahing probisyon laban sa nepotismo ay makikita sa Administrative Code (Seksyon 59, Aklat V, EO 292). Pinalalakas ng RA 6713 ito sa pamamagitan ng pagbabawal sa mga kilos na nagbibigay ng hindi nararapat na benepisyo, kalamangan, o kagustuhan sa mga kamag-anak.',
  },
  {
    id: 'b9eb3e39-e410-45ce-bedc-e453a5d63cb3',
    stem: 'Extrajudicial killing violates the right to:',
    explanation_en:
      'Extrajudicial killing violates the right to Life. Article III, Section 1 of the 1987 Constitution states: "No person shall be deprived of life, liberty, or property without due process of law." Extrajudicial killings occur outside the legal process — suspects are killed without trial or judicial order — directly violating the constitutional right to life and due process.',
    explanation_fil:
      'Ang extrajudicial killing ay lumalabag sa karapatang mabuhay (Life). Sinasabi ng Artikulo III, Seksyon 1 ng 1987 Konstitusyon: "Walang sinuman ang maaaring alisin ng buhay, kalayaan, o ari-arian nang walang proseso ng batas." Ang mga extrajudicial killings ay nangyayari sa labas ng legal na proseso — pinapatay ang mga suspetsa nang walang pagdinig o judicial na utos — direktang lumalabag sa konstitusyonal na karapatan sa buhay at proseso ng batas.',
  },
  {
    id: 'd22a7ca5-3a83-49c7-9ea2-471cb482fc30',
    stem: 'RA 9003 is the ___ Act of 2000.',
    explanation_en:
      'RA 9003 is the "Ecological Solid Waste Management Act of 2000." It establishes a comprehensive ecological solid waste management program and creates the necessary institutional mechanisms and incentives for its implementation. It mandates segregation at source, composting, recycling, and the proper disposal of solid waste, and prohibits open dumpsites.',
    explanation_fil:
      'Ang RA 9003 ay ang "Ecological Solid Waste Management Act of 2000." Nagtatakda ito ng komprehensibong programa sa pamamahala ng basura at lumilikha ng mga kinakailangang institusyonal na mekanismo at insentibo para sa pagpapatupad nito. Inaatasan nito ang paghihiwalay ng basura sa pinagmulan, pag-compost, pag-recycle, at wastong pagtatapon ng solid waste, at nagbabawal ng mga open dumpsite.',
  },
  {
    id: '7fe9f50e-ba9b-4a53-bf36-18f674c5cb8c',
    stem: 'Protected areas in the Philippines are managed under:',
    explanation_en:
      'Protected areas in the Philippines are managed under RA 7586, the National Integrated Protected Areas System (NIPAS) Act of 1992. NIPAS classifies and administers all designated protected areas to maintain their biodiversity and natural resources. These include national parks, wildlife sanctuaries, protected landscapes/seascapes, and natural biotic areas. The DENR (Department of Environment and Natural Resources) is the lead implementing agency.',
    explanation_fil:
      'Ang mga protected areas sa Pilipinas ay pinamamahalaan sa ilalim ng RA 7586, ang National Integrated Protected Areas System (NIPAS) Act of 1992. Inuuri at pinamamahalaan ng NIPAS ang lahat ng itinalagang protected areas upang mapanatili ang kanilang biodiversity at likas na yaman. Kabilang dito ang mga national park, wildlife sanctuary, protected landscape/seascape, at natural biotic area. Ang DENR (Department of Environment and Natural Resources) ang nangungunang ahensyang nagpapatupad.',
  },
  {
    id: 'edeb71bb-c6da-4f5d-a8aa-ced4f2926148',
    stem: 'Gift rules under RA 6713 primarily aim to prevent:',
    explanation_en:
      '"Conflicts of interest" is correct. The gift rules under RA 6713 limit public officials from accepting gifts, money, or other valuables from persons who have transactions with their office. The primary purpose is to prevent conflicts of interest — situations where a public official\'s personal interest could influence their official decisions, undermining fairness and public trust.',
    explanation_fil:
      '"Conflicts of interest" ang tamang sagot. Nililimitahan ng mga panuntuan sa regalo sa ilalim ng RA 6713 ang mga opisyal ng gobyerno mula sa pagtanggap ng mga regalo, pera, o iba pang mahahalagang bagay mula sa mga taong may transaksyon sa kanilang opisina. Ang pangunahing layunin ay maiwasan ang mga salungatan ng interes — mga sitwasyon kung saan ang personal na interes ng isang opisyal ng gobyerno ay maaaring makaimpluwensya sa kanilang opisyal na mga desisyon, na nagtatawid sa pagiging patas at tiwala ng publiko.',
  },
  {
    id: 'd89376e6-bb65-400a-b4ee-6a174b2f06f6',
    stem: 'Peace education in the Philippines promotes:',
    explanation_en:
      '"Tolerance and respect for human dignity" is correct. Peace education (also called "Education for Peace") aims to build a culture of peace by promoting values such as tolerance, non-violence, human rights, intercultural dialogue, and respect for the dignity of every person. In the Philippine context, it also addresses local issues like armed conflict, discrimination, and poverty as roots of violence.',
    explanation_fil:
      '"Tolerance and respect for human dignity" ang tamang sagot. Ang peace education (tinatawag din na "Education for Peace") ay naglalayong bumuo ng kultura ng kapayapaan sa pamamagitan ng pagtataguyod ng mga halaga tulad ng tolerance, non-violence, karapatang pantao, intercultural dialogue, at paggalang sa dignidad ng bawat tao. Sa kontekstong Pilipino, tinutugunan din nito ang mga lokal na isyu tulad ng armadong tunggalian, diskriminasyon, at kahirapan bilang mga ugat ng karahasan.',
  },
  {
    id: 'a58da168-9569-4e20-a971-b3e0914e9009',
    stem: 'Climate change mitigation includes reducing ___ emissions.',
    explanation_en:
      '"Greenhouse gas" emissions are the target of climate change mitigation. Greenhouse gases (GHGs) — primarily carbon dioxide (CO₂), methane (CH₄), and nitrous oxide (N₂O) — trap heat in the atmosphere, causing the greenhouse effect and global warming. Mitigation strategies include switching to renewable energy, improving energy efficiency, reducing deforestation, and promoting sustainable agriculture.',
    explanation_fil:
      'Ang mga emisyon ng "greenhouse gas" ang target ng climate change mitigation. Ang mga greenhouse gases (GHGs) — pangunahin ang carbon dioxide (CO₂), methane (CH₄), at nitrous oxide (N₂O) — ay nagtatrap ng init sa atmospera, na nagdudulot ng greenhouse effect at global warming. Kabilang sa mga estratehiya ng mitigation ang paglipat sa renewable energy, pagpapabuti ng kahusayan sa enerhiya, pagbabawas ng deforestation, at pagtataguyod ng sustainable agriculture.',
  },
  {
    id: '416806f0-3226-49c3-a72e-f45711266d9e',
    stem: 'The right to due process means fair treatment under:',
    explanation_en:
      '"Law" is correct. Due process means fair treatment under the law. Article III, Section 1 of the 1987 Constitution guarantees that "no person shall be deprived of life, liberty, or property without due process of law." Due process has two aspects: (1) substantive — the law itself must be fair and reasonable; (2) procedural — the manner of its enforcement must follow fair procedures.',
    explanation_fil:
      '"Law" ang tamang sagot. Ang due process ay nangangahulugang patas na pagtrato sa ilalim ng batas. Ginagarantiyahan ng Artikulo III, Seksyon 1 ng 1987 Konstitusyon na "walang sinuman ang maaaring alisin ng buhay, kalayaan, o ari-arian nang walang proseso ng batas." Ang due process ay may dalawang aspeto: (1) substantive — ang batas mismo ay dapat maging patas at makatwiran; (2) procedural — ang paraan ng pagpapatupad nito ay dapat sumunod sa makatarungang pamamaraan.',
  },
  {
    id: 'feb510b8-b779-4746-80b5-2da713dee687',
    stem: 'The 3Rs in waste management stand for Reduce, Reuse, and ___',
    explanation_en:
      'The 3Rs stand for Reduce, Reuse, and Recycle. These are the three fundamental principles of waste management hierarchy: (1) Reduce — minimize the amount of waste produced; (2) Reuse — use items again instead of discarding them; (3) Recycle — process waste materials into new products. This hierarchy is embedded in RA 9003 (Ecological Solid Waste Management Act) and is key to the CSE environmental questions.',
    explanation_fil:
      'Ang 3Rs ay kumakatawan sa Reduce, Reuse, at Recycle. Ito ang tatlong pundamental na prinsipyo ng hierarchy ng pamamahala ng basura: (1) Reduce — bawasan ang dami ng basura na nalilikha; (2) Reuse — gamitin muli ang mga bagay sa halip na itapon; (3) Recycle — iproseso ang mga materyales ng basura sa mga bagong produkto. Ang hierarchy na ito ay nakapaloob sa RA 9003 (Ecological Solid Waste Management Act) at susi sa mga tanong sa kalikasan sa CSE.',
  },
];

// -------------------------------------------------------------------
async function main() {
  console.log(`Fixing ${FIXES.length} demo questions...`);
  let success = 0;
  let failed = 0;

  for (const fix of FIXES) {
    const { error } = await sb
      .from('questions')
      .update({
        stem: fix.stem,
        explanation_en: fix.explanation_en,
        explanation_fil: fix.explanation_fil,
      })
      .eq('id', fix.id);

    if (error) {
      console.error(`❌ ${fix.id}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${fix.id}: ${fix.stem.substring(0, 60)}`);
      success++;
    }
  }

  console.log(`\nDone: ${success} updated, ${failed} failed`);
}

main().catch(console.error);
