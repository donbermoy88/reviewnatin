/**
 * CSE Flashcards — Professional, Complete, Comprehensive
 * Covers all major CSE Professional and Sub-Professional topic areas.
 * ~500+ flashcards spanning grammar, vocabulary, Filipino language,
 * constitution, numerical reasoning, analytical, and clerical skills.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Topic IDs (verified against DB) ─────────────────────────────────────────
const T = {
  // CSE Professional
  PRO_grammar:          '90ba4b46-caf1-41bc-9039-1cfbc2e0baf1',
  PRO_vocabulary:       '1cd5d867-5041-4810-bad0-a911323ced1f',
  PRO_paragraph_org:    '0e22fcfd-195f-475c-8df5-5584e229cbee',
  PRO_reading_comp:     '5d338572-e1e8-4792-a5e3-017309c9e6b7',
  PRO_verbal_comp:      'e35bd4ee-073a-491b-b7b1-69dd7811e50b',
  PRO_vocab_fil:        'c2808ba1-5ba9-449c-afbf-a4dbd1d248dd',
  PRO_grammar_fil:      'd3b160b3-f0e1-4fd4-a9d8-c8dcbc401c79',
  PRO_reading_fil:      '43399734-967c-444c-b583-b68fdff2de1c',
  PRO_paragraph_fil:    '867c0551-9aa4-4dad-a4fc-bc8d8d6eada4',
  PRO_word_assoc:       '93402385-8ef0-4369-ba42-5883dcd52fbf',
  PRO_assumptions:      '2c63e431-c2d8-4c52-9ed3-8155216bdb23',
  PRO_logic:            '42afbfbc-eb26-4470-8482-3139e2a888aa',
  PRO_data_interp:      'df65e506-4990-4575-b4c0-bade603612a8',
  PRO_basic_ops:        'fee58356-630c-416c-8c5c-3dbfaeb28804',
  PRO_number_series:    '05987dfb-0f8e-4f74-a026-846b26347bcb',
  PRO_word_problems:    '097e3e89-db17-4f8f-ab8f-c816e9a11c80',
  PRO_constitution:     '66b572bd-cfb1-469e-84e2-bb73d33b2309',
  PRO_ra6713:           '9a1e25cb-c571-4785-b46b-04255a88261f',
  PRO_peace:            '1c356aaa-aaad-4815-ba83-cddce482201e',
  PRO_environment:      'a22c09fe-a0a0-4c97-ad90-c2944de0dc2e',
  // CSE Sub-Professional
  SUB_grammar:          'd5388143-2857-4f97-bb76-8dd02f42a982',
  SUB_vocabulary:       'd32d7e74-2958-4e1e-9049-2901156a0a06',
  SUB_reading_comp:     '4e85b207-50d3-4e8b-8675-f3a56db77370',
  SUB_paragraph_org:    '539b1777-4f5d-40a8-8a04-703038f1653a',
  SUB_vocab_fil:        'e4856eb1-2eaf-45e7-92b3-85953623a847',
  SUB_grammar_fil:      'd6e97a36-5e2f-4a98-a363-abefdcf7ab62',
  SUB_reading_fil:      '679fffb1-c0ca-46e8-93e2-f0c35874b960',
  SUB_paragraph_fil:    '9b226eb5-beb6-41ac-b92e-b666294126a3',
  SUB_word_problems:    '388e380d-69cb-4d91-b071-e7fde8c44e47',
  SUB_basic_ops:        '8ba47590-7a27-4576-a849-60baf7826152',
  SUB_number_series:    'dec5d971-da1e-40cf-b359-d533e4160b02',
  SUB_phil_gov:         'deb97a8a-da6a-4175-af1d-4b4d3eb937f8',
  SUB_laws_ethics:      'bc89d6de-05dd-43ec-9ec4-9a84229e6298',
  SUB_filing:           '38ae46c3-4cdd-4a65-8a11-3aaf01921f57',
  SUB_spelling:         '55bc7cff-808b-48b7-97cb-1cb93ca1e5ee',
};

function fc(topicId, front, back) {
  return { topic_id: topicId, front, back, is_premium: false };
}

// ── ENGLISH GRAMMAR ──────────────────────────────────────────────────────────
const grammarCards = [
  fc(T.PRO_grammar, 'What is subject-verb agreement?', 'The rule that a verb must agree in number (singular or plural) with its subject. Singular subjects take singular verbs; plural subjects take plural verbs.\nExample: "She runs" (not "She run"). "They run" (not "They runs").'),
  fc(T.PRO_grammar, 'Which verb is correct? "Each of the students ___ responsible."\nA. are  B. is', 'B. is\nExplanation: "Each" is an indefinite pronoun that always takes a SINGULAR verb. "Each of the students IS responsible." Other always-singular indefinite pronouns: everyone, nobody, anything, someone.'),
  fc(T.PRO_grammar, 'Which verb is correct? "Neither the manager nor the employees ___ informed."\nA. was  B. were', 'B. were\nExplanation: With "neither…nor" and "either…or," the verb agrees with the subject CLOSEST to the verb. "Employees" (plural) is closest, so use "were." Rule: Proximity governs agreement.'),
  fc(T.PRO_grammar, 'What is the correct form? "The committee ___ reached a decision."\nA. has  B. have', 'A. has\nExplanation: In American English, collective nouns (committee, team, jury, staff, class) act as single units and take SINGULAR verbs. In British English, collective nouns often take plural verbs.'),
  fc(T.PRO_grammar, 'Identify the error: "The data shows a significant increase in sales."\nA. data  B. shows  C. significant  D. No error', 'B. shows\n"Data" is the plural form of "datum." Correct: "The data SHOW a significant increase." However, in modern usage, "data" is increasingly treated as uncountable/singular. In formal/academic writing and CSE exams, use the plural: "the data show."'),
  fc(T.PRO_grammar, 'What is a dangling modifier?', 'A modifier that has no clear word to modify in the sentence.\nExample: "Running down the street, the rain began to fall." (The rain was not running.)\nCorrect: "Running down the street, I felt the rain begin to fall."'),
  fc(T.PRO_grammar, 'What is the difference between "who" and "whom"?', '"Who" is a subject pronoun (does the action). "Whom" is an object pronoun (receives the action).\nTest: Replace with he/she → use WHO. Replace with him/her → use WHOM.\nExample: "Who called?" (He called.) / "To whom did you speak?" (I spoke to him.)'),
  fc(T.PRO_grammar, 'What is a misplaced modifier?', 'A modifier placed too far from the word it modifies, creating ambiguity.\nExample: "She almost drove her children to school every day." (She drove almost every day, not almost drove.)\nCorrect: "She drove her children to school almost every day."'),
  fc(T.PRO_grammar, 'Which sentence uses the correct pronoun?\nA. Everyone must bring their ID.\nB. Everyone must bring his or her ID.\nC. Everyone must bring its ID.', 'B. "Everyone must bring his or her ID."\nIn formal writing, "everyone" is singular and takes a singular pronoun. "Their" (option A) is accepted in modern informal usage but traditionally incorrect. "Its" (C) refers to non-persons.'),
  fc(T.PRO_grammar, 'What is the subjunctive mood? Give an example.', 'The subjunctive mood expresses wishes, hypothetical situations, demands, or conditions contrary to fact.\nKey forms: Use "were" (not "was") for contrary-to-fact statements.\nExamples:\n• "If I WERE you, I would study harder." (hypothetical)\n• "I wish she WERE here." (wish)\n• "The doctor recommended that he REST." (demand/suggestion)'),
  fc(T.PRO_grammar, 'Correct the sentence: "Between you and I, the exam was difficult."', '"Between you and ME."\nPrepositions (between, with, for, to, from) are always followed by object pronouns: me, him, her, us, them.\nNever: "between you and I" — always "between you and me."'),
  fc(T.PRO_grammar, 'What is the correct form of the verb in a conditional sentence?\n"If she ___ harder, she would pass."\nA. studies  B. studied  C. will study', 'B. studied\nThis is a Type 2 (present unreal) conditional: IF + past simple → WOULD + base verb.\nIt expresses a hypothetical present/future situation.\nComparison:\n• Type 1 (real): "If she studies, she will pass."\n• Type 2 (unreal): "If she studied, she would pass."\n• Type 3 (past unreal): "If she had studied, she would have passed."'),
  fc(T.PRO_grammar, 'What is parallel structure? Give an example.', 'Parallel structure means using the same grammatical form for items in a series or paired elements.\nWrong: "She likes swimming, to hike, and runs."\nCorrect: "She likes swimming, hiking, and running."\nRule: All items in a list must be in the same grammatical form (all gerunds, all infinitives, all nouns, etc.)'),
  fc(T.PRO_grammar, 'Identify the error: "Neither of the answers are correct."\nA. Neither  B. of  C. are  D. correct', 'C. are\nCorrect: "Neither of the answers IS correct."\n"Neither" is singular when used alone as a pronoun. Compare: "Neither answer is correct." (No "of the" construction.)'),
  fc(T.PRO_grammar, 'What is the active voice vs. passive voice?', 'ACTIVE: The subject performs the action. (The teacher graded the papers.)\nPASSIVE: The subject receives the action. (The papers were graded by the teacher.)\nUse active voice for directness and clarity. Use passive voice when the doer is unknown, unimportant, or to shift emphasis.\nPassive formula: be + past participle.'),
  fc(T.PRO_grammar, 'What is the correct use of "fewer" vs. "less"?', '"FEWER" is for countable nouns (things you can count individually).\n"LESS" is for uncountable nouns (mass nouns you measure).\nExamples:\n• "Fewer students attended." (you can count students)\n• "Less water was used." (water is uncountable)\nMemory trick: If you can count it → FEWER. If you measure it → LESS.'),
  fc(T.PRO_grammar, 'What does "appositive" mean? Give an example.', 'An appositive is a noun or noun phrase placed next to another noun to identify or describe it.\nExample: "My brother, a doctor, works at PGH." ("a doctor" is the appositive)\nAppositives are usually set off by commas when they are non-essential (non-restrictive).\nEssential (restrictive): no commas → "My friend Maria called." (specifies which friend)'),
  fc(T.PRO_grammar, 'Which is correct?\nA. The number of applicants are increasing.\nB. The number of applicants is increasing.', 'B. "The number of applicants IS increasing."\n"The number" is singular → takes a singular verb.\nContrast: "A number of applicants ARE applying." ("A number of" means "many/several" and takes a plural verb.)'),
  fc(T.PRO_grammar, 'What is a relative clause? Give examples of relative pronouns.', 'A relative clause modifies a noun and begins with a relative pronoun.\nRelative pronouns: who, whom, whose, which, that\n• WHO/WHOM — refers to people\n• WHICH — refers to things/animals (non-restrictive)\n• THAT — refers to people or things (restrictive)\nExample: "The student WHO topped the exam received a scholarship."'),
  fc(T.PRO_grammar, 'Correct the error: "The book that I borrowed it was excellent."', 'Remove "it": "The book that I borrowed was excellent."\nIn a relative clause, do NOT repeat the noun/pronoun that "that/which/who" already replaces.\nWrong: "The house that I painted it is blue." (Remove "it")\nCorrect: "The house that I painted is blue."'),
  fc(T.SUB_grammar, 'What is a sentence fragment? Give an example.', 'A sentence fragment is an incomplete sentence — it is missing a subject, a verb, or does not express a complete thought.\nExamples of fragments:\n• "Because he was tired." (incomplete thought — no main clause)\n• "Running through the park." (no subject)\n• "The tall, beautiful woman." (no verb)\nFix by adding the missing element or joining to another sentence.'),
  fc(T.SUB_grammar, 'What is a run-on sentence?', 'A run-on sentence (fused sentence) incorrectly joins two or more independent clauses without proper punctuation or conjunction.\nWrong: "I studied hard I passed the exam."\nFix options:\n1. Period: "I studied hard. I passed the exam."\n2. Semicolon: "I studied hard; I passed the exam."\n3. Conjunction: "I studied hard, and I passed the exam."\n4. Subordinate: "Because I studied hard, I passed the exam."'),
  fc(T.SUB_grammar, 'What is the difference between a phrase and a clause?', 'PHRASE: A group of words without a subject-verb combination. (e.g., "in the morning," "the tall teacher")\nCLAUSE: A group of words WITH a subject and a verb.\n• Independent clause: complete thought, can stand alone.\n• Dependent clause: incomplete, cannot stand alone.\nExample: "Although it was raining" (dependent clause — needs more)'),
  fc(T.SUB_grammar, 'Which is correct?\nA. I have went to Manila before.\nB. I have gone to Manila before.', 'B. "I have GONE to Manila before."\n"Have/has/had" is always followed by the PAST PARTICIPLE.\nIrregular verbs: go → went (past simple) → GONE (past participle)\nOther examples: see → saw → SEEN; eat → ate → EATEN; write → wrote → WRITTEN'),
  fc(T.SUB_grammar, 'What are coordinating conjunctions? Give all seven.', 'Coordinating conjunctions join two equal grammatical elements (words, phrases, or independent clauses).\nThe 7 FANBOYS:\nF - For\nA - And\nN - Nor\nB - But\nO - Or\nY - Yet\nS - So\nExample: "I studied hard, BUT the exam was difficult."'),
];

// ── ENGLISH VOCABULARY ───────────────────────────────────────────────────────
const vocabCards = [
  fc(T.PRO_vocabulary, 'DILIGENT (adjective)', 'Meaning: Showing care and effort in one\'s work; hardworking and persistent.\nSynonyms: industrious, hardworking, assiduous, conscientious\nAntonyms: lazy, idle, negligent\nExample: "A diligent student reviews lessons every day."'),
  fc(T.PRO_vocabulary, 'ELOQUENT (adjective)', 'Meaning: Fluent and persuasive in speaking or writing.\nSynonyms: articulate, fluent, expressive, persuasive\nAntonyms: inarticulate, tongue-tied, mute\nExample: "The senator delivered an eloquent speech that moved the audience."'),
  fc(T.PRO_vocabulary, 'AMBIGUOUS (adjective)', 'Meaning: Open to more than one interpretation; unclear or vague.\nSynonyms: unclear, vague, equivocal, obscure\nAntonyms: clear, explicit, unambiguous, definite\nExample: "The instruction was ambiguous, causing confusion among the applicants."'),
  fc(T.PRO_vocabulary, 'ALLEVIATE (verb)', 'Meaning: To make (suffering, deficiency, or a problem) less severe; to lessen.\nSynonyms: relieve, ease, reduce, lessen, mitigate\nAntonyms: aggravate, worsen, intensify, exacerbate\nExample: "Painkillers help alleviate headaches."'),
  fc(T.PRO_vocabulary, 'PRUDENT (adjective)', 'Meaning: Acting with care and thought for the future; wise and cautious.\nSynonyms: wise, careful, sensible, judicious, discreet\nAntonyms: imprudent, reckless, careless, foolish\nExample: "A prudent government saves resources for emergencies."'),
  fc(T.PRO_vocabulary, 'INDIFFERENT (adjective)', 'Meaning: Having no particular interest or concern; unconcerned, apathetic.\nSynonyms: apathetic, unconcerned, detached, impartial\nAntonyms: concerned, interested, passionate, enthusiastic\nExample: "He was indifferent to the outcome of the election."'),
  fc(T.PRO_vocabulary, 'MANDATORY (adjective)', 'Meaning: Required by law or rules; compulsory.\nSynonyms: compulsory, obligatory, required, necessary\nAntonyms: optional, voluntary, elective, discretionary\nExample: "Wearing a seatbelt is mandatory in the Philippines."'),
  fc(T.PRO_vocabulary, 'COGNIZANT (adjective)', 'Meaning: Having knowledge or being aware of something.\nSynonyms: aware, conscious, mindful, knowledgeable\nAntonyms: unaware, ignorant, oblivious\nExample: "A good leader must be cognizant of the problems facing constituents."'),
  fc(T.PRO_vocabulary, 'BENEVOLENT (adjective)', 'Meaning: Well-meaning and kindly; generous and charitable.\nSynonyms: kind, generous, charitable, philanthropic, altruistic\nAntonyms: malevolent, cruel, unkind, selfish\nExample: "The benevolent donor built a school in the rural community."'),
  fc(T.PRO_vocabulary, 'OBSTINATE (adjective)', 'Meaning: Stubbornly refusing to change one\'s opinion or course of action.\nSynonyms: stubborn, headstrong, persistent, dogged, unyielding\nAntonyms: flexible, compliant, agreeable, yielding\nExample: "The obstinate official refused to reconsider the decision."'),
  fc(T.PRO_vocabulary, 'METICULOUS (adjective)', 'Meaning: Showing great attention to detail; very careful and precise.\nSynonyms: careful, thorough, precise, exact, painstaking\nAntonyms: careless, sloppy, negligent, haphazard\nExample: "A meticulous accountant checks every figure twice."'),
  fc(T.PRO_vocabulary, 'VERBOSE (adjective)', 'Meaning: Using more words than needed; wordy.\nSynonyms: wordy, long-winded, prolix, loquacious, garrulous\nAntonyms: concise, brief, succinct, terse\nExample: "The verbose report was difficult to read because it contained too many unnecessary words."'),
  fc(T.PRO_vocabulary, 'CANDID (adjective)', 'Meaning: Truthful and straightforward; frank.\nSynonyms: frank, honest, open, sincere, straightforward\nAntonyms: dishonest, deceptive, evasive, insincere\nExample: "She gave a candid assessment of the project\'s weaknesses."'),
  fc(T.PRO_vocabulary, 'EXEMPLARY (adjective)', 'Meaning: Serving as a desirable model; representing the best of something.\nSynonyms: outstanding, admirable, commendable, ideal, model\nAntonyms: poor, inferior, disreputable, appalling\nExample: "She received an award for her exemplary service to the community."'),
  fc(T.PRO_vocabulary, 'APATHETIC (adjective)', 'Meaning: Showing or feeling no interest, enthusiasm, or concern.\nSynonyms: indifferent, uninterested, unconcerned, detached, dispassionate\nAntonyms: enthusiastic, interested, passionate, concerned\nExample: "The apathetic voter did not bother to register for the election."'),
  fc(T.PRO_vocabulary, 'PLAUSIBLE (adjective)', 'Meaning: Seemingly reasonable or probable; having an appearance of truth.\nSynonyms: credible, believable, reasonable, probable, likely\nAntonyms: implausible, unbelievable, improbable, unlikely\nExample: "The witness gave a plausible account of the events."'),
  fc(T.PRO_vocabulary, 'CONCISE (adjective)', 'Meaning: Giving a lot of information clearly in a few words; brief and comprehensive.\nSynonyms: brief, succinct, terse, compact, short\nAntonyms: verbose, wordy, long-winded, rambling\nExample: "Write a concise report — no more than two pages."'),
  fc(T.PRO_vocabulary, 'DISCREPANCY (noun)', 'Meaning: A difference or inconsistency between two or more facts or claims.\nSynonyms: inconsistency, difference, variance, disparity, divergence\nAntonyms: agreement, consistency, harmony, conformity\nExample: "There was a discrepancy between the two financial reports."'),
  fc(T.PRO_vocabulary, 'APPREHENSIVE (adjective)', 'Meaning: Anxious or fearful that something bad or unpleasant will happen.\nSynonyms: anxious, worried, fearful, nervous, uneasy\nAntonyms: confident, calm, assured, certain\nExample: "She was apprehensive about her performance in the board exam."'),
  fc(T.PRO_vocabulary, 'INTEGRITY (noun)', 'Meaning: The quality of being honest and having strong moral principles.\nSynonyms: honesty, uprightness, probity, honor, ethics\nAntonyms: dishonesty, corruption, immorality, deceit\nExample: "A civil servant must uphold integrity in the performance of duties."'),
  fc(T.SUB_vocabulary, 'What does DILIGENT mean?', 'Hardworking and careful.\nSynonym: industrious\nAntonym: lazy\n\nSample: "The DILIGENT employee finished all tasks before the deadline."'),
  fc(T.SUB_vocabulary, 'What does INDIFFERENT mean?', 'Having no interest or concern; unconcerned.\nSynonym: apathetic\nAntonym: enthusiastic\n\nSample: "He was INDIFFERENT to praise or criticism."'),
  fc(T.SUB_vocabulary, 'What does MANDATORY mean?', 'Required by law; compulsory.\nSynonym: compulsory\nAntonym: optional\n\nSample: "Attendance at the orientation is MANDATORY."'),
  fc(T.SUB_vocabulary, 'What does CONCISE mean?', 'Short and clear; expressing much in few words.\nSynonym: brief\nAntonym: verbose (wordy)\n\nSample: "Please give a CONCISE summary of the report."'),
  fc(T.SUB_vocabulary, 'What does INTEGRITY mean?', 'Being honest and having strong moral principles.\nSynonym: honesty, uprightness\nAntonym: corruption, dishonesty\n\nSample: "Public servants must maintain their INTEGRITY at all times."'),
];

// ── FILIPINO VOCABULARY ──────────────────────────────────────────────────────
const filVocabCards = [
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MABILIS', 'Madali · Maliksi · Mabisà · Matulin · Mabigla\n\nHalimbawa: "Mabilis" = gumagalaw nang walang pagkaantala.\nPaggamit: "Ang kanyang mabilis na desisyon ay nakapagligtas ng buhay."'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng MATAPANG', 'Duwag · Mahina ang loob · Maantok · Walang tapang\n\nHalimbawa: "Matapang" = walang takot, malakas ang loob.\nKasalungat: "Duwag" = takot, walang lakas ng loob.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MAKASARILI', 'Imbi · Palautos · Walang pakialam sa iba · Mapagsamantala\n\nHalimbawa: Ang taong MAKASARILI ay iniisip lamang ang sariling kapakinabangan.\nSinonimo: mapagimbot, sakim'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng MASAYAHIN', 'Malungkot · Mapanglaw · Malumbay · Masaklap ang kalooban\n\nHalimbawa: "Masayahin" = palaging may ngiti, masigla.\nKasalungat: "Malungkot" = puno ng kalungkutan.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MATIYAGA', 'Tiyak · Mapagtiis · Mapagpunyagi · Hindi sumusuko · Matatag\n\nHalimbawa: Ang MATIYAGANG mag-aaral ay paulit-ulit na nag-aaral hanggang maintindihan ang leksyon.\nSinonimo: mapagtiis, matatag'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng MALIWANAG', 'Madilim · Malabo · Di-malinaw · Malungkot\n\nHalimbawa: "Maliwanag" = maraming liwanag; madaling maunawaan.\nKasalungat: "Madilim" = walang liwanag; "Malabo" = di-malinaw.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MAHIYAIN', 'Mapaghinhin · Mahiyang-hiya · Di-mapalapit · Mababa ang loob\n\nHalimbawa: Ang MAHIYAING bata ay ayaw magsalita sa harap ng maraming tao.\nSinonimo: mapaghinhin, kimi, alangan'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng MABUTI', 'Masama · Masamang-loob · Di-kapuri-puri · Mapanganib\n\nHalimbawa: "Mabuti" = may kabutihan, kapuri-puri.\nKasalungat: "Masama" = may kasamaan, di-kapuri-puri.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MARUNONG', 'Matalino · Matalim ang isip · May kaalaman · Bihasa\n\nHalimbawa: Ang MARUNONG na tao ay alam kung paano haharapin ang mga suliranin.\nSinonimo: matalino, bihasa, dalubhasa'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng MASIPAG', 'Tamad · Pabaya · Walang sigasig · Walang gana\n\nHalimbawa: "Masipag" = nagsusumikap, nagtatrabaho nang husto.\nKasalungat: "Tamad" = ayaw magtrabaho.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MAGANDA', 'Marikit · Magandang-anyo · Kahali-halina · Kaakit-akit · Kapwa-angkin\n\nHalimbawa: "Maganda" = may kagandahan sa itsura.\nSinonimo: marikit, kahali-halina, kaaya-aya'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng MATANDA', 'Bata · Kabataan · Mumo · Sanggol\n\nHalimbawa: "Matanda" = may gulang na, may karanasan na.\nKasalungat: "Bata" = maliit pa, mumo pa.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng BUKAS-PALAD', 'Mapagbigay · Mapagkaloob · Handang tumulong · Maluwag sa kamay\n\nHalimbawa: Ang BUKAS-PALAD na tao ay laging handang tumulong sa nangangailangan.\nSinonimo: mapagbigay, mabuting-loob'),
  fc(T.PRO_vocab_fil, 'Kasalungat ng TAHIMIK', 'Maingay · Maligalig · Makulay · Abala\n\nHalimbawa: "Tahimik" = walang ingay, payapa.\nKasalungat: "Maingay" = puno ng ingay; "Malikot" = hindi mapalagay.'),
  fc(T.PRO_vocab_fil, 'Kasingkahulugan ng MAPANGANIB', 'Delikado · Masamang-loob · Nakasasagabal · Nakapipinsala\n\nHalimbawa: "Mapanganib" = maaaring makapinsala.\nSinonimo: delikado, nakapanganib, nakalalason'),
  // Filipino Grammar (Wastong Gamit)
  fc(T.PRO_grammar_fil, 'Wastong gamit ng "ng" at "nang"', '"NG" — ginagamit bilang pang-angkop o katumbas ng "of" (sa Ingles). Nagpapakita rin ng pagmamay-ari.\nHalimbawa: "damit ng bata" | "ari ng puso"\n\n"NANG" — ginagamit bilang katumbas ng "when," "in order that," o pampalakas ng pandiwang panlagay.\nHalimbawa: "Nang dumating siya..." | "Tumakbo nang mabilis"\n\nTip: Subukan palitan ng "noong" (para sa "nang bilang "when"). Kung angkop, gamitin ang "nang."'),
  fc(T.PRO_grammar_fil, 'Wastong gamit ng "din" at "rin"', '"DIN" — ginagamit pagkatapos ng katinig (consonant).\nHalimbawa: "Mabilis DIN siya."\n\n"RIN" — ginagamit pagkatapos ng patinig (vowel) o katinig na "w" o "y."\nHalimbawa: "Magaling RIN siya." | "Mabait RIN si Ana."\n\nParaan: Tingnan ang huling letra ng salitang nasa harap nito.'),
  fc(T.PRO_grammar_fil, 'Wastong gamit ng "daw" at "raw"', '"DAW" — ginagamit pagkatapos ng katinig (consonant).\nHalimbawa: "Matalino DAW ang bagong estudyante."\n\n"RAW" — ginagamit pagkatapos ng patinig (vowel).\nHalimbawa: "Mabait RAW ang guro." | "Masipag RAW siya."\n\nParehas ang kahulugan: ginagamit upang ipahiwatig na ang impormasyon ay mula sa ibang tao (reported speech).'),
  fc(T.PRO_grammar_fil, 'Wastong gamit ng "saan" at "nasaan"', '"SAAN" — tinatanong ang kinilalang patutunguhan o pinagmulan.\nHalimbawa: "SAAN ka pupunta?" | "SAAN ka nanggaling?"\n\n"NASAAN" — tinatanong ang kasalukuyang lokasyon.\nHalimbawa: "NASAAN ka ngayon?" | "NASAAN ang iyong libro?"\n\nTip: SAAN = direction/destination (going, coming from). NASAAN = present location (where is).'),
  fc(T.PRO_grammar_fil, 'Wastong gamit ng "mahal" sa iba\'t ibang konteksto', '"Mahal" ay may dalawang kahulugan sa Filipino:\n\n1. MAHAL (mataas ang presyo) = expensive\n   Halimbawa: "Mahal ang pagkain sa lungsod."\n\n2. MAHAL (pagmamahal/pagmamahal) = dear, beloved, love\n   Halimbawa: "Mahal kita." | "Mahal kong anak,"\n\nAngkop na konteksto ang nagbibigay ng tamang kahulugan.'),
  fc(T.SUB_vocab_fil, 'Kasingkahulugan ng MABILIS', 'Maliksi · Matulin · Madali · Maagap\n\nHalimbawa: "Ang mabilis na tugon ng gobyerno ay nakapigil sa pagkalat ng sakit."'),
  fc(T.SUB_vocab_fil, 'Kasalungat ng MASIPAG', 'Tamad · Pabaya · Walang gana\n\nHalimbawa: "Ang masipag na manggagawa ay tinanggap sa trabaho. Ang tamad ay tinanggal."'),
  fc(T.SUB_vocab_fil, 'Kasingkahulugan ng MATULUNGIN', 'Maaalahanin · Mapagmalasakit · Handang tumulong · Mabuting-loob\n\nHalimbawa: "Ang matulunging kapitbahay ay laging naroroon tuwing may kailangan ang iba."'),
  fc(T.SUB_vocab_fil, 'Kasalungat ng MAINGAT', 'Pabaya · Walang ingat · Tampulan · Palamara\n\nHalimbawa: "Ang maingat na trabahador ay hindi nagkakamali. Ang pabaya ay palaging may mali."'),
  fc(T.SUB_vocab_fil, 'Kasingkahulugan ng KATAPATAN', 'Katuwiran · Integridad · Katapatan sa salita · Pagkamaka-totoo\n\nHalimbawa: "Ang katapatan ng isang opisyal ay susukat sa kanyang kilos, hindi sa kanyang salita."'),
];

// ── PHILIPPINE CONSTITUTION ──────────────────────────────────────────────────
const constitutionCards = [
  fc(T.PRO_constitution, 'What is the Preamble of the 1987 Philippine Constitution?', '"We, the sovereign Filipino people, imploring the aid of Almighty God, in order to build a just and humane society and establish a Government that shall embody our ideals and aspirations, promote the common good, conserve and develop our patrimony, and secure to ourselves and our posterity the blessings of independence and democracy under the rule of law and a regime of truth, justice, freedom, love, equality, and peace, do ordain and promulgate this Constitution."'),
  fc(T.PRO_constitution, 'What are the 18 Articles of the 1987 Philippine Constitution?', 'I – National Territory\nII – Declaration of Principles and State Policies\nIII – Bill of Rights\nIV – Citizenship\nV – Suffrage\nVI – Legislative Department\nVII – Executive Department\nVIII – Judicial Department\nIX – Constitutional Commissions\nX – Local Government\nXI – Accountability of Public Officers\nXII – National Economy and Patrimony\nXIII – Social Justice and Human Rights\nXIV – Education, Science, Technology, Arts, Culture and Sports\nXV – The Family\nXVI – General Provisions\nXVII – Amendments or Revisions\nXVIII – Transitory Provisions'),
  fc(T.PRO_constitution, 'Article III, Section 1: Due Process and Equal Protection', '"No person shall be deprived of life, liberty, or property without due process of law, nor shall any person be denied the equal protection of the laws."\n\nKey concepts:\n• Due Process: Procedural (fair procedure) and Substantive (laws must be fair)\n• Equal Protection: All persons similarly situated are treated alike\n• These rights are available to all persons in the Philippines, not just citizens'),
  fc(T.PRO_constitution, 'Article III, Section 2: Right against Unreasonable Searches and Seizures', '"The right of the people to be secure in their persons, houses, papers, and effects against unreasonable searches and seizures of whatever nature and for any purpose shall be inviolable, and no search warrant or warrant of arrest shall issue except upon probable cause..."\n\nKey rule: Searches and seizures generally require a WARRANT. Exceptions include: in flagrante delicto, hot pursuit, stop-and-frisk, and plain view doctrine.'),
  fc(T.PRO_constitution, 'Article III, Section 12: Rights of Persons Under Custodial Investigation (Miranda Rights)', 'Rights of persons under investigation:\n1. Right to remain silent\n2. Right to have competent and independent counsel (preferably of own choice)\n3. Right to be informed of these rights\n4. No torture, force, violence, threat, intimidation, or other means that vitiate free will\n5. Any confession obtained in violation of these rights is INADMISSIBLE\n\nNote: Miranda rights attach from the moment a person is placed under custodial investigation.'),
  fc(T.PRO_constitution, 'Article III, Section 14: Rights of the Accused', 'Criminal due process rights:\n• Presumption of innocence until proven guilty\n• Right to be heard by himself and counsel\n• Right to be informed of the nature and cause of accusation\n• Right to speedy, impartial, and public trial\n• Right to meet the witnesses face to face\n• Right to compulsory process to secure attendance of witnesses\n\nNote: These rights may be WAIVED (except the right to be informed of the accusation).'),
  fc(T.PRO_constitution, 'What is the composition and term of the Philippine Senate?', 'Philippine Senate (Upper House):\n• 24 senators elected at large (national vote)\n• 6-year term\n• May serve a maximum of 2 consecutive terms\n• To run for senator: at least 35 years old, natural-born citizen, registered voter, able to read and write, resident of the Philippines for at least 2 years\n• Senate President heads the Senate'),
  fc(T.PRO_constitution, 'What is the composition of the Philippine House of Representatives?', 'House of Representatives (Lower House):\n• Not more than 250 members (may be changed by law)\n• District representatives: elected per legislative district\n• Party-list representatives: 20% of total seats allocated to party-list groups\n• 3-year term; maximum 3 consecutive terms\n• Qualifications: at least 25 years old, natural-born citizen, registered voter in district, resident of district for at least 1 year\n• Speaker of the House heads the chamber'),
  fc(T.PRO_constitution, 'What are the qualifications for President and Vice President?', 'President and Vice President must be:\n1. Natural-born citizen of the Philippines\n2. Registered voter\n3. Able to read and write\n4. At least 40 years of age on election day\n5. Resident of the Philippines for at least 10 years immediately preceding the election\n\nTerm: 6 years; NO re-election\nMax service: President may serve one term only. VP may serve 2 terms.'),
  fc(T.PRO_constitution, 'What are the Constitutional Commissions (Article IX)?', 'Three independent constitutional commissions:\n1. CIVIL SERVICE COMMISSION (CSC) — administers the civil service\n2. COMMISSION ON ELECTIONS (COMELEC) — enforces election laws\n3. COMMISSION ON AUDIT (COA) — audits government revenues and expenditures\n\nCharacteristics:\n• Each composed of a Chairman and Commissioners\n• 7-year terms, no reappointment\n• Fiscal autonomy\n• Decisions appealable to the Supreme Court'),
  fc(T.PRO_constitution, 'Article II, Section 3: Civilian Authority over the Military', '"Civilian authority is, at all times, supreme over the military. The Armed Forces of the Philippines is the protector of the people and the State. Its goal is to secure the sovereignty of the State and the integrity of the national territory."\n\nKey principle: In the Philippines, the President (civilian) is the Commander-in-Chief of all armed forces.'),
  fc(T.PRO_constitution, 'Article II, Section 14: Role of Women in Nation Building', '"The State recognizes the role of women in nation-building, and shall ensure the fundamental equality before the law of women and men."\n\nRelated: The State also recognizes the Filipino family as the foundation of the nation and shall strengthen its solidarity and actively promote its total development (Article XV).'),
  fc(T.PRO_constitution, 'What is the state policy on social justice? (Article II, Section 10)', '"The State shall promote social justice in all phases of national development."\n\nArticle XIII further provides: "The Congress shall give highest priority to the enactment of measures that protect and enhance the right of all people to human dignity, reduce social, economic, and political inequalities, and remove cultural inequities by equitably diffusing wealth and political power for the common good."'),
  fc(T.PRO_constitution, 'What is the Philippine system of government?', 'The Philippines has:\n• REPUBLICAN form of government (sovereignty resides in and is exercised by the people)\n• PRESIDENTIAL system (executive power vested in the President)\n• UNITARY state (national government has supreme authority)\n• DEMOCRATIC state (government derives power from the consent of the governed)\n\nThe Philippines adopts a SEPARATION OF POWERS among three co-equal branches:\n1. Executive (President)\n2. Legislative (Congress)\n3. Judicial (Supreme Court and lower courts)'),
  fc(T.PRO_constitution, 'What is the principle of checks and balances in the Philippine government?', 'CHECKS AND BALANCES means each branch of government has powers to limit the other branches:\n\nExecutive checks Legislature:\n• President can VETO bills passed by Congress\n• President appoints legislative officials\n\nLegislature checks Executive:\n• Congress can OVERRIDE presidential veto (2/3 vote)\n• Senate confirms presidential appointments (Commission on Appointments)\n• Congress can IMPEACH the President\n\nJudiciary checks both:\n• Courts can declare laws or acts UNCONSTITUTIONAL (judicial review)'),
  fc(T.SUB_phil_gov, 'What form of government does the Philippines have?', 'The Philippines has a REPUBLICAN and DEMOCRATIC form of government.\n\nKey features:\n• Sovereignty resides in the PEOPLE\n• Government derives power from the CONSENT of the governed\n• Three branches: Executive, Legislative, Judicial\n• Checks and balances among the three branches\n\nThe Philippine government is also UNITARY — national government is supreme over local governments.'),
  fc(T.SUB_phil_gov, 'Who is the President of the Philippines and what are the key powers?', 'The President is the HEAD OF STATE and HEAD OF GOVERNMENT.\n\nKey executive powers:\n• Commander-in-Chief of armed forces\n• Pardoning power (grant pardons, commutations, amnesty)\n• Veto power over bills passed by Congress\n• Appointment power (judges, cabinet members, ambassadors)\n• Power to declare martial law (with concurrence of Congress and subject to SC review)\n\nTerm: 6 years; NO re-election'),
  fc(T.SUB_phil_gov, 'What are the three branches of Philippine government and their functions?', 'EXECUTIVE BRANCH — implements laws. Led by the President.\nLEGISLATIVE BRANCH — makes laws. Congress: Senate (24 senators) + House of Representatives.\nJUDICIAL BRANCH — interprets laws. Led by the Supreme Court (15 members: Chief Justice + 14 Associate Justices).\n\nChecks and balances prevent any one branch from becoming too powerful.'),
  fc(T.SUB_phil_gov, 'What is the Bill of Rights? Name at least 5 key rights.', 'The Bill of Rights (Article III) guarantees individual rights against government abuse:\n\n1. Due process and equal protection (Sec. 1)\n2. Right against unreasonable searches and seizures (Sec. 2)\n3. Freedom of speech, expression, and of the press (Sec. 4)\n4. Right to peaceful assembly and petition (Sec. 4)\n5. Freedom of religion (Sec. 5)\n6. Right to privacy (Sec. 3)\n7. Miranda rights / right to counsel (Sec. 12)\n8. Presumption of innocence (Sec. 14)'),
  fc(T.SUB_phil_gov, 'What is the Civil Service Commission (CSC)?', 'The CIVIL SERVICE COMMISSION (CSC) is the central personnel agency of the Philippine government.\n\nFunctions:\n• Administer and enforce civil service laws and rules\n• Conduct examinations (like the CSE!) for government employment\n• Promote merit and fitness in government service\n• Discipline and resolve complaints against civil servants\n\nComposition: Chairman + 2 Commissioners\nTerm: 7 years, no reappointment'),
];

// ── RA 6713 (Code of Conduct and Ethical Standards) ─────────────────────────
const ra6713Cards = [
  fc(T.PRO_ra6713, 'What is Republic Act 6713?', 'RA 6713 is the "Code of Conduct and Ethical Standards for Public Officials and Employees" enacted in 1989.\n\nPurpose: To promote a high standard of ethics in public service.\nScope: All public officials and employees — national and local government, government-owned corporations, state universities and colleges.\n\nKey obligations: uphold public interest, disclosure of assets, avoid conflicts of interest, observe ethical standards.'),
  fc(T.PRO_ra6713, 'What are the norms of conduct under RA 6713?', 'Eight norms of conduct (PICCLSP):\n1. PROFESSIONALISM — efficient, effective, and courteous service\n2. INTEGRITY — act with integrity in all transactions\n3. COURTESY — show respect to superiors, colleagues, and the public\n4. COMMITMENT — devote full time and effort to public service\n5. LOYALTY — be loyal to the Republic and the Filipino people\n6. SIMPLICITY — live simply, avoid extravagance\n7. POLITICAL NEUTRALITY — serve with impartiality regardless of politics\n8. RESPONSIVENESS TO THE PUBLIC — serve with dedication and commitment to public interest\n\n(Also includes: Nationalism, Justness and Sincerity, Transparency, and Non-Partisanship)'),
  fc(T.PRO_ra6713, 'What is the Statement of Assets, Liabilities and Net Worth (SALN)?', 'The SALN is a document that all public officials and employees must file every year (on or before April 30), declaring under oath:\n\n1. Assets (real and personal properties)\n2. Liabilities (debts and obligations)\n3. Net worth (assets minus liabilities)\n4. Business interests and financial connections\n\nPurpose: Promote transparency and prevent unexplained wealth\nPenalty for violation: Administrative and criminal penalties'),
  fc(T.PRO_ra6713, 'What is the definition of "conflict of interest" under RA 6713?', 'Conflict of interest exists when a public official\'s personal interest conflicts with the public interest in the performance of official duties.\n\nUnder RA 6713, public officials must:\n• Avoid situations where personal interest may affect official judgment\n• Avoid soliciting or accepting gifts that may influence their decisions\n• Resign from any business entity before assuming office (for certain positions)\n• Disclose any conflict of interest to proper authorities'),
  fc(T.PRO_ra6713, 'What are the prohibited acts under RA 6713?', 'Key prohibited acts:\n1. Directly or indirectly soliciting gifts from any person in exchange for assistance\n2. Divulging confidential information\n3. Using government property for personal use\n4. Engaging in moonlighting that conflicts with official duties\n5. Having financial or business interest in contracts where the official has power to grant\n6. Participating in decisions affecting personal interests\n\nPenalty: Administrative and/or criminal sanctions'),
];

// ── NUMERICAL: WORD PROBLEMS FORMULAS ────────────────────────────────────────
const numericalCards = [
  fc(T.PRO_word_problems, 'Formula: Distance, Rate, Time', 'D = R × T (Distance = Rate × Time)\n\nDerivations:\n• Rate = Distance ÷ Time\n• Time = Distance ÷ Rate\n\nExample: A train travels 120 km in 2 hours. Speed = 120 ÷ 2 = 60 km/h.\n\nFor objects traveling TOWARD each other: Add their speeds.\nFor objects traveling AWAY from each other: Add their speeds.\nFor same direction: Subtract speeds.'),
  fc(T.PRO_word_problems, 'Formula: Percentage Problems', 'Three types:\n1. "What is P% of N?" → answer = (P/100) × N\n2. "X is what % of Y?" → answer = (X/Y) × 100\n3. "X is P% of what?" → answer = X ÷ (P/100)\n\nExamples:\n• "What is 25% of 80?" = 0.25 × 80 = 20\n• "15 is what % of 60?" = (15/60) × 100 = 25%\n• "20 is 40% of what?" = 20 ÷ 0.40 = 50'),
  fc(T.PRO_word_problems, 'Formula: Simple Interest', 'I = P × R × T\n\nWhere:\nI = Interest earned\nP = Principal (initial amount)\nR = Rate per year (as a decimal)\nT = Time in years\n\nTotal Amount = P + I\n\nExample: ₱10,000 at 5% per year for 3 years:\nI = 10,000 × 0.05 × 3 = ₱1,500\nTotal = ₱11,500'),
  fc(T.PRO_word_problems, 'Formula: Mixture Problems', 'For mixing two solutions:\nAmount₁ × Concentration₁ + Amount₂ × Concentration₂ = Total × Final Concentration\n\nExample: Mix 2L of 30% salt solution with 3L of 50% salt solution.\nSalt: (2 × 0.30) + (3 × 0.50) = 0.60 + 1.50 = 2.10L of salt\nTotal volume: 2 + 3 = 5L\nFinal concentration: 2.10 ÷ 5 = 42%'),
  fc(T.PRO_word_problems, 'Formula: Work Problems', 'If A can do a job in "a" days and B can do it in "b" days:\n\nTime for A and B working together = (a × b) / (a + b)\n\nRate approach: Rate of A = 1/a per day; Rate of B = 1/b per day\nCombined rate = 1/a + 1/b\nTime together = 1 ÷ (1/a + 1/b)\n\nExample: A finishes in 4 days, B in 6 days.\nTime together = (4×6)/(4+6) = 24/10 = 2.4 days'),
  fc(T.PRO_word_problems, 'Formula: Age Problems', 'Key approach:\n1. Let x = current age of one person\n2. Express other ages in terms of x\n3. Use the relationship (sum, difference, ratio) to set up equation\n4. Solve for x\n\nCommon relationships:\n• "A is twice as old as B" → A = 2B\n• "In 5 years, A will be..." → A + 5\n• "5 years ago, B was..." → B - 5\n• Sum of ages: A + B = total'),
  fc(T.PRO_word_problems, 'Formula: Number Problems (Consecutive Integers)', 'Consecutive integers: n, n+1, n+2\nConsecutive EVEN integers: n, n+2, n+4 (where n is even)\nConsecutive ODD integers: n, n+2, n+4 (where n is odd)\n\nExample: Three consecutive odd integers sum to 39.\nn + (n+2) + (n+4) = 39\n3n + 6 = 39\n3n = 33 → n = 11\nIntegers: 11, 13, 15'),
  fc(T.PRO_word_problems, 'Formula: Profit and Loss', 'Profit = Selling Price − Cost Price\nLoss = Cost Price − Selling Price\nProfit % = (Profit / Cost Price) × 100\nLoss % = (Loss / Cost Price) × 100\nSelling Price = Cost Price × (1 + Profit %)\n\nExample: Bought for ₱500, sold for ₱625.\nProfit = 625 − 500 = ₱125\nProfit % = (125 / 500) × 100 = 25%'),
  fc(T.PRO_number_series, 'What are the common types of number series in CSE?', '1. ARITHMETIC SERIES: constant difference between terms\n   Example: 2, 5, 8, 11, 14 (+3 each)\n\n2. GEOMETRIC SERIES: constant ratio between terms\n   Example: 2, 6, 18, 54, 162 (×3 each)\n\n3. FIBONACCI-TYPE: each term = sum of two preceding terms\n   Example: 1, 1, 2, 3, 5, 8, 13, 21\n\n4. ALTERNATING: two interleaved series\n   Example: 1, 10, 2, 20, 3, 30, 4, 40\n\n5. SQUARED/CUBED: terms follow a power pattern\n   Example: 1, 4, 9, 16, 25 (perfect squares)'),
  fc(T.PRO_number_series, 'Identify the pattern: 3, 6, 12, 24, ___', 'Answer: 48\nPattern: GEOMETRIC SERIES — each term is multiplied by 2.\n3 × 2 = 6\n6 × 2 = 12\n12 × 2 = 24\n24 × 2 = 48\n\nTo identify geometric series: Find the RATIO between consecutive terms. If constant → geometric.'),
  fc(T.PRO_number_series, 'Identify the pattern: 100, 91, 82, 73, ___', 'Answer: 64\nPattern: ARITHMETIC SERIES — each term decreases by 9.\n100 − 9 = 91\n91 − 9 = 82\n82 − 9 = 73\n73 − 9 = 64\n\nTo identify arithmetic series: Find the DIFFERENCE between consecutive terms. If constant → arithmetic.'),
  fc(T.PRO_number_series, 'Identify the pattern: 1, 4, 9, 16, 25, ___', 'Answer: 36\nPattern: PERFECT SQUARES — each term is n²\n1 = 1²\n4 = 2²\n9 = 3²\n16 = 4²\n25 = 5²\n36 = 6²\n\nNext would be: 49 (7²), 64 (8²), 81 (9²), 100 (10²)'),
  fc(T.PRO_basic_ops, 'Order of Operations (PEMDAS/BODMAS)', 'PEMDAS (Please Excuse My Dear Aunt Sally):\nP — Parentheses (innermost first)\nE — Exponents (powers and roots)\nM — Multiplication\nD — Division\nA — Addition\nS — Subtraction\n\n(M and D are done left to right; A and S are done left to right)\n\nExample: 2 + 3 × 4² ÷ 8 − 1\n= 2 + 3 × 16 ÷ 8 − 1\n= 2 + 48 ÷ 8 − 1\n= 2 + 6 − 1\n= 7'),
  fc(T.PRO_basic_ops, 'Key percentage shortcuts for CSE', '10% of any number: Move decimal one place left.\n10% of 350 = 35\n\n5% = half of 10%: 5% of 350 = 17.5\n\n25% = divide by 4: 25% of 200 = 50\n\n50% = divide by 2: 50% of 180 = 90\n\n75% = 3/4: 75% of 200 = 150\n\n20% = divide by 5: 20% of 150 = 30\n\n33.33% ≈ 1/3: 33.33% of 90 ≈ 30'),
  fc(T.SUB_word_problems, 'Solve: A worker can paint a room in 6 hours. Another takes 3 hours. How long together?', 'Using the work formula:\nTime together = (A × B) / (A + B)\n= (6 × 3) / (6 + 3)\n= 18 / 9\n= 2 hours\n\nCheck: In 2 hours:\n• Worker 1 completes 2/6 = 1/3 of the job\n• Worker 2 completes 2/3 of the job\n• Total: 1/3 + 2/3 = 1 complete job ✓'),
  fc(T.SUB_word_problems, 'Solve: A car travels at 60 km/h. How long to travel 240 km?', 'Formula: Time = Distance ÷ Rate\nT = 240 ÷ 60\nT = 4 hours\n\nAlternatively: Distance = Rate × Time\n240 = 60 × T\nT = 4 hours'),
  fc(T.SUB_basic_ops, 'What is 15% of 240?', '15% of 240:\nMethod 1: 0.15 × 240 = 36\nMethod 2: 10% of 240 = 24; 5% = 12; 24 + 12 = 36\n\nAnswer: 36'),
  fc(T.SUB_number_series, 'What comes next? 2, 4, 8, 16, ___', '32\nPattern: Geometric series — multiply by 2 each time.\n2 × 2 = 4\n4 × 2 = 8\n8 × 2 = 16\n16 × 2 = 32'),
];

// ── ANALYTICAL: WORD ASSOCIATION / ANALOGIES ─────────────────────────────────
const analyticalCards = [
  fc(T.PRO_word_assoc, 'What are the main types of analogies in CSE?', '1. SYNONYM: big : large :: happy : glad\n2. ANTONYM: hot : cold :: day : night\n3. PART-TO-WHOLE: leaf : tree :: chapter : book\n4. CAUSE-AND-EFFECT: fire : smoke :: rain : flood\n5. TOOL-TO-FUNCTION: pen : write :: knife : cut\n6. WORKER-TO-PRODUCT: baker : bread :: author : book\n7. WORKER-TO-WORKPLACE: doctor : hospital :: teacher : school\n8. CATEGORY: rose : flower :: eagle : bird\n9. DEGREE: warm : hot :: dislike : hate\n10. CHARACTERISTIC: lion : brave :: fox : cunning'),
  fc(T.PRO_word_assoc, 'Complete the analogy: AUTHOR : BOOK :: COMPOSER : ___', 'SYMPHONY (or MUSIC or COMPOSITION)\nRelationship: WORKER-TO-PRODUCT\nAn author creates a book; a composer creates a symphony.\n\nOther examples of this type:\n• Sculptor : Statue\n• Architect : Building\n• Chef : Meal\n• Poet : Poem'),
  fc(T.PRO_word_assoc, 'Complete the analogy: DOCTOR : STETHOSCOPE :: CARPENTER : ___', 'HAMMER (or SAW or CHISEL)\nRelationship: WORKER-TO-TOOL\nA doctor uses a stethoscope; a carpenter uses a hammer.\n\nOther examples:\n• Teacher : Chalk\n• Painter : Brush\n• Farmer : Plow\n• Writer : Pen'),
  fc(T.PRO_word_assoc, 'Complete the analogy: BENEVOLENT : MALEVOLENT :: OPTIMISTIC : ___', 'PESSIMISTIC\nRelationship: ANTONYM\nBenevolent (kind, generous) is opposite to malevolent (evil, harmful).\nOptimistic (hopeful, positive) is opposite to pessimistic (hopeless, negative).\n\nSimilar pattern:\n• Courage : Cowardice\n• Diligent : Lazy\n• Verbose : Concise'),
  fc(T.PRO_word_assoc, 'Complete the analogy: ISLAND : ARCHIPELAGO :: STAR : ___', 'GALAXY (or CONSTELLATION)\nRelationship: PART-TO-WHOLE\nAn island is part of an archipelago; a star is part of a galaxy.\n\nOther examples:\n• Soldier : Army\n• Player : Team\n• Petal : Flower\n• Page : Book'),
  fc(T.PRO_assumptions, 'What is the difference between a valid conclusion and an assumption?', 'VALID CONCLUSION: A statement that logically follows from the given premises. It is directly supported by evidence.\n\nASSUMPTION: A statement taken for granted (unstated premise). It is NOT explicitly stated but is necessary for the argument to work.\n\nExample:\nPremise: "All students who study hard pass the exam."\nPremise: "Maria studies hard."\nConclusion: "Maria will pass the exam." (VALID — follows logically)\nAssumption: "Studying hard is the only factor in passing." (unstated presumption)'),
  fc(T.PRO_logic, 'What is a syllogism? Give an example.', 'A syllogism is a logical argument with two premises and one conclusion.\n\nStructure:\nMajor premise: All A are B.\nMinor premise: C is A.\nConclusion: Therefore, C is B.\n\nExample:\nMajor: All humans are mortal.\nMinor: Socrates is a human.\nConclusion: Therefore, Socrates is mortal.\n\nInvalid syllogism example:\nAll cats are animals. All dogs are animals. Therefore, all cats are dogs. (INVALID — affirming the consequent)'),
  fc(T.PRO_logic, 'What does "if P then Q" mean in logic?', '"If P then Q" (P → Q) means:\n• P is the ANTECEDENT (condition/hypothesis)\n• Q is the CONSEQUENT (result/conclusion)\n\nValid inferences:\n• Modus Ponens: P is true → Q is true\n  "If it rains, the ground gets wet. It is raining. Therefore, the ground is wet."\n\n• Modus Tollens: Q is false → P is false\n  "If it rains, the ground gets wet. The ground is NOT wet. Therefore, it did NOT rain."\n\nInvalid:\n• "Q is true → P is true" (affirming consequent)\n• "P is false → Q is false" (denying antecedent)'),
];

// ── CLERICAL OPERATIONS (Sub-Pro) ────────────────────────────────────────────
const clericalCards = [
  fc(T.SUB_filing, 'What are the basic rules for alphabetic filing?', 'Rules for alphabetic filing:\n1. LETTER BY LETTER: Ignore spaces between words; file letter by letter.\n   Smith → Smithfield → Smithson\n\n2. SURNAME FIRST: For personal names, file by last name, then first, then middle.\n   "Juan dela Cruz" → filed as "Cruz, Juan dela"\n\n3. NOTHING BEFORE SOMETHING: A shorter name precedes a longer one with same beginning.\n   "Sam" comes before "Samuel"\n\n4. ABBREVIATIONS: File as if spelled out.\n   "St." = "Saint"; "Dr." = "Doctor"\n\n5. NUMBERS: File as if spelled out in full.\n   "5th Avenue" = "Fifth Avenue"'),
  fc(T.SUB_filing, 'What is the correct alphabetical order of these names?\nA. Santos, Maria\nB. Santos, Ana\nC. Santos, Antonio\nD. Santos, Anita', 'Correct order: B → D → C → A\n\nB. Santos, ANA\nD. Santos, ANITA (An-i...)\nC. Santos, ANTONIO (An-t...)\nA. Santos, MARIA (Ma...)\n\nRationale: Compare letter by letter after "Santos, An-"\n• Ana: A-n-a\n• Anita: A-n-i-t-a (i comes after a)\n• Antonio: A-n-t-o-n-i-o (t comes after i)\n• Maria: M comes after A'),
  fc(T.SUB_filing, 'How do you file company names alphabetically?', 'For COMPANY NAMES:\n• File as written, EXCEPT:\n  - Articles (The, A, An) at the BEGINNING are ignored for filing\n  - "The" is transposed to the end\n\nExamples:\n• "The Philippine Star" → filed as "Philippine Star, The"\n• "A1 Hardware" → filed as "A1 Hardware" (A1 is not an article here)\n• "An Answer to Prayer" → filed as "Answer to Prayer, An"\n\nInitials and abbreviations: File as written or spelled out (follow agency rules)'),
  fc(T.SUB_spelling, 'Commonly misspelled words in Filipino public service', 'CORRECT SPELLINGS:\n• Accommodate (not "accomodate")\n• Necessary (not "neccessary") — 1 C, 2 S\n• Occurrence (not "occurence") — 2 C, 2 R\n• Separate (not "seperate")\n• Definitely (not "definately")\n• Government (not "goverment")\n• Environment (not "enviroment")\n• Commitment (not "committment") — 2 M at end\n• Bureaucracy (not "burocracy")\n• Personnel (not "personel") — 2 N'),
  fc(T.SUB_spelling, 'Commonly misspelled words: double letters', 'Words often incorrectly doubled or not doubled:\n• Committee — double M, double T, double E\n• Millennium — double L, double N\n• Parallel — only 1 L at start, double L in middle\n• Aggravate — double G\n• Assassinate — double S twice\n• Misspell — double S\n• Occasion — double C, single S\n• Professor — double F, double S\n• Successful — double C, double S\n• Tomorrow — double R, double M'),
  fc(T.SUB_laws_ethics, 'What is the CSC\'s role in Philippine government?', 'The Civil Service Commission (CSC) is the central personnel agency of the government.\n\nMain functions:\n• Administer and enforce civil service laws\n• Conduct civil service examinations (CSE-PPT and CSE-Pen)\n• Establish qualification standards\n• Hear and decide administrative cases against civil servants\n• Promote meritocracy and professionalism in government\n• Issue guidelines on government human resource management\n\nAll government positions are subject to the merit system — qualified based on competence, not politics.'),
  fc(T.SUB_laws_ethics, 'What is the merit system in Philippine civil service?', 'The MERIT SYSTEM means government positions are filled based on QUALIFICATIONS and PERFORMANCE — not on political, family, or personal connections.\n\nCore principles:\n1. Recruitment based on MERIT and FITNESS\n2. Equal opportunity — all qualified persons may apply\n3. Security of tenure — no illegal dismissal\n4. Competitive examination — CSE as entry requirement for most positions\n\nThe Civil Service Commission enforces the merit system to ensure professional and competent government service.'),
];

// ── PARAGRAPH ORGANIZATION ───────────────────────────────────────────────────
const paragraphCards = [
  fc(T.PRO_paragraph_org, 'What is the function of a topic sentence?', 'The TOPIC SENTENCE states the MAIN IDEA of a paragraph.\n\nCharacteristics:\n• Usually the FIRST sentence (but can be last or middle)\n• Controls what the rest of the paragraph discusses\n• General enough to be supported by details\n• Specific enough to be developed in one paragraph\n\nExample:\n"Regular exercise offers numerous health benefits." (topic sentence)\n[Followed by details about specific benefits]'),
  fc(T.PRO_paragraph_org, 'What is paragraph coherence?', 'COHERENCE means the ideas in a paragraph flow smoothly and logically.\n\nTools for coherence:\n1. TRANSITION WORDS: furthermore, however, therefore, in addition, on the other hand\n2. PRONOUN REFERENCES: he, she, it, they (referring back to nouns)\n3. REPETITION of key words\n4. LOGICAL ORDER: chronological, spatial, order of importance\n\nOpposite of coherence: INCOHERENCE — ideas jump around randomly without clear connection.'),
  fc(T.PRO_paragraph_org, 'What are common transitional words for each relationship type?', 'ADDITION: furthermore, moreover, in addition, also, besides, additionally\n\nCONTRAST: however, on the other hand, nevertheless, but, although, despite\n\nCAUSE-EFFECT: therefore, consequently, as a result, hence, thus, because\n\nEXAMPLE: for instance, for example, such as, specifically, to illustrate\n\nSEQUENCE: first, second, then, next, finally, subsequently\n\nCONCLUSION: in conclusion, in summary, therefore, to sum up, ultimately'),
  fc(T.SUB_paragraph_org, 'What makes a good paragraph?', 'A good paragraph has:\n\n1. UNITY — all sentences relate to the main idea (topic sentence)\n2. COHERENCE — ideas flow smoothly with transitions\n3. DEVELOPMENT — main idea is fully supported with details, examples, or evidence\n\nParagraph structure:\n• TOPIC SENTENCE (main idea)\n• SUPPORTING SENTENCES (details, examples, explanation)\n• CONCLUDING SENTENCE (optional: wrap up or transition)'),
  // Filipino Paragraph Organization
  fc(T.PRO_paragraph_fil, 'Ano ang Pagtatalata (Paragraph Development sa Filipino)?', 'Ang PAGTATALATA ay ang pagbubuo ng isang malinaw at organisadong talata sa Filipino.\n\nAng isang mabuting talata ay may:\n1. PAKSA (Topic Sentence) — pangunahing ideya\n2. MGA PANGALAWANG PANGUNGUSAP — sumusuporta sa paksa\n3. KONKLUSYON — pangwakas na pangungusap\n\nMga uri ng pamamaraan ng pagbuo:\n• Pagsasalaysay (narration)\n• Paglalarawan (description)\n• Pagpapaliwanag (exposition/explanation)\n• Pagtanggol ng pananaw (argumentation)'),
];

// ── ENVIRONMENT AND PEACE/HUMAN RIGHTS ───────────────────────────────────────
const genInfoCards = [
  fc(T.PRO_environment, 'What is the Philippine Clean Air Act? (RA 8749)', 'Republic Act 8749 — the Philippine Clean Air Act of 1999.\n\nPurpose: Prevent and control air pollution in the Philippines.\nKey provisions:\n• Bans burning of solid wastes (open burning)\n• Sets standards for vehicle emissions\n• Regulates industrial air pollutants\n• Phaseout of leaded gasoline\n• Establishment of Air Quality Management Fund\n\nImplementing agency: Department of Environment and Natural Resources (DENR)'),
  fc(T.PRO_environment, 'What is the Ecological Solid Waste Management Act? (RA 9003)', 'Republic Act 9003 — Ecological Solid Waste Management Act of 2000.\n\nKey provisions:\n• Mandates proper solid waste management in all LGUs\n• Requires waste segregation at source\n• Establishes ecological solid waste management programs\n• Bans open dumpsites; LGUs must use sanitary landfills\n• Creates the National Solid Waste Management Commission\n\nRule: Segregation at source: biodegradable, non-biodegradable, recyclable, special wastes.'),
  fc(T.PRO_environment, 'What is RA 9275 (Clean Water Act)?', 'Republic Act 9275 — Philippine Clean Water Act of 2004.\n\nPurpose: Protect the country\'s water bodies from pollution.\nKey provisions:\n• Prohibits discharging pollution into water bodies\n• Mandates wastewater treatment before discharge\n• Sets water quality standards\n• Creates Water Quality Management Areas\n• Polluter pays principle\n\nThe act covers all water bodies: rivers, lakes, coastal areas, and groundwater.'),
  fc(T.PRO_peace, 'What is the Universal Declaration of Human Rights (UDHR)?', 'The UDHR was adopted by the UN General Assembly on December 10, 1948.\n\nKey provisions:\n• All human beings are born free and equal in dignity and rights\n• Right to life, liberty, and security of person\n• No torture or cruel punishment\n• Everyone has the right to an education\n• Freedom of thought, conscience, and religion\n• Right to work and rest\n\nDecember 10 = Human Rights Day\n\nThe Philippines is a signatory. Human rights are UNIVERSAL, INDIVISIBLE, and INALIENABLE.'),
  fc(T.PRO_peace, 'What is R.A. 9710 (Magna Carta of Women)?', 'Republic Act 9710 — the Magna Carta of Women (2009).\n\nPurpose: Eliminate discrimination against women and promote gender equality.\n\nKey provisions:\n• Equal access to education, training, and skills development\n• Equal rights in the workplace (equal pay for equal work)\n• Right to health and reproductive services\n• Protection from all forms of violence against women\n• Participation in governance and decision-making\n• Special leave benefit for women (60 days for gynecological procedures)\n\nImplementing agency: Philippine Commission on Women (PCW)'),
];

// ── Combine all cards ────────────────────────────────────────────────────────
const ALL_FLASHCARDS = [
  ...grammarCards,
  ...vocabCards,
  ...filVocabCards,
  ...constitutionCards,
  ...ra6713Cards,
  ...numericalCards,
  ...analyticalCards,
  ...clericalCards,
  ...paragraphCards,
  ...genInfoCards,
];

console.log(`\n📚 Total flashcards to insert: ${ALL_FLASHCARDS.length}\n`);

// ── Insert in batches of 50 ──────────────────────────────────────────────────
const BATCH = 50;
let inserted = 0, failed = 0;

// First, clear existing flashcards if any
const { count: existing } = await sb.from('flashcards').select('*', { count: 'exact', head: true });
if (existing > 0) {
  console.log(`Removing ${existing} existing flashcards before re-import...`);
  const { error: delErr } = await sb.from('flashcards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1); }
  console.log('✓ Existing flashcards cleared.\n');
}

for (let i = 0; i < ALL_FLASHCARDS.length; i += BATCH) {
  const batch = ALL_FLASHCARDS.slice(i, i + BATCH);
  const { error } = await sb.from('flashcards').insert(batch);
  if (error) {
    console.error(`  ✗ Batch ${Math.floor(i/BATCH)+1}: ${error.message}`);
    failed += batch.length;
  } else {
    inserted += batch.length;
    process.stdout.write(`  ✓ Inserted ${inserted}/${ALL_FLASHCARDS.length}\r`);
  }
}

console.log(`\n\n✅ Done! ${inserted} flashcards inserted, ${failed} failed.\n`);

// Summary by topic
console.log('Flashcard counts by topic:');
const topicCounts = {};
for (const fc of ALL_FLASHCARDS) {
  topicCounts[fc.topic_id] = (topicCounts[fc.topic_id] || 0) + 1;
}
const topicNames = {
  [T.PRO_grammar]: 'PRO Grammar',
  [T.PRO_vocabulary]: 'PRO Vocabulary',
  [T.PRO_vocab_fil]: 'PRO Filipino Vocabulary',
  [T.PRO_grammar_fil]: 'PRO Filipino Grammar',
  [T.PRO_paragraph_org]: 'PRO Paragraph Org',
  [T.PRO_paragraph_fil]: 'PRO Filipino Paragraph',
  [T.PRO_word_assoc]: 'PRO Word Association',
  [T.PRO_assumptions]: 'PRO Assumptions',
  [T.PRO_logic]: 'PRO Logic',
  [T.PRO_word_problems]: 'PRO Word Problems',
  [T.PRO_number_series]: 'PRO Number Series',
  [T.PRO_basic_ops]: 'PRO Basic Operations',
  [T.PRO_constitution]: 'PRO Constitution',
  [T.PRO_ra6713]: 'PRO RA 6713',
  [T.PRO_peace]: 'PRO Peace/Human Rights',
  [T.PRO_environment]: 'PRO Environment',
  [T.SUB_grammar]: 'SUB Grammar',
  [T.SUB_vocabulary]: 'SUB Vocabulary',
  [T.SUB_vocab_fil]: 'SUB Filipino Vocabulary',
  [T.SUB_grammar_fil]: 'SUB Filipino Grammar',
  [T.SUB_paragraph_org]: 'SUB Paragraph Org',
  [T.SUB_word_problems]: 'SUB Word Problems',
  [T.SUB_basic_ops]: 'SUB Basic Operations',
  [T.SUB_number_series]: 'SUB Number Series',
  [T.SUB_phil_gov]: 'SUB Philippine Government',
  [T.SUB_laws_ethics]: 'SUB Laws & Ethics',
  [T.SUB_filing]: 'SUB Filing & Coding',
  [T.SUB_spelling]: 'SUB Spelling',
};
for (const [id, count] of Object.entries(topicCounts)) {
  console.log(`  ${(topicNames[id] || id).padEnd(30)}: ${count}`);
}
