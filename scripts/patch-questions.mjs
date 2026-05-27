/**
 * Patch all demo questions in Supabase:
 *  1. Strip [demo:xxx] prefix from stems
 *  2. Fix the one wrong answer key (jeepney sequence → 'a')
 *  3. Write real educational explanations in English and Filipino
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yohewfdafdmwntsbzgxx.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvaGV3ZmRhZmRtd250c2J6Z3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUwNjQ0NCwiZXhwIjoyMDk1MDgyNDQ0fQ.lTZKF3B-9DpxpskSgRPP-f1-m5QddGv0I4wt74gv3sE';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Patch data ────────────────────────────────────────────────────────────────
// Each entry: { id, stem (cleaned), correct_choice_id (corrected), explanation_en, explanation_fil }
const PATCHES = [

  // ── CSE PROFESSIONAL — VERBAL: Grammar & Correct Usage ──────────────────────

  {
    id: '1f2d6ec2-6e60-4ba8-9efc-d26822d41c4e',
    stem: 'Which branch of government enacts laws in the Philippines?',
    correct_choice_id: 'b',
    explanation_en:
      'The Legislative branch (Congress, composed of the Senate and the House of Representatives) has the sole power to enact, amend, and repeal laws under Article VI of the 1987 Philippine Constitution. The Executive branch enforces laws; the Judicial branch interprets them.',
    explanation_fil:
      'Ang Legislative branch (Kongreso, binubuo ng Senado at Kapulungan ng mga Kinatawan) ang may kapangyarihang gumawa, baguhin, at ipawalang-bisa ng mga batas ayon sa Artikulo VI ng Konstitusyon ng 1987. Nagpapatupad ng batas ang Executive; nagbibigay-kahulugan ang Judicial.',
  },

  {
    id: '6236ee5f-ea3c-4eea-a5e4-14d20bb81d51',
    stem: 'Choose the sentence with correct subject-verb agreement.',
    correct_choice_id: 'c',
    explanation_en:
      '"Each of the candidates has a platform." is correct because "each" is always singular and requires a singular verb (has). A: "group…are" is wrong — collective nouns like "group" take a singular verb. B: "neither…were" is wrong — "neither" takes a singular verb. D: "news were" is wrong — "news" is a singular noun.',
    explanation_fil:
      '"Each of the candidates has a platform." ang tama dahil laging singular ang "each" kaya singular verb (has) ang kailangan. A: Mali ang "group…are" — collective noun ang "group" kaya singular verb. B: Mali ang "neither…were" — singular ang "neither". D: Mali ang "news were" — singular noun ang "news".',
  },

  {
    id: '5ad9cb4a-0e06-4091-8004-ed005f7be6ea',
    stem: 'What is the synonym of "abundant"?',
    correct_choice_id: 'b',
    explanation_en:
      '"Plentiful" is the correct synonym of "abundant" — both mean present in large quantities. "Scarce" is the opposite (antonym). "Tiny" and "Weak" are unrelated in meaning.',
    explanation_fil:
      '"Plentiful" ang tamang kasingkahulugan ng "abundant" — parehong nangangahulugang marami o sagana. Kabaligtaran (antonym) nito ang "Scarce". Walang kaugnayan ang "Tiny" at "Weak".',
  },

  {
    id: '0ce5c086-e2d2-47d8-b21a-bcf3bd3a9c4d',
    stem: 'The Philippines gained independence from the United States in what year?',
    correct_choice_id: 'c',
    explanation_en:
      'The Philippines gained full independence on July 4, 1946, when the United States formally recognized Philippine sovereignty under the Treaty of Manila. 1898 marks the end of Spanish rule (Proclamation of Independence on June 12). 1935 was when the Commonwealth was established.',
    explanation_fil:
      'Ang Pilipinas ay nakatanggap ng ganap na kalayaan noong Hulyo 4, 1946, nang opisyal na kilalanin ng Estados Unidos ang soberanya ng Pilipinas sa ilalim ng Treaty of Manila. Ang 1898 ay katapusan ng pamumuno ng Espanya (Proklamasyon ng Kalayaan, Hunyo 12). Ang 1935 naman ay itinatag ang Komonwelt.',
  },

  {
    id: 'fbcf8489-0372-4f52-9fb5-11a5a2bca41e',
    stem: 'Which is an example of a proper noun?',
    correct_choice_id: 'b',
    explanation_en:
      '"Manila" is a proper noun because it names a specific place and is capitalized. A proper noun refers to a particular person, place, organization, or thing. "city" is a common noun (general place), "beautiful" is an adjective, and "quickly" is an adverb.',
    explanation_fil:
      '"Manila" ay proper noun dahil ito ay pangalan ng isang tiyak na lugar at nagsisimula sa malaking titik. Ang proper noun ay tumutukoy sa partikular na tao, lugar, organisasyon, o bagay. "City" ay common noun, "beautiful" ay adjective, at "quickly" ay adverb.',
  },

  {
    id: '91cc833b-178b-4fd5-b5bb-414b6da50566',
    stem: 'Which sentence uses the correct pronoun?',
    correct_choice_id: 'd',
    explanation_en:
      '"The award was given to her and me." is correct. After a preposition (to), object pronouns (her, me) must be used — not subject pronouns (she, I). Test each: "given to her" ✓, "given to me" ✓. A and B incorrectly use "I" after a preposition. C is also correct English but "She is taller than me" is informal; D is the grammatically clearest answer in this set.',
    explanation_fil:
      '"The award was given to her and me." ang tama. Pagkatapos ng preposition (to), dapat gumamit ng object pronouns (her, me) — hindi subject pronouns (she, I). A at B: Mali ang "I" pagkatapos ng preposition. D ang pinakamlinaw na grammatically correct sa mga pagpipilian.',
  },

  {
    id: '02c7c9b6-14dd-4b38-b278-9579f2154568',
    stem: 'Select the properly punctuated sentence.',
    correct_choice_id: 'b',
    explanation_en:
      '"However, we must finish today." is correct. "However" is a conjunctive adverb that introduces a contrast; when it starts a sentence it must be followed by a comma. A has no comma. C incorrectly uses a semicolon where a comma is needed. D misplaces the comma.',
    explanation_fil:
      '"However, we must finish today." ang tama. Ang "However" ay conjunctive adverb na nagpapakita ng kontraste; kapag nasa simula ng pangungusap, dapat may kuwit pagkatapos nito. A: Walang kuwit. C: Mali ang gamit ng semicolon. D: Mali ang posisyon ng kuwit.',
  },

  {
    id: 'ea3479bf-dd4e-4650-a4c7-8ebae6a03aca',
    stem: 'Which word correctly completes: "Neither the supervisor nor the staff ___ present."',
    correct_choice_id: 'a',
    explanation_en:
      '"was" is correct. With neither/nor, the verb agrees with the subject closest to it ("the staff"). In formal written English, "staff" is treated as a singular collective noun, so the singular verb "was" is used. "Were" would apply only if treating "staff" as plural individuals, which is informal.',
    explanation_fil:
      '"was" ang tama. Sa neither/nor, ang pandiwa ay naaayon sa paksa na pinakamalapit sa pandiwa ("the staff"). Sa pormal na sulat, "staff" ay itinuturing na singular collective noun, kaya "was" ang gagamitin. Ang "were" ay para lamang sa impormal na paggamit.',
  },

  // ── CSE PROFESSIONAL — VERBAL: Vocabulary ────────────────────────────────────

  {
    id: '766ea3a2-656b-48be-a080-207ff72c13ff',
    stem: 'What is the antonym of "obsolete"?',
    correct_choice_id: 'b',
    explanation_en:
      '"Current" is the antonym of "obsolete." Something obsolete is no longer in use or out of date; something current is in use now and up to date. "Outdated" and "Ancient" are synonyms of obsolete, not antonyms. "Broken" refers to damage, not relevance in time.',
    explanation_fil:
      '"Current" ang kabaligtaran ng "obsolete." Ang obsolete ay hindi na ginagamit o lipas na sa panahon; ang current naman ay ginagamit pa at napapanahon. Ang "Outdated" at "Ancient" ay magkasingkahulugan ng obsolete, hindi kabaligtaran. Ang "Broken" ay tumutukoy sa sira, hindi sa panahon.',
  },

  {
    id: 'e0f1f70b-4ad1-48df-ba7d-766e2fbf1603',
    stem: 'The word "benevolent" most nearly means:',
    correct_choice_id: 'b',
    explanation_en:
      '"Benevolent" comes from Latin bene (well) + volens (wishing) — it means well-meaning, kind, and charitable. A benevolent leader is one who rules with goodwill toward others. "Cruel" is the antonym. "Lazy" and "Proud" are unrelated.',
    explanation_fil:
      'Nagmula sa Latin ang "benevolent": bene (mabuti) + volens (magnanais) — nangangahulugang mabait, mapagbigay, at mapagmalasakit. Ang benevolent na lider ay isa na may mabuting kalooban sa iba. Kabaligtaran nito ang "Cruel". Walang kaugnayan ang "Lazy" at "Proud".',
  },

  {
    id: '4b6251a0-6ac6-432d-98f3-4049488bb2d1',
    stem: 'Choose the best meaning of "ambiguous" in context: "The memo was ambiguous."',
    correct_choice_id: 'b',
    explanation_en:
      '"Ambiguous" means open to more than one interpretation or unclear in meaning. When a memo is ambiguous, readers may understand it differently. This is crucial in office communication — CSE tests this often. "Clear" is the antonym. "Very long" and "Official" are unrelated to the word\'s meaning.',
    explanation_fil:
      '"Ambiguous" ay nangangahulugang may higit sa isang kahulugan o hindi malinaw. Kapag ambiguous ang isang memo, maaaring magkaibang pagkaunawa ang mga mambabasa. Mahalaga ito sa opisyal na komunikasyon — madalas itong tinatanong sa CSE. "Clear" ang kabaligtaran. Walang kaugnayan ang "Very long" at "Official".',
  },

  // ── CSE PROFESSIONAL — VERBAL: Paragraph Organization ────────────────────────

  {
    id: '584b1cdc-422b-4879-8232-4f1ccf3ae87d',
    stem: 'Which sentence should come FIRST in a paragraph about preparing for the CSE?',
    correct_choice_id: 'b',
    explanation_en:
      'A paragraph\'s first sentence (topic sentence) states the main idea. "Many applicants review months ahead." introduces the general theme of early preparation, which the other sentences can support. The other options are supporting or closing details that logically come after the topic sentence is established.',
    explanation_fil:
      'Ang unang pangungusap ng talata (topic sentence) ay nagpapahayag ng pangunahing ideya. "Many applicants review months ahead." ang nagpapakilala sa temang paghahanda nang maaga, na susuportahan ng iba pang pangungusap. Ang ibang opsyon ay mga detalye na dapat sumunod sa topic sentence.',
  },

  {
    id: '7fbcc386-45de-40de-a080-008b3f667abc',
    stem: 'Which is the best concluding sentence?',
    correct_choice_id: 'b',
    explanation_en:
      '"Therefore, consistent review improves readiness." is the best concluding sentence because it summarizes the main idea and uses a logical connector ("Therefore") that signals a conclusion drawn from evidence. The other options are either vague, unrelated, or negative — none wrap up a paragraph about effective study habits.',
    explanation_fil:
      '"Therefore, consistent review improves readiness." ang pinakamahusay na panghuling pangungusap dahil binubuod nito ang pangunahing ideya at gumagamit ng logical connector ("Therefore") na nagpapakita ng konklusyon mula sa ebidensya. Ang iba pang opsyon ay malabo, hindi kaugnay, o negatibo.',
  },

  {
    id: '25645151-3c27-46d6-9328-49b2758232df',
    stem: 'Which sentence is OFF-topic in a paragraph about time management?',
    correct_choice_id: 'c',
    explanation_en:
      '"The Philippine flag has three colors." is completely off-topic in a paragraph about time management. It introduces an unrelated fact about the flag. The other sentences (study schedule, 25-minute blocks, prioritize subjects) all support the topic of managing study time effectively.',
    explanation_fil:
      '"The Philippine flag has three colors." ay ganap na hindi kaugnay ng talata tungkol sa time management. Nagpapakilala ito ng hindi kaugnay na katotohanan tungkol sa watawat. Ang iba pang pangungusap (study schedule, 25-minutong bloke, unahin ang mahina) ay lahat sumusuporta sa paksa ng epektibong pamamahala ng oras.',
  },

  // ── CSE PROFESSIONAL — VERBAL: Reading Comprehension ─────────────────────────

  {
    id: '30f96bba-6559-489a-b8f6-aa379a2f994a',
    stem: 'Passage gist: "Regular mock exams build stamina and reveal weak topics." The main idea is:',
    correct_choice_id: 'b',
    explanation_en:
      'The passage says mock exams do two things: build stamina and reveal weak topics — both preparation benefits. "Mocks help preparation strategy" captures the overall message. The other options misread the passage: mocks don\'t replace official exams, stamina IS related to exams, and the passage suggests targeting weak topics (not ignoring them).',
    explanation_fil:
      'Sinasabi ng teksto na may dalawang magagawa ang mock exams: nagtatayo ng stamina at nagpapakita ng mahihinang paksa — parehong benepisyo sa paghahanda. "Mocks help preparation strategy" ang sumasaklaw ng mensahe. Ang ibang opsyon ay maling pagbabasa ng teksto.',
  },

  {
    id: '68adea7c-4aad-45c0-89c0-82655bbdaf72',
    stem: 'Inference: "She reviewed every night for two months." She is likely:',
    correct_choice_id: 'b',
    explanation_en:
      'Inference means drawing a logical conclusion from given information. Someone who reviews every night for two months shows strong dedication and goal-direction — most likely she is "Committed to passing." There is no evidence she is unprepared, avoiding the exam, or on vacation; in fact, the evidence directly contradicts those conclusions.',
    explanation_fil:
      'Ang inference ay ang paggawa ng lohikal na konklusyon mula sa ibinigay na impormasyon. Ang isang taong nag-aaral tuwing gabi nang dalawang buwan ay nagpapakita ng determinasyon — malamang siya ay "Committed to passing." Walang ebidensya na hindi siya handa, umiiwas sa eksamen, o nasa bakasyon; sa katunayan, direktang nagkakasalungat ang ebidensya sa mga iyon.',
  },

  {
    id: 'f485e8eb-5aca-4367-b865-97f723cd66e4',
    stem: 'If an author states a fact then gives an example, the example mainly:',
    correct_choice_id: 'b',
    explanation_en:
      'When a writer presents a fact and then gives an example, the example serves to illustrate or support the fact — making it easier to understand. This is a basic reading comprehension and text structure skill tested in the CSE. Examples clarify; they don\'t contradict, replace conclusions, or introduce new topics.',
    explanation_fil:
      'Kapag nagbigay ng katotohanan ang manunulat at sinundan ito ng halimbawa, ang halimbawa ay nagsisilbing paliwanag o patunay ng katotohanan — upang maging mas madaling maunawaan. Ito ay pangunahing kasanayan sa reading comprehension at text structure na tinatanong sa CSE. Ang mga halimbawa ay nagliliwanag; hindi nila kinalaban, pinapalitan ng konklusyon, o pinakilala ng bagong paksa.',
  },

  // ── CSE PROFESSIONAL — VERBAL: Verbal Comprehension ──────────────────────────

  {
    id: '3121d285-7f8b-4b55-aaf2-4ead2f76da38',
    stem: 'Analogy: BOOK is to LIBRARY as CAR is to ___',
    correct_choice_id: 'b',
    explanation_en:
      'The relationship is: a BOOK is stored/kept in a LIBRARY. Similarly, a CAR is stored/kept in a GARAGE. The analogy tests the "object to its storage place" relationship. "Road" is where a car travels; "Driver" operates it; "Fuel" powers it — none are storage places.',
    explanation_fil:
      'Ang relasyon ay: ang BOOK ay inilalagay/iniingatan sa LIBRARY. Gayundin, ang CAR ay inilalagay/iniingatan sa GARAGE. Tinutukoy ng analogy ang relasyong "bagay sa lugar ng pag-iingat nito." "Road" ay lugar ng pagbiyahe; "Driver" ang nagpapatakbo; "Fuel" ang nagbibigay ng lakas — wala sa ito ang lugar ng pag-iingat.',
  },

  {
    id: 'f4eda5d2-4937-4985-944e-35b022083060',
    stem: 'Sentence completion: "Despite the rain, the parade ___ as scheduled."',
    correct_choice_id: 'b',
    explanation_en:
      '"Proceeded" is correct. "Despite the rain" signals a contrast — something happened even though rain would normally prevent it. "Proceeded" (continued forward) fits this contrast logically. "Cancelled" would remove the contrast (rain → cancelled is expected). "Forgot" and "delayed indefinitely" don\'t fit the idea that it happened "as scheduled."',
    explanation_fil:
      '"Proceeded" ang tama. Nagpapakita ng kontraste ang "Despite the rain" — may nangyari kahit na karaniwan ay mapipigilan ng ulan. Angkop ang "proceeded" (nagpatuloy) sa kontrasteng ito. Ang "Cancelled" ay inaasahan na resulta ng ulan (walang kontraste). Ang "Forgot" at "delayed indefinitely" ay hindi naaayon sa "as scheduled."',
  },

  {
    id: '3ca831a5-4eff-42c7-b35d-63f00c6a9bb6',
    stem: 'OCEAN is most related to:',
    correct_choice_id: 'b',
    explanation_en:
      'An ocean is a vast body of saltwater — "Water" is its most essential and direct association. This is a verbal comprehension question testing categorical and functional relationships. "Desert" is a dry land area (opposite). "Mountain" is a land formation. "City" is a human settlement. None are as fundamental to the concept of ocean as water.',
    explanation_fil:
      'Ang ocean ay isang malawak na katawan ng alat na tubig — "Water" ang pinaka-direkta at pangunahing kaugnayan nito. Tinutukoy ng tanong na ito ang kategoryal at functional na relasyon. "Desert" ay tuyong lupain (kabaligtaran). "Mountain" ay landform. "City" ay tirahan ng tao. Wala sa mga ito ang kasing-pundamental ng tubig sa konsepto ng ocean.',
  },

  {
    id: '1cdf0dfb-c8d8-4caa-8f97-ad9ea39b33dd',
    stem: 'Analogy: TEACHER is to SCHOOL as DOCTOR is to ___',
    correct_choice_id: 'b',
    explanation_en:
      'A TEACHER works in a SCHOOL; similarly, a DOCTOR works in a HOSPITAL. This analogy tests the "professional to their primary workplace" relationship. "Medicine" is the field, "Patient" is the client, and "Stethoscope" is a tool — none are the primary workplace of a doctor.',
    explanation_fil:
      'Ang TEACHER ay nagtatrabaho sa SCHOOL; gayundin, ang DOCTOR ay nagtatrabaho sa HOSPITAL. Tinutukoy ng analogy ang relasyong "propesyonal sa pangunahing lugar ng trabaho." "Medicine" ang larangan, "Patient" ang kliyente, at "Stethoscope" ang kasangkapan — wala sa ito ang pangunahing lugar ng trabaho ng doktor.',
  },

  {
    id: '8b6044ec-d3b0-48f2-8912-b4d495762f6d',
    stem: 'Which word is most associated with LEGISLATURE?',
    correct_choice_id: 'b',
    explanation_en:
      '"Congress" is the Philippine legislature — the body that makes laws. The Legislature is the law-making branch of government. "Court" is associated with the Judiciary. "Police" is under the Executive. "Mayor" is a local government executive. In the Philippine context, the Legislature = Congress (Senate + House of Representatives).',
    explanation_fil:
      '"Congress" ang lehislatura ng Pilipinas — ang katawang gumagawa ng batas. Ang Legislature ay ang sangay ng pamahalaan na gumagawa ng batas. "Court" ay kaugnay ng Judiciary. "Police" ay nasa Executive. "Mayor" ay lokal na ehekutibo. Sa kontekstong Pilipino, Legislature = Kongreso (Senado + Kapulungan).',
  },

  // ── CSE PROFESSIONAL — ANALYTICAL ────────────────────────────────────────────

  {
    id: 'c9b44229-beff-4d92-af13-dd096c18056c',
    stem: 'Conclusion: "If it rains, the outdoor drill is cancelled. It rained." Therefore:',
    correct_choice_id: 'a',
    explanation_en:
      'This is a logical deduction (modus ponens): Premise 1: If P then Q. Premise 2: P occurred. Conclusion: Q must occur. "If it rains (P) → drill cancelled (Q). It rained (P). Therefore the drill is cancelled (Q)." This is a valid deductive argument and a common analytical reasoning pattern in the CSE.',
    explanation_fil:
      'Ito ay lohikal na pagbabawas (modus ponens): Premise 1: Kung P kung gayon Q. Premise 2: Nangyari ang P. Konklusyon: Nangyari ang Q. "Kung umuulan (P) → nakansela ang drill (Q). Umuulan (P). Samakatuwid nakansela ang drill (Q)." Ito ay wastong deductive argument at karaniwang pattern sa analytical reasoning ng CSE.',
  },

  {
    id: '9b79fd13-608f-40a5-8df2-81520f66b7b4',
    stem: 'All managers are employees. Juan is a manager. Therefore Juan is ___',
    correct_choice_id: 'b',
    explanation_en:
      'This is a categorical syllogism. If all members of Group A (managers) are also members of Group B (employees), and Juan belongs to Group A, then Juan must also belong to Group B. Juan is therefore an employee. This type of question tests deductive reasoning and set logic in the CSE analytical section.',
    explanation_fil:
      'Ito ay categorical syllogism. Kung lahat ng miyembro ng Grupo A (managers) ay miyembro din ng Grupo B (employees), at si Juan ay kabilang sa Grupo A, si Juan ay kabilang din sa Grupo B. Kaya empleyado si Juan. Tinutukoy ng ganitong tanong ang deductive reasoning at set logic sa analytical section ng CSE.',
  },

  {
    id: '3a91b961-0acf-401c-803e-13cf36cad31b',
    stem: 'Which is a valid syllogism?',
    correct_choice_id: 'b',
    explanation_en:
      '"All birds have wings. A sparrow is a bird. So a sparrow has wings." is logically valid — if all members of a group share a property, and X belongs to that group, X has that property. A: False premises make the conclusion false. C: "Some dogs are cats" is false, making the whole argument invalid. A valid syllogism requires true and consistent premises that necessarily lead to the conclusion.',
    explanation_fil:
      '"All birds have wings. A sparrow is a bird. So a sparrow has wings." ay lohikal na wastong syllogism — kung lahat ng miyembro ng isang grupo ay may katangian, at X ay miyembro ng grupong iyon, mayroon ding katangian si X. A: Ang maling premises ay nagdudulot ng maling konklusyon. C: Mali ang "Some dogs are cats", kaya hindi wasto ang argumento. Ang wastong syllogism ay nangangailangan ng tunay at konsistenteng mga premises.',
  },

  // ── CSE PROFESSIONAL — NUMERICAL ─────────────────────────────────────────────

  {
    id: '02df7948-34a3-4d97-b085-29ae85fad185',
    stem: 'Average of 8, 10, and 12 is:',
    correct_choice_id: 'c',
    explanation_en:
      'Average (mean) = Sum ÷ Count. Sum = 8 + 10 + 12 = 30. Count = 3. Average = 30 ÷ 3 = 10. This is the most fundamental numerical ability question type in the CSE — always: add all values, then divide by how many there are.',
    explanation_fil:
      'Average (mean) = Kabuuan ÷ Bilang. Kabuuan = 8 + 10 + 12 = 30. Bilang = 3. Average = 30 ÷ 3 = 10. Ito ang pinaka-pangunahing uri ng tanong sa numerical ability ng CSE — palagi: idagdag ang lahat ng halaga, pagkatapos ay hatiin sa bilang ng mga ito.',
  },

  {
    id: '6e774d46-193f-4194-a0da-aeee539deb55',
    stem: 'Simplify: 3/4 + 1/8',
    correct_choice_id: 'b',
    explanation_en:
      'To add fractions, find a common denominator. LCD of 4 and 8 is 8. Convert: 3/4 = 6/8. Then: 6/8 + 1/8 = 7/8. Answer: 7/8. Tip: When denominators are related (4 is a factor of 8), multiply numerator and denominator of the smaller denominator fraction to match — 3×2/(4×2) = 6/8.',
    explanation_fil:
      'Sa pagdaragdag ng mga fraction, hanapin ang common denominator. Ang LCD ng 4 at 8 ay 8. I-convert: 3/4 = 6/8. Pagkatapos: 6/8 + 1/8 = 7/8. Sagot: 7/8. Tip: Kapag magkaugnay ang mga denominator (salik ng isa ang isa pa), i-multiply ang numerator at denominator ng fraction na may maliit na denominator upang magtugma.',
  },

  {
    id: '1b78d419-e202-4dcb-99c9-2dd5dfb50a2c',
    stem: 'Complete the series: 2, 4, 6, 8, __',
    correct_choice_id: 'b',
    explanation_en:
      'The pattern is: add 2 to each term. 2 → 4 → 6 → 8 → 10. This is a simple arithmetic sequence with a common difference of +2. The next number is 8 + 2 = 10.',
    explanation_fil:
      'Ang pattern ay: dagdagan ng 2 ang bawat termino. 2 → 4 → 6 → 8 → 10. Ito ay simpleng arithmetic sequence na may common difference na +2. Ang susunod na numero ay 8 + 2 = 10.',
  },

  {
    id: '16aaf7cf-ff90-45f7-b387-a204492a7a3a',
    stem: 'Complete: 100, 95, 90, 85, __',
    correct_choice_id: 'a',
    explanation_en:
      'The pattern is: subtract 5 from each term. 100 → 95 → 90 → 85 → 80. This is a decreasing arithmetic sequence with a common difference of −5. The next number is 85 − 5 = 80.',
    explanation_fil:
      'Ang pattern ay: ibawas ng 5 sa bawat termino. 100 → 95 → 90 → 85 → 80. Ito ay pababang arithmetic sequence na may common difference na −5. Ang susunod na numero ay 85 − 5 = 80.',
  },

  {
    id: 'c882be2a-8335-4299-a8b5-5b43f500e086',
    stem: 'If 3 workers finish a job in 12 days, how long for 6 workers at the same rate?',
    correct_choice_id: 'c',
    explanation_en:
      'Total work = workers × days. 3 workers × 12 days = 36 worker-days of work. With 6 workers: 36 ÷ 6 = 6 days. This is an inverse proportion problem — as workers increase, days decrease proportionally. Double the workers = half the time: 12 ÷ 2 = 6 days.',
    explanation_fil:
      'Kabuuang gawa = manggagawa × araw. 3 manggagawa × 12 araw = 36 manggagawa-araw. Sa 6 manggagawa: 36 ÷ 6 = 6 araw. Ito ay inverse proportion — habang dumarami ang manggagawa, bumababa ang araw. Doble ang manggagawa = kalahati ng oras: 12 ÷ 2 = 6 araw.',
  },

  // ── CSE SUBPROFESSIONAL ───────────────────────────────────────────────────────

  {
    id: '306862f2-4d93-4cc4-8829-d18880711bde',
    stem: 'What does CSC stand for?',
    correct_choice_id: 'a',
    explanation_en:
      'CSC stands for Civil Service Commission — the central personnel agency of the Philippine government. It is responsible for administering the Civil Service Examination (CSE) and establishing policies on all aspects of human resource management in the civil service. It was established under Article IX-B of the 1987 Constitution.',
    explanation_fil:
      'Ang CSC ay Civil Service Commission — ang sentral na ahensya ng tauhan ng pamahalaan ng Pilipinas. Responsable ito sa pamamahala ng Civil Service Examination (CSE) at sa pagtatatag ng mga patakaran sa lahat ng aspeto ng pamamahala ng human resource sa serbisyong sibil. Itinatag ito sa ilalim ng Artikulo IX-B ng Konstitusyon ng 1987.',
  },

  {
    id: '890d968e-76b6-4952-a008-32b8fee88587',
    stem: 'Arrange logically: (1) Pay fare (2) Board jeep (3) Wait at stop (4) Arrive',
    correct_choice_id: 'a',   // FIXED: was 'b' — correct is 3-2-1-4
    explanation_en:
      'The logical order is: 3-2-1-4. You first wait at the jeepney stop (3), then board the jeepney (2), then pay the fare while riding (1), then arrive at your destination (4). In Philippine jeepney culture, passengers board first and pass the fare to the driver or conductor while seated — you do not pay before boarding.',
    explanation_fil:
      'Ang lohikal na pagkakasunod ay: 3-2-1-4. Unang maghintay sa hintuan (3), sumakay sa jeep (2), magbayad ng pamasahe habang nakasakay (1), pagkatapos ay dumating sa destinasyon (4). Sa kultura ng jeepney sa Pilipinas, ang mga pasahero ay sumasakay muna at ipinupasa ang bayad sa driver o conductor habang nakaupo — hindi muna nagbabayad bago sumakay.',
  },

  {
    id: '1bbf2813-8153-4683-b823-1a119aa9fad5',
    stem: 'If 5 pens cost ₱60, how much do 8 pens cost?',
    correct_choice_id: 'b',
    explanation_en:
      'Unit price = ₱60 ÷ 5 = ₱12 per pen. Cost of 8 pens = 8 × ₱12 = ₱96. This is a direct proportion problem. As the number of pens increases, the cost increases proportionally. Always find the unit price first, then multiply.',
    explanation_fil:
      'Presyo ng isa = ₱60 ÷ 5 = ₱12 bawat bolpen. Gastos sa 8 bolpen = 8 × ₱12 = ₱96. Ito ay direct proportion na problema. Habang dumadami ang bilang ng bolpen, dumadami rin ang gastos. Palagi munang hanapin ang unit price, pagkatapos ay i-multiply.',
  },

  {
    id: '9b91cb9f-19ac-46ec-958b-701959e09118',
    stem: 'Who is the head of the Executive branch?',
    correct_choice_id: 'c',
    explanation_en:
      'The President of the Philippines is the head of the Executive branch. Under Article VII of the 1987 Constitution, executive power is vested in the President. The Chief Justice heads the Judiciary; the Senate President leads the Senate (part of the Legislative branch); the Ombudsman investigates and prosecutes public officials.',
    explanation_fil:
      'Ang Pangulo ng Pilipinas ang pinuno ng Executive branch. Sa ilalim ng Artikulo VII ng Konstitusyon ng 1987, ang kapangyarihang ehekutibo ay napaloob sa Pangulo. Ang Chief Justice ang nangunguna sa Judiciary; ang Senate President ang nangunguna sa Senado (bahagi ng Legislative branch); ang Ombudsman ay nag-iimbestigasyon at nagusekuta ng mga opisyal ng pamahalaan.',
  },

  {
    id: 'c9c7265b-a6e2-471c-9731-4f08e7979c21',
    stem: 'Which file extension usually indicates a spreadsheet?',
    correct_choice_id: 'c',
    explanation_en:
      '".xlsx" is the Microsoft Excel spreadsheet format (.xls is the older version). Spreadsheets are used for calculations, data tables, and charts. ".docx" is for Microsoft Word documents; ".pdf" is Portable Document Format (read-only); ".mp3" is an audio file format.',
    explanation_fil:
      '".xlsx" ang format ng Microsoft Excel spreadsheet (.xls ang lumang bersyon). Ginagamit ang spreadsheet para sa mga kalkulasyon, talahanayan ng datos, at tsart. ".docx" ay para sa Microsoft Word na dokumento; ".pdf" ay Portable Document Format (read-only); ".mp3" ay audio file format.',
  },

  // ── LET ELEMENTARY ───────────────────────────────────────────────────────────

  {
    id: '59c08070-8bd9-4ed9-9af3-af00c7ce377b',
    stem: 'Republic Act 7836 is also known as the ___ Act.',
    correct_choice_id: 'b',
    explanation_en:
      'RA 7836, enacted in 1994, is the "Philippine Teachers Professionalization Act of 1994." It professionalized teaching in the Philippines, required LET (Licensure Examination for Teachers), and established the Board for Professional Teachers under the PRC. Every LET examinee should know this law.',
    explanation_fil:
      'Ang RA 7836, na itinakda noong 1994, ay ang "Philippine Teachers Professionalization Act of 1994." Pinropesyonal nito ang pagtuturo sa Pilipinas, kinakailangan ang LET (Licensure Examination for Teachers), at itinatag ang Board for Professional Teachers sa ilalim ng PRC. Dapat malaman ito ng bawat LET examinee.',
  },

  {
    id: 'b218a7b1-dc94-46ec-9d84-53dc8dd74ec4',
    stem: 'Which domain covers classroom management strategies?',
    correct_choice_id: 'b',
    explanation_en:
      '"Pedagogy" (the art and science of teaching) covers classroom management strategies. Pedagogy deals with how teachers teach — methods, strategies, classroom environment, and learner guidance. "Content" refers to subject matter knowledge. "Technology" refers to instructional tools. "Andragogy" refers specifically to adult learning theory.',
    explanation_fil:
      '"Pedagogy" (sining at agham ng pagtuturo) ang sumasaklaw sa mga estratehiya ng pamamahala ng silid-aralan. Ang pedagogy ay tumutukoy sa paraan ng pagtuturo — mga pamamaraan, estratehiya, kapaligiran ng silid-aralan, at gabay sa mga mag-aaral. "Content" ay kaalaman sa paksa. "Technology" ay mga kasangkapan sa pagtuturo. "Andragogy" ay espesipikong teorya ng pag-aaral ng mga matatanda.',
  },

  {
    id: 'c532d6f2-591d-4712-827e-a8dda41d1f1b',
    stem: 'What does "scaffolding" mean in teaching?',
    correct_choice_id: 'b',
    explanation_en:
      'Scaffolding in education means providing temporary, structured support to learners until they can perform a task independently — then gradually removing the support (like construction scaffolding). It is based on Vygotsky\'s Zone of Proximal Development (ZPD). The teacher provides hints, questions, models, and feedback, then fades support as the learner gains mastery.',
    explanation_fil:
      'Sa edukasyon, ang scaffolding ay ang pagbibigay ng pansamantalang nakabalangkas na suporta sa mga mag-aaral hanggang kaya na nilang gawin ang isang gawain nang nagsasarili — pagkatapos ay unti-unting tinatanggal ang suporta (tulad ng scaffolding sa konstruksyon). Ito ay batay sa Zone of Proximal Development (ZPD) ni Vygotsky. Nagbibigay ng pahiwatig, tanong, halimbawa, at feedback ang guro, pagkatapos ay binabawasan ang tulong habang natututo ang mag-aaral.',
  },

  {
    id: 'd09c814d-6810-4c1a-b6e8-efd4b51f5bbb',
    stem: 'Which is a formative assessment?',
    correct_choice_id: 'b',
    explanation_en:
      'Formative assessment is ongoing assessment used to monitor student learning and provide feedback during instruction — not to give a final grade. "Weekly quiz for feedback" is formative because it happens during the learning process and guides teaching. Final exams, board exams, and graduation tests are summative assessments (given at the end to evaluate overall learning).',
    explanation_fil:
      'Ang formative assessment ay tuloy-tuloy na pagtatasa na ginagamit upang subaybayan ang pag-aaral ng estudyante at magbigay ng feedback sa panahon ng pagtuturo — hindi para sa panghuling marka. Ang "Weekly quiz for feedback" ay formative dahil nangyayari ito sa panahon ng proseso ng pag-aaral at gumagabay sa pagtuturo. Ang mga final exam, board exam, at graduation test ay summative assessment (ibinibigay sa katapusan upang suriin ang pangkalahatang pag-aaral).',
  },

  {
    id: 'fa5d98f6-1695-474c-9df8-b210dcc9707d',
    stem: 'The K to 12 program added ___ years to basic education.',
    correct_choice_id: 'b',
    explanation_en:
      'The K to 12 program (Republic Act 10533, signed in 2013) added 2 years of Senior High School (Grade 11 and Grade 12) to the Philippine basic education system, extending it from 10 years to 12 years. It also added Kindergarten as a compulsory year, making the complete cycle K + 6 + 4 + 2 = 13 years total.',
    explanation_fil:
      'Ang K to 12 program (Republic Act 10533, nilagdaan noong 2013) ay nagdagdag ng 2 taon ng Senior High School (Grade 11 at Grade 12) sa sistema ng pangunahing edukasyon ng Pilipinas, pinahaba ito mula 10 taon patungong 12 taon. Nagdagdag din ng Kindergarten bilang sapilitang taon, na ginawa ang kumpletong siklo na K + 6 + 4 + 2 = 13 taon sa kabuuan.',
  },

  // ── LET SECONDARY ────────────────────────────────────────────────────────────

  {
    id: '3759cd46-613d-4170-a9ba-c4cda29ba816',
    stem: 'LET Secondary includes a major field component for ___ specialization.',
    correct_choice_id: 'b',
    explanation_en:
      'LET Secondary has three components: General Education (Gen Ed), Professional Education (Prof Ed), and Major/Specialization. The Major component tests the teacher candidate\'s mastery of their specific teaching specialization (e.g., Mathematics, English, Filipino, Science, TLE, etc.). It comprises 40% of the exam weight.',
    explanation_fil:
      'Ang LET Secondary ay may tatlong bahagi: General Education (Gen Ed), Professional Education (Prof Ed), at Major/Specialization. Ang Major component ay sumusubok sa kaalaman ng teacher candidate sa kanilang tiyak na espesyalidad sa pagtuturo (hal. Matematika, Ingles, Filipino, Agham, TLE, atbp.). Ito ay 40% ng bigat ng eksamen.',
  },

  {
    id: 'd9ce7400-115f-415c-b21f-d9985be29ba5',
    stem: "Which is a higher-order thinking skill in Bloom's taxonomy?",
    correct_choice_id: 'c',
    explanation_en:
      "Bloom's Revised Taxonomy (2001) has six levels from lowest to highest: Remember → Understand → Apply → Analyze → Evaluate → Create. \"Evaluate\" (making judgments based on criteria) is a higher-order thinking skill (HOTS). \"Recall,\" \"Define,\" and \"List\" are lower-order skills at the Remember level.",
    explanation_fil:
      "Ang Bloom's Revised Taxonomy (2001) ay may anim na antas mula sa pinakamababa hanggang sa pinakamataas: Remember → Understand → Apply → Analyze → Evaluate → Create. Ang \"Evaluate\" (paggawa ng hatol batay sa pamantayan) ay higher-order thinking skill (HOTS). Ang \"Recall,\" \"Define,\" at \"List\" ay lower-order skills sa antas ng Remember.",
  },

  {
    id: '37f6fca3-6519-4186-9311-53383367992a',
    stem: 'In lesson planning, objectives should be ___.',
    correct_choice_id: 'b',
    explanation_en:
      'Learning objectives should be SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. "Measurable" objectives allow teachers to assess whether learning occurred. Vague objectives cannot be assessed; optional objectives undermine accountability; identical objectives ignore learner diversity. The CSE/LET frequently tests lesson planning principles.',
    explanation_fil:
      'Ang mga layunin sa pag-aaral ay dapat na SMART: Specific, Measurable, Achievable, Relevant, at Time-bound. Ang "Measurable" na mga layunin ay nagpapahintulot sa mga guro na masuri kung may natutunang. Ang malabong mga layunin ay hindi masusukat; ang opsyonal na mga layunin ay nagpapahina ng responsibilidad; ang magkaparehong mga layunin ay nagwawalang-bahala sa pagkakaiba-iba ng mga mag-aaral.',
  },

  {
    id: '0105e54b-0eb1-4fbe-bd0f-75e047d56677',
    stem: 'Which law strengthens Philippine basic education?',
    correct_choice_id: 'b',
    explanation_en:
      'RA 10533 is the "Enhanced Basic Education Act of 2013" — the K to 12 law that strengthened Philippine basic education by extending it to 13 years (Kindergarten + 6 years Elementary + 4 years Junior High School + 2 years Senior High School). RA 9163 is the National Service Training Program Act; RA 6713 is the Code of Conduct for Government Officials; RA 10121 is the NDRRMC Law.',
    explanation_fil:
      'Ang RA 10533 ay ang "Enhanced Basic Education Act of 2013" — ang K to 12 batas na nagpalakas ng pangunahing edukasyon ng Pilipinas sa pamamagitan ng pagpapalawak nito sa 13 taon (Kindergarten + 6 taon Elementary + 4 taon Junior High School + 2 taon Senior High School). Ang RA 9163 ay National Service Training Program Act; RA 6713 ay Code of Conduct; RA 10121 ay NDRRMC Law.',
  },

  {
    id: '0a7b6467-8de5-4f2d-bcba-c89fcae6971c',
    stem: 'Differentiated instruction adjusts content, process, and ___.',
    correct_choice_id: 'a',
    explanation_en:
      'Differentiated Instruction (DI) adjusts three elements to meet diverse learner needs: Content (what students learn), Process (how they learn it), and Product (how they demonstrate learning). Tomlinson\'s DI framework is a core LET Prof Ed topic. "Budget," "building," and "schedule only" are not components of differentiated instruction.',
    explanation_fil:
      'Ang Differentiated Instruction (DI) ay nag-aayos ng tatlong elemento upang matugunan ang iba\'t ibang pangangailangan ng mga mag-aaral: Content (ano ang natutunang ng mga estudyante), Process (paano nila ito natututunan), at Product (paano nila ipinakikita ang natutunang). Ang DI framework ni Tomlinson ay pangunahing paksa sa LET Prof Ed. Ang "Budget," "building," at "schedule only" ay hindi bahagi ng differentiated instruction.',
  },

  // ── PNLE ─────────────────────────────────────────────────────────────────────

  {
    id: '15731c49-e261-4524-b6cb-08a6fd4b3be6',
    stem: 'Primary health care emphasizes ___ prevention.',
    correct_choice_id: 'c',
    explanation_en:
      'Primary Health Care (PHC), as defined in the Alma Ata Declaration (1978), emphasizes primary prevention — preventing disease before it occurs through health promotion and specific protection (e.g., immunization, health education). Secondary prevention detects disease early; tertiary prevention manages established disease and prevents complications.',
    explanation_fil:
      'Ang Primary Health Care (PHC), ayon sa Alma Ata Declaration (1978), ay nagbibigay-diin sa primary prevention — pag-iwas sa sakit bago pa ito mangyari sa pamamagitan ng health promotion at tiyak na proteksyon (hal. immunization, health education). Ang secondary prevention ay maagang pagtuklas ng sakit; ang tertiary prevention ay pamamahala ng naitatag na sakit at pag-iwas sa mga komplikasyon.',
  },

  {
    id: '84869f46-6d5c-4397-84d7-03ba87cb93e2',
    stem: 'Which vaccine is given at birth to prevent tuberculosis?',
    correct_choice_id: 'b',
    explanation_en:
      'BCG (Bacillus Calmette–Guérin) is given at birth to protect against tuberculosis (TB), particularly TB meningitis and miliary TB in children. It is part of the Expanded Program on Immunization (EPI) in the Philippines. MMR prevents measles, mumps, rubella; OPV prevents polio; Hepatitis A vaccine is given later in life.',
    explanation_fil:
      'Ang BCG (Bacillus Calmette–Guérin) ay ibinibigay sa kapanganakan upang maprotektahan laban sa tuberculosis (TB), lalo na ang TB meningitis at miliary TB sa mga bata. Ito ay bahagi ng Expanded Program on Immunization (EPI) sa Pilipinas. Ang MMR ay pumipigil sa measles, mumps, rubella; ang OPV ay pumipigil sa polio; ang Hepatitis A vaccine ay ibinibigay sa bandang huli sa buhay.',
  },

  {
    id: 'f1a45596-ad00-47f3-953f-70e788d59dff',
    stem: 'The nursing process starts with ___.',
    correct_choice_id: 'b',
    explanation_en:
      'The nursing process follows five steps: Assessment → Diagnosis → Planning → Implementation → Evaluation (ADPIE). Assessment comes first — the nurse gathers comprehensive data about the patient\'s health status. Without accurate assessment, the other steps cannot be performed correctly. This is a foundational PNLE concept.',
    explanation_fil:
      'Ang nursing process ay sumusunod sa limang hakbang: Assessment → Diagnosis → Planning → Implementation → Evaluation (ADPIE). Ang Assessment ang una — kinokolekta ng nars ang komprehensibong datos tungkol sa kalusugan ng pasyente. Kung walang tumpak na assessment, hindi wastong maisasagawa ang iba pang mga hakbang. Ito ay pangunahing konsepto sa PNLE.',
  },

  {
    id: '534962c3-e091-4b2e-9a6a-be1c0c5969d0',
    stem: 'Barangay health workers are part of ___ health care delivery.',
    correct_choice_id: 'a',
    explanation_en:
      'Barangay Health Workers (BHWs) are community-based volunteers trained to provide basic health services at the community level. They are the backbone of community health care delivery in the Philippines, serving as the link between the formal health system and the community. This is part of the Philippine primary health care system under the DOH.',
    explanation_fil:
      'Ang mga Barangay Health Worker (BHW) ay mga boluntaryong nakabatay sa komunidad na sinanay upang magbigay ng pangunahing serbisyong pangkalusugan sa antas ng komunidad. Sila ang gulugod ng paghahatid ng community health care sa Pilipinas, nagsisilbing ugnayan sa pagitan ng pormal na sistema ng kalusugan at ng komunidad. Ito ay bahagi ng sistema ng pangunahing pangangalagang pangkalusugan ng Pilipinas sa ilalim ng DOH.',
  },

  {
    id: '62717f78-60b7-4c5d-a6fb-0271f070da0d',
    stem: 'Hand hygiene is most effective with soap and ___.',
    correct_choice_id: 'b',
    explanation_en:
      'The WHO and CDC recommend handwashing with soap and running water (clean, flowing water) as the most effective method of hand hygiene. Running water physically removes pathogens from hands. Alcohol-based hand rubs are an acceptable alternative when soap and water are not available, but running water is preferred for visibly soiled hands.',
    explanation_fil:
      'Ang WHO at CDC ay nagrerekomenda ng paghuhugas ng kamay gamit ang sabon at tubig na umaagos (malinis, dumadaloy na tubig) bilang pinaka-epektibong paraan ng hand hygiene. Ang tubig na umaagos ay pisikal na nag-aalis ng mga pathogen mula sa mga kamay. Ang alcohol-based hand rubs ay katanggap-tanggap na alternatibo kapag walang sabon at tubig, ngunit mas ginusto ang tubig na umaagos para sa mga kamay na may nakikitang dumi.',
  },
];

// ─── Run updates ───────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

for (const patch of PATCHES) {
  const { id, stem, correct_choice_id, explanation_en, explanation_fil } = patch;
  const { error } = await supabase
    .from('questions')
    .update({ stem, correct_choice_id, explanation_en, explanation_fil })
    .eq('id', id);

  if (error) {
    console.error(`❌  FAILED ${id.slice(0, 8)}: ${error.message}`);
    failed++;
  } else {
    console.log(`✅  ${id.slice(0, 8)}  ${stem.slice(0, 60)}`);
    passed++;
  }
}

console.log(`\nDone: ${passed} updated, ${failed} failed.`);
