/**
 * CSE Flashcards Batch 3 — Final batch for full coverage
 * Targets thin topics: abstract reasoning, analytical, more vocab,
 * word problems, general info, Filipino language skills, CSE tips
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const T = {
  PRO_grammar: '90ba4b46-caf1-41bc-9039-1cfbc2e0baf1',
  PRO_vocabulary: '1cd5d867-5041-4810-bad0-a911323ced1f',
  PRO_paragraph_org: '0e22fcfd-195f-475c-8df5-5584e229cbee',
  PRO_reading_comp: '5d338572-e1e8-4792-a5e3-017309c9e6b7',
  PRO_verbal_comp: 'e35bd4ee-073a-491b-b7b1-69dd7811e50b',
  PRO_vocab_fil: 'c2808ba1-5ba9-449c-afbf-a4dbd1d248dd',
  PRO_grammar_fil: 'd3b160b3-f0e1-4fd4-a9d8-c8dcbc401c79',
  PRO_reading_fil: '43399734-967c-444c-b583-b68fdff2de1c',
  PRO_paragraph_fil: '867c0551-9aa4-4dad-a4fc-bc8d8d6eada4',
  PRO_word_assoc: '93402385-8ef0-4369-ba42-5883dcd52fbf',
  PRO_assumptions: '2c63e431-c2d8-4c52-9ed3-8155216bdb23',
  PRO_logic: '42afbfbc-eb26-4470-8482-3139e2a888aa',
  PRO_data_interp: 'df65e506-4990-4575-b4c0-bade603612a8',
  PRO_basic_ops: 'fee58356-630c-416c-8c5c-3dbfaeb28804',
  PRO_number_series: '05987dfb-0f8e-4f74-a026-846b26347bcb',
  PRO_word_problems: '097e3e89-db17-4f8f-ab8f-c816e9a11c80',
  PRO_constitution: '66b572bd-cfb1-469e-84e2-bb73d33b2309',
  PRO_ra6713: '9a1e25cb-c571-4785-b46b-04255a88261f',
  PRO_peace: '1c356aaa-aaad-4815-ba83-cddce482201e',
  PRO_environment: 'a22c09fe-a0a0-4c97-ad90-c2944de0dc2e',
  SUB_grammar: 'd5388143-2857-4f97-bb76-8dd02f42a982',
  SUB_vocabulary: 'd32d7e74-2958-4e1e-9049-2901156a0a06',
  SUB_reading_comp: '4e85b207-50d3-4e8b-8675-f3a56db77370',
  SUB_paragraph_org: '539b1777-4f5d-40a8-8a04-703038f1653a',
  SUB_vocab_fil: 'e4856eb1-2eaf-45e7-92b3-85953623a847',
  SUB_grammar_fil: 'd6e97a36-5e2f-4a98-a363-abefdcf7ab62',
  SUB_reading_fil: '679fffb1-c0ca-46e8-93e2-f0c35874b960',
  SUB_paragraph_fil: '9b226eb5-beb6-41ac-b92e-b666294126a3',
  SUB_word_problems: '388e380d-69cb-4d91-b071-e7fde8c44e47',
  SUB_basic_ops: '8ba47590-7a27-4576-a849-60baf7826152',
  SUB_number_series: 'dec5d971-da1e-40cf-b359-d533e4160b02',
  SUB_phil_gov: 'deb97a8a-da6a-4175-af1d-4b4d3eb937f8',
  SUB_laws_ethics: 'bc89d6de-05dd-43ec-9ec4-9a84229e6298',
  SUB_filing: '38ae46c3-4cdd-4a65-8a11-3aaf01921f57',
  SUB_spelling: '55bc7cff-808b-48b7-97cb-1cb93ca1e5ee',
};
const f = (t, fr, bk) => ({ topic_id: t, front: fr, back: bk, is_premium: false });

// ── MORE VOCABULARY ───────────────────────────────────────────────────────────
const v3 = [
  f(T.PRO_vocabulary,'FRUGAL (adjective)','Meaning: Sparing or economical with money; thrifty.\nSynonyms: thrifty, economical, sparing, prudent\nAntonyms: extravagant, wasteful, lavish, prodigal\nExample: "A frugal government avoids unnecessary expenditures."'),
  f(T.PRO_vocabulary,'ARDENT (adjective)','Meaning: Very enthusiastic or passionate.\nSynonyms: passionate, enthusiastic, fervent, zealous, eager\nAntonyms: indifferent, apathetic, lukewarm, cold\nExample: "She was an ardent advocate for education reform."'),
  f(T.PRO_vocabulary,'OSTENSIBLE (adjective)','Meaning: Stated or appearing to be true, but not necessarily so; apparent.\nSynonyms: apparent, seeming, supposed, professed, alleged\nAntonyms: genuine, real, actual, true\nExample: "The ostensible reason for the meeting was budget review, but the real agenda was restructuring."'),
  f(T.PRO_vocabulary,'INIMICAL (adjective)','Meaning: Tending to obstruct or harm; hostile or unfavorable.\nSynonyms: hostile, harmful, adverse, detrimental, unfriendly\nAntonyms: friendly, favorable, beneficial, helpful\nExample: "Corruption is inimical to good governance."'),
  f(T.PRO_vocabulary,'PERNICIOUS (adjective)','Meaning: Having a harmful effect, especially in a gradual or subtle way.\nSynonyms: harmful, detrimental, damaging, destructive, deleterious\nAntonyms: beneficial, helpful, harmless, benign\nExample: "The pernicious influence of drugs destroyed many promising young lives."'),
  f(T.PRO_vocabulary,'VENERATE (verb)','Meaning: To regard with great respect; to revere.\nSynonyms: respect, revere, honor, admire, esteem\nAntonyms: disrespect, despise, dishonor, scorn\nExample: "Filipinos venerate their national heroes and remember their sacrifices."'),
  f(T.PRO_vocabulary,'FORTUITOUS (adjective)','Meaning: Happening by chance; accidental; fortunate.\nSynonyms: accidental, chance, lucky, unplanned, coincidental\nAntonyms: deliberate, planned, intentional, expected\nExample: "Their meeting at the conference was fortuitous — it led to a major business partnership."'),
  f(T.PRO_vocabulary,'RETICENT (adjective)','Meaning: Not revealing one\'s thoughts or feelings readily; reserved.\nSynonyms: reserved, quiet, taciturn, uncommunicative, secretive\nAntonyms: outspoken, communicative, talkative, forthcoming\nExample: "The witness was reticent and refused to provide details about the incident."'),
  f(T.PRO_vocabulary,'GARRULOUS (adjective)','Meaning: Excessively talkative, especially on trivial matters.\nSynonyms: talkative, chatty, verbose, loquacious, voluble\nAntonyms: silent, reticent, taciturn, brief\nExample: "The garrulous official spent more time talking than working."'),
  f(T.PRO_vocabulary,'TACITURN (adjective)','Meaning: Reserved or uncommunicative in speech; saying little.\nSynonyms: silent, reserved, reticent, quiet, uncommunicative\nAntonyms: talkative, garrulous, loquacious, verbose\nExample: "Despite her intelligence, she was taciturn in meetings."'),
  f(T.PRO_vocabulary,'SYCOPHANT (noun)','Meaning: A person who acts obsequiously toward someone important in order to gain advantage; a flatterer.\nSynonyms: flatterer, yes-man, toady, bootlicker, brown-noser\nAntonyms: critic, detractor, opponent\nExample: "The official was surrounded by sycophants who only told him what he wanted to hear."'),
  f(T.PRO_vocabulary,'DISPARITY (noun)','Meaning: A great difference; inequality.\nSynonyms: difference, inequality, gap, imbalance, divergence\nAntonyms: equality, parity, similarity, balance\nExample: "There is a growing disparity between rich and poor in many countries."'),
  f(T.PRO_vocabulary,'AMELIORATE (verb)','Meaning: To make something bad or unsatisfactory better; to improve.\nSynonyms: improve, better, enhance, upgrade, remedy\nAntonyms: worsen, aggravate, deteriorate, exacerbate\nExample: "New housing programs ameliorate the living conditions of informal settlers."'),
  f(T.PRO_vocabulary,'LUCID (adjective)','Meaning: Expressed clearly; easy to understand; mentally clear.\nSynonyms: clear, understandable, intelligible, transparent, articulate\nAntonyms: confusing, unclear, muddy, obscure\nExample: "She gave a lucid explanation of the complex policy."'),
  f(T.PRO_vocabulary,'FASTIDIOUS (adjective)','Meaning: Very attentive to accuracy and detail; difficult to please; excessively particular.\nSynonyms: meticulous, precise, particular, fussy, demanding\nAntonyms: careless, sloppy, easy-going, indiscriminate\nExample: "The fastidious editor corrected every comma in the manuscript."'),
  f(T.SUB_vocabulary,'RELIABLE (adjective) — synonyms and antonyms','Synonyms: dependable, trustworthy, steadfast, consistent\nAntonyms: unreliable, undependable, inconsistent\n\nExample: "A reliable employee meets deadlines and keeps promises."'),
  f(T.SUB_vocabulary,'TRANSPARENT (adjective) — synonyms and antonyms','Synonyms: clear, open, honest, forthright, obvious\nAntonyms: opaque, hidden, secretive, deceptive\n\nExample: "The government promised to be transparent in its dealings with the public."'),
  f(T.SUB_vocabulary,'RATIONAL (adjective) — synonyms and antonyms','Synonyms: logical, reasonable, sensible, sound, sane\nAntonyms: irrational, illogical, unreasonable, absurd\n\nExample: "A rational decision is based on facts and sound reasoning."'),
  f(T.SUB_vocabulary,'PERSISTENT (adjective) — synonyms and antonyms','Synonyms: tenacious, determined, resolute, steadfast, stubborn\nAntonyms: yielding, irresolute, wishy-washy, wavering\n\nExample: "Her persistent effort paid off when she finally passed the civil service exam."'),
  f(T.SUB_vocabulary,'ACCOUNTABLE (adjective) — synonyms and antonyms','Synonyms: responsible, answerable, liable, obligated\nAntonyms: unaccountable, irresponsible, exempt\n\nExample: "All public servants are accountable to the people they serve."'),
];

// ── ANALYTICAL (Word Association extended) ────────────────────────────────────
const wa2 = [
  f(T.PRO_word_assoc,'Complete the analogy: WATER : OCEAN :: SAND : ___','DESERT\nRelationship: SUBSTANCE-TO-LARGE COLLECTION\nWater is the primary substance of an ocean; sand is the primary substance of a desert.\n\nAlternative: WATER : THIRST :: FOOD : HUNGER (need-to-satisfy)'),
  f(T.PRO_word_assoc,'Complete the analogy: NURSE : HOSPITAL :: TEACHER : ___','SCHOOL (or CLASSROOM)\nRelationship: WORKER-TO-WORKPLACE\nA nurse works in a hospital; a teacher works in a school.\n\nSimilar:\n• Pilot : Airplane/Airport\n• Chef : Kitchen/Restaurant\n• Farmer : Field/Farm'),
  f(T.PRO_word_assoc,'Complete the analogy: GLOVES : HANDS :: HELMET : ___','HEAD\nRelationship: PROTECTIVE GEAR-TO-BODY PART\nGloves protect the hands; a helmet protects the head.\n\nSimilar:\n• Goggles : Eyes\n• Earplugs : Ears\n• Shoes : Feet\n• Knee pads : Knees'),
  f(T.PRO_word_assoc,'Complete the analogy: THERMOMETER : TEMPERATURE :: BAROMETER : ___','ATMOSPHERIC PRESSURE (or AIR PRESSURE)\nRelationship: INSTRUMENT-TO-WHAT IT MEASURES\nA thermometer measures temperature; a barometer measures atmospheric pressure.\n\nSimilar:\n• Speedometer : Speed\n• Altimeter : Altitude\n• Seismograph : Earthquake intensity\n• Hygrometer : Humidity'),
  f(T.PRO_word_assoc,'Complete the analogy: CHAPTER : NOVEL :: ACT : ___','PLAY (or DRAMA or OPERA)\nRelationship: SUBDIVISION-TO-WHOLE\nA chapter is a division of a novel; an act is a division of a play.\n\nSimilar:\n• Verse : Poem\n• Episode : Series\n• Inning : Baseball game\n• Period : Hockey game'),
  f(T.PRO_word_assoc,'Complete the analogy: SEED : PLANT :: EGG : ___','BIRD (or CHICK or ANIMAL)\nRelationship: ORIGIN-TO-RESULT or YOUNG-TO-ADULT\nA seed grows into a plant; an egg hatches into a bird/chick.\n\nAlternate: SOURCE-TO-PRODUCT\nSimilar:\n• Caterpillar : Butterfly\n• Tadpole : Frog\n• Larva : Insect'),
  f(T.PRO_word_assoc,'Complete the analogy: AUTHOR : NOVEL :: SCULPTOR : ___','STATUE (or SCULPTURE)\nRelationship: ARTIST-TO-WORK\nAn author creates a novel; a sculptor creates a statue.\n\nSimilar:\n• Composer : Symphony\n• Architect : Building\n• Painter : Painting\n• Filmmaker : Film'),
  f(T.PRO_word_assoc,'Complete the analogy: MALEVOLENT : KIND :: VERBOSE : ___','CONCISE (or SUCCINCT or BRIEF)\nRelationship: ANTONYM\nMalevolent (evil) is opposite to kind; verbose (wordy) is opposite to concise.\n\nNote: Both pairs are perfect antonyms.'),
  f(T.PRO_word_assoc,'Complete the analogy: SCALES : JUSTICE :: SYRINGE : ___','MEDICINE (or HEALTHCARE or VACCINATION)\nRelationship: SYMBOL-TO-CONCEPT or TOOL-TO-FIELD\nScales are the symbol of justice; a syringe is the symbol/tool of medicine/healthcare.'),
  f(T.PRO_word_assoc,'Complete the analogy: PENINSULA : LAND :: CAPE : ___','LAND (or HEADLAND)\nRelationship: Both are landforms that project into water.\nAlternative view: TYPE-TO-CATEGORY\nBoth peninsula and cape are landforms projecting into a body of water.\nPeninsula = large land projection. Cape = smaller land projection.'),
];

// ── NUMERICAL: MORE WORD PROBLEMS ────────────────────────────────────────────
const wp3 = [
  f(T.PRO_word_problems,'Formula: Ratio and Proportion','RATIO: comparison of two quantities (a:b or a/b)\nPROPORTION: two equal ratios (a:b = c:d)\n\nCross-multiplication: If a/b = c/d, then ad = bc\n\nExample: "If 3 books cost ₱450, how much do 7 books cost?"\n3/450 = 7/x → 3x = 3,150 → x = ₱1,050\n\nDirect proportion: As one increases, the other increases.\nInverse proportion: As one increases, the other decreases.'),
  f(T.PRO_word_problems,'Solve: Pedro sells newspapers for ₱15 each. He earns 20% commission. How many newspapers must he sell to earn ₱600?','Commission per newspaper = 20% of ₱15 = ₱3\nNumber needed = Total target ÷ Commission per unit\nNumber = ₱600 ÷ ₱3 = 200 newspapers\n\nAnswer: Pedro must sell 200 newspapers.'),
  f(T.PRO_word_problems,'Solve: A tank is filled by Pipe A in 4 hours and drained by Pipe B in 6 hours. If both pipes are open, how long to fill the empty tank?','Fill rate (A) = 1/4 per hour\nDrain rate (B) = -1/6 per hour\nNet rate = 1/4 - 1/6 = 3/12 - 2/12 = 1/12 per hour\nTime to fill = 1 ÷ (1/12) = 12 hours\n\nAnswer: 12 hours'),
  f(T.PRO_word_problems,'Solve: A store sells items at 30% above cost. An item sells for ₱390. What is the cost price?','Selling Price = Cost Price × (1 + markup rate)\n₱390 = CP × 1.30\nCP = ₱390 ÷ 1.30 = ₱300\n\nAnswer: Cost price is ₱300.\nProfit = ₱390 - ₱300 = ₱90 (which is 30% of ₱300 ✓)'),
  f(T.PRO_word_problems,'Solve: A sum of ₱15,000 is invested, part at 5% and the rest at 8% per year. Total interest is ₱960. How much is at each rate?','Let x = amount at 5%. (15,000 - x) = amount at 8%.\n\n0.05x + 0.08(15,000 - x) = 960\n0.05x + 1,200 - 0.08x = 960\n-0.03x = -240\nx = 8,000\n\n₱8,000 at 5% and ₱7,000 at 8%\nCheck: 0.05(8,000) + 0.08(7,000) = 400 + 560 = 960 ✓'),
  f(T.SUB_word_problems,'Solve: A rectangular room is 8m long and 6m wide. What is the perimeter and area?','PERIMETER = 2 × (length + width) = 2 × (8 + 6) = 2 × 14 = 28 meters\n\nAREA = length × width = 8 × 6 = 48 square meters\n\nKey formulas:\n• Rectangle: P = 2(l + w); A = l × w\n• Square: P = 4s; A = s²\n• Triangle: A = (1/2) × base × height\n• Circle: C = 2πr; A = πr²'),
  f(T.SUB_word_problems,'Solve: Anna can type 60 words per minute. How long to type a 4,500-word document?','Time = Words ÷ Words per minute\nTime = 4,500 ÷ 60 = 75 minutes\n\n75 minutes = 1 hour and 15 minutes\n\nAnswer: 1 hour and 15 minutes'),
];

// ── CONSTITUTION ADDITIONAL ───────────────────────────────────────────────────
const con3 = [
  f(T.PRO_constitution,'What are the guarantees under freedom of expression (Art. III, Sec. 4)?','Article III, Section 4: "No law shall be passed abridging the freedom of speech, of expression, or of the press, or the right of the people peaceably to assemble and petition the government for redress of grievances."\n\nCovered freedoms:\n1. Freedom of SPEECH (spoken words)\n2. Freedom of EXPRESSION (actions, symbolic speech)\n3. Freedom of the PRESS (written/broadcast media)\n4. Freedom of ASSEMBLY (peaceful gatherings)\n5. Right to PETITION the government\n\nLimitations: Freedom of expression is NOT absolute. It can be limited by laws against libel, obscenity, incitement to violence, and national security threats.'),
  f(T.PRO_constitution,'What is the writ of habeas corpus and when can it be suspended?','WRIT OF HABEAS CORPUS is a court order directing that a person be brought before the court to determine if detention is lawful.\n\nPurpose: Protects against illegal imprisonment.\n\nSuspension: Only the PRESIDENT can suspend the privilege of the writ of habeas corpus, and only in cases of:\n• Invasion\n• Rebellion\n• Public safety requires it\n\nLimitations:\n• Cannot exceed 60 days (Congress may revoke)\n• Congress must ratify within 48 hours\n• Supreme Court can review the factual basis\n• Does NOT suspend all civil rights — only the privilege of the writ'),
  f(T.PRO_constitution,'What is the writ of amparo?','The WRIT OF AMPARO is a Philippine remedy available to any person whose right to life, liberty, and security is violated or threatened by an unlawful act or omission.\n\nKey features:\n• Filed against government and private parties\n• Covers cases of extrajudicial killings and enforced disappearances\n• Provides immediate court protection\n• Faster process than regular courts\n\nDistinction:\n• Habeas corpus: determines legality of detention\n• Amparo: broader protection for life, liberty, security threats even without formal detention'),
  f(T.PRO_constitution,'What is martial law in the Philippines? (Article VII, Section 18)','MARTIAL LAW is the imposition of direct military control over civilian government functions, declared by the President in cases of invasion or rebellion when public safety requires it.\n\nKey provisions:\n• Duration: Not to exceed 60 days without Congressional extension\n• Within 48 hours: President must submit report to Congress\n• Congress may revoke (majority vote)\n• Supreme Court may review sufficiency of factual basis\n• Martial law does NOT suspend the Constitution\n• Martial law does NOT confer judicial powers to the military\n• Even under martial law, bills of rights remain'),
  f(T.PRO_constitution,'What is the Natural Resources provision? (Article XII)','Article XII, Section 2: "All lands of the public domain, waters, minerals, coal, petroleum, and other mineral oils, all forces of potential energy, fisheries, forests or timber, wildlife, flora and fauna, and other natural resources are owned by the State."\n\nFILIPINO FIRST POLICY:\n• Only Filipino citizens or corporations 60% Filipino-owned may use natural resources\n• Land may be alienated to private parties only if they are Filipino citizens\n• Exception: Co-production, joint venture, or production-sharing with the State for large-scale exploration of minerals and other resources\n\nRegalian Doctrine: All natural resources belong to the State.'),
  f(T.SUB_phil_gov,'What are the rights of citizens under the Bill of Rights?','Key rights guaranteed to all persons in the Philippines:\n\n1. RIGHT TO DUE PROCESS — fair treatment in law\n2. RIGHT TO EQUAL PROTECTION — no discrimination\n3. RIGHT TO PRIVACY — personal spaces and communications protected\n4. FREEDOM OF SPEECH and PRESS\n5. FREEDOM OF RELIGION\n6. RIGHT AGAINST UNREASONABLE SEARCHES — need a warrant\n7. RIGHT TO REMAIN SILENT and COUNSEL (Miranda rights)\n8. PRESUMPTION OF INNOCENCE — accused is innocent until proven guilty\n9. RIGHT TO SPEEDY TRIAL\n10. RIGHT AGAINST SELF-INCRIMINATION'),
];

// ── GENERAL INFO: ENVIRONMENT & PEACE ────────────────────────────────────────
const gi3 = [
  f(T.PRO_environment,'What is the National Integrated Protected Areas System (NIPAS)?','Republic Act 7586 — NIPAS Act of 1992 (amended by RA 11038 in 2018).\n\nPurpose: To secure for the Filipino people the sustainable use of natural resources in protected areas.\n\nProtected area categories:\n• Strict nature reserve\n• Natural park (largest category)\n• Natural monument\n• Wildlife sanctuary\n• Protected landscapes and seascapes\n• Resource reserve\n• Natural biotic area\n\nKey: No cutting, hunting, or mining in protected areas without authorization. The DENR manages these areas.'),
  f(T.PRO_environment,'What is the Paris Agreement and what is the Philippines\' commitment?','The PARIS AGREEMENT (2015) is an international climate treaty under the UNFCCC.\n\nGoal: Limit global warming to 1.5-2°C above pre-industrial levels.\n\nKey elements:\n• Countries set Nationally Determined Contributions (NDCs)\n• Developed countries provide financial support to developing countries\n• Global review every 5 years\n\nPhilippines\' commitment:\n• Reduce greenhouse gas emissions by 75% by 2030 (conditional on international support)\n• Transition to renewable energy\n• Strengthen climate adaptation programs'),
  f(T.PRO_environment,'What is RA 9512 (Environmental Awareness and Education Act)?','Republic Act 9512 — Environmental Awareness and Education Act of 2008.\n\nKey provisions:\n• Environmental education integrated in ALL school levels (elementary through college)\n• Establishes Environmental Awareness Month (November)\n• Mandates local government units to include environmental programs\n• Teachers must receive environmental education training\n\nPurpose: Develop Filipinos who are environmentally aware and responsible citizens who help protect and conserve nature.'),
  f(T.PRO_peace,'What are the key principles of the Universal Declaration of Human Rights?','Key UDHR principles:\n1. UNIVERSALITY: Human rights belong to all people everywhere, regardless of race, sex, nationality, religion, language, etc.\n2. INALIENABILITY: Human rights cannot be taken away; they cannot be transferred or surrendered\n3. INDIVISIBILITY: All human rights are equally important; economic, social, and cultural rights are as important as civil and political rights\n4. INTERDEPENDENCE: All human rights are interconnected — realization of one depends on others\n5. EQUAL AND NON-DISCRIMINATORY: Apply equally to all without discrimination'),
  f(T.PRO_peace,'What is the Convention on the Rights of the Child (CRC)?','The CRC is the most widely ratified human rights treaty, adopted by the UN General Assembly on November 20, 1989.\n\nFour key principles:\n1. NON-DISCRIMINATION — all rights apply to all children\n2. BEST INTERESTS OF THE CHILD — primary consideration in all decisions about children\n3. RIGHT TO LIFE, SURVIVAL, AND DEVELOPMENT\n4. RIGHT TO BE HEARD — children have the right to express views and be listened to\n\nThe Philippines ratified the CRC in 1990. November 20 = World Children\'s Day\nRA 7610 (Special Protection of Children Against Abuse, Exploitation and Discrimination) implements CRC in the Philippines.'),
  f(T.PRO_peace,'What is the Anti-Torture Act? (RA 9745)','Republic Act 9745 — Anti-Torture Act of 2009.\n\nDefinition of torture: An act by which severe pain or suffering, whether physical or mental, is intentionally inflicted on a person.\n\nKey provisions:\n• Torture is absolutely prohibited, even in times of war or emergency\n• No order from a superior shall justify torture\n• Any confession obtained through torture is INADMISSIBLE in court\n• Victims have the right to a medical examination and legal counsel\n\nPenalty: 12 years to life imprisonment, depending on severity.'),
];

// ── VERBAL COMPREHENSION ──────────────────────────────────────────────────────
const vc = [
  f(T.PRO_verbal_comp,'What is a simile? Give examples.','A SIMILE is a figure of speech comparing two different things using "like" or "as."\n\nExamples:\n• "She is as brave as a lion."\n• "His voice sounded like thunder."\n• "The student was as sharp as a tack."\n• "Time flies like an arrow."\n\nDistinct from METAPHOR:\n• Simile: "She IS LIKE a rose." (uses "like" or "as")\n• Metaphor: "She IS a rose." (direct comparison, no "like" or "as")'),
  f(T.PRO_verbal_comp,'What is a metaphor? Give examples.','A METAPHOR is a figure of speech that directly equates two different things without using "like" or "as."\n\nExamples:\n• "Life is a journey."\n• "The world is a stage."\n• "Time is money."\n• "Her voice was music to his ears."\n• "He is a shining star in the company."\n\nExtended metaphor: A metaphor that runs throughout an entire poem or passage.'),
  f(T.PRO_verbal_comp,'What is personification? Give examples.','PERSONIFICATION attributes human characteristics to non-human things or ideas.\n\nExamples:\n• "The wind whispered through the trees."\n• "The sun smiled down on us."\n• "Justice is blind."\n• "The flowers danced in the breeze."\n• "Opportunity knocked at her door."\n\nPersonification makes abstract concepts or inanimate objects relatable by giving them human qualities.'),
  f(T.PRO_verbal_comp,'What is hyperbole? Give examples.','HYPERBOLE is an exaggerated statement or figure of speech not meant to be taken literally; used for emphasis or humor.\n\nExamples:\n• "I have a million things to do today."\n• "I\'m so hungry I could eat a horse."\n• "I\'ve told you a thousand times!"\n• "This bag weighs a ton."\n• "She is older than the hills."\n\nPurpose: Creates emphasis, humor, or dramatic effect. Recognizing hyperbole prevents misinterpretation.'),
  f(T.PRO_verbal_comp,'What is an idiom? Give common examples.','An IDIOM is a phrase whose meaning cannot be understood from the literal meanings of its individual words.\n\nCommon Philippine and English idioms:\n• "Hit the nail on the head" = to be exactly right\n• "Under the weather" = feeling sick\n• "Break the ice" = start a conversation in a social setting\n• "Bite the bullet" = endure a painful or difficult situation\n• "In the same boat" = in the same difficult situation\n• "Once in a blue moon" = very rarely\n• "Barking up the wrong tree" = looking in the wrong place'),
];

// ── DATA INTERPRETATION (extended) ────────────────────────────────────────────
const di2 = [
  f(T.PRO_data_interp,'How do you read and interpret a line graph?','A LINE GRAPH shows trends over time.\n\nSteps:\n1. Read the TITLE and AXES labels\n2. Note the SCALE and INTERVALS on each axis\n3. Identify KEY POINTS: highest, lowest, where lines meet\n4. Identify TRENDS: increasing, decreasing, stable, fluctuating\n5. COMPARE multiple lines if there are several\n\nCommon questions:\n• "In what year was the value highest?"\n• "Between which two years did the greatest increase occur?"\n• "What was the percentage increase from year X to year Y?"'),
  f(T.PRO_data_interp,'How do you solve a data sufficiency problem?','DATA SUFFICIENCY: Given a question and two statements (A and B), determine whether the data provided is sufficient to answer the question.\n\nAnswer choices (typical format):\n1. Statement 1 ALONE is sufficient\n2. Statement 2 ALONE is sufficient\n3. BOTH statements together are sufficient\n4. EACH statement alone is sufficient\n5. NEITHER statement, alone or together, is sufficient\n\nProcess:\n1. Try Statement 1 alone — can you answer the question definitively?\n2. Try Statement 2 alone — can you answer it?\n3. If neither alone, try combining them.'),
  f(T.PRO_data_interp,'What is the weighted average?','WEIGHTED AVERAGE: An average that takes into account the relative importance (weight) of each value.\n\nFormula: Weighted Average = Σ(value × weight) ÷ Σ(weights)\n\nExample: A student has:\n• 3 quizzes averaging 80 (weight: 1 each)\n• 1 midterm at 75 (weight: 3)\n• 1 final at 90 (weight: 5)\n\nWeighted avg = [(80×1 + 80×1 + 80×1) + (75×3) + (90×5)] / (3+3+5)\n= [240 + 225 + 450] / 11\n= 915 / 11\n= 83.18'),
];

// ── READING COMPREHENSION (extended) ─────────────────────────────────────────
const rc2 = [
  f(T.PRO_reading_comp,'What is the tone and mood of a passage?','TONE: The author\'s attitude toward the subject, expressed through word choice.\nExamples: formal, informal, humorous, solemn, critical, sympathetic, sarcastic\n\nMOOD: The emotional atmosphere created by the passage for the READER.\nExamples: cheerful, melancholic, tense, peaceful, ominous\n\nTo identify tone:\n• Look at WORD CHOICES (positive vs. negative connotation)\n• Notice DETAILS selected (what the author chooses to include)\n• Identify the PURPOSE (to inform, persuade, entertain, criticize)'),
  f(T.PRO_reading_comp,'How do you find the implied meaning of a passage?','IMPLIED MEANING (inference): Information suggested but NOT directly stated.\n\nSteps:\n1. Read the text carefully\n2. Note what is ACTUALLY said\n3. Think about what the author IMPLIES but does not say directly\n4. Consider the context, tone, and purpose\n5. Ask: "What conclusion can I reasonably draw?"\n\nExample:\n"The official arrived 45 minutes late to his own press conference with a wrinkled suit and coffee stain on his shirt."\nImplied: He was rushed, disorganized, or possibly had a difficult morning.'),
  f(T.SUB_reading_comp,'What are the 5Ws and 1H in reading comprehension?','The 5Ws and 1H are key questions used to understand any text:\n\nWHO — Who is involved? Who are the key people/characters?\nWHAT — What happened? What is the main idea?\nWHEN — When did it happen? What is the time frame?\nWHERE — Where did it happen? What is the setting?\nWHY — Why did it happen? What is the cause or reason?\nHOW — How did it happen? What is the process or method?\n\nThese questions help organize information and improve comprehension.'),
  f(T.SUB_reading_comp,'What is a supporting detail vs. the main idea?','MAIN IDEA: The central message or theme of the entire passage.\n• Broad enough to cover everything discussed\n• The "big picture"\n\nSUPPORTING DETAIL: A specific piece of information that elaborates on the main idea.\n• Facts, examples, statistics, descriptions\n• Answers "how," "why," "who," "what," "when," "where" about the main idea\n\nTest: If a statement is only true for ONE part of the passage → it\'s a detail.\nIf a statement covers the ENTIRE passage → it\'s the main idea.'),
];

// ── PARAGRAPH ORGANIZATION (extended) ────────────────────────────────────────
const po2 = [
  f(T.PRO_paragraph_org,'What is the difference between coherence and unity?','UNITY: ALL sentences in the paragraph relate to ONE topic.\n• If one sentence does NOT relate to the topic → unity is broken\n• Test: Does every sentence contribute to the main idea?\n\nCOHERENCE: The sentences FLOW LOGICALLY from one to the next.\n• Ideas are connected smoothly with transitions and pronoun references\n• The reader can follow without confusion\n\nA good paragraph needs BOTH:\n• Unity = the right content (all about the topic)\n• Coherence = the right arrangement (flows logically)'),
  f(T.PRO_paragraph_org,'What are the main methods of paragraph development?','Methods of developing a paragraph:\n\n1. DEFINITION — explain what something means\n2. EXAMPLE/ILLUSTRATION — give concrete instances\n3. COMPARISON-CONTRAST — show similarities and differences\n4. CAUSE AND EFFECT — explain why something happened or its results\n5. CLASSIFICATION — divide a subject into categories\n6. PROCESS — explain how something is done step by step\n7. NARRATION — tell a story or sequence of events\n8. DESCRIPTION — paint a picture with words\n9. ARGUMENTATION — present a position with supporting evidence'),
];

// Combine batch 3
const BATCH3 = [
  ...v3, ...wa2, ...wp3, ...con3, ...gi3, ...vc, ...di2, ...rc2, ...po2,
];

console.log(`\n📚 Batch 3: ${BATCH3.length} more flashcards to insert\n`);

const BATCH_SIZE = 50;
let inserted = 0, failed = 0;

for (let i = 0; i < BATCH3.length; i += BATCH_SIZE) {
  const batch = BATCH3.slice(i, i + BATCH_SIZE);
  const { error } = await sb.from('flashcards').insert(batch);
  if (error) {
    console.error(`  ✗ Batch ${Math.floor(i/BATCH_SIZE)+1}: ${error.message}`);
    failed += batch.length;
  } else {
    inserted += batch.length;
    process.stdout.write(`  ✓ Inserted ${inserted}/${BATCH3.length}\r`);
  }
}

const { count: total } = await sb.from('flashcards').select('*', { count: 'exact', head: true });
console.log(`\n\n✅ Batch 3 done! ${inserted} inserted, ${failed} failed.`);
console.log(`📊 TOTAL flashcards in database: ${total}`);

// Final breakdown
const { data: all } = await sb.from('flashcards').select('topic_id').limit(10000);
const topicCounts = {};
for (const fc of (all || [])) {
  topicCounts[fc.topic_id] = (topicCounts[fc.topic_id] || 0) + 1;
}
console.log('\n📋 Flashcards per topic (final):');
const topicNames = {
  '90ba4b46-caf1-41bc-9039-1cfbc2e0baf1': 'PRO Grammar',
  '1cd5d867-5041-4810-bad0-a911323ced1f': 'PRO Vocabulary',
  '0e22fcfd-195f-475c-8df5-5584e229cbee': 'PRO Paragraph Org',
  '5d338572-e1e8-4792-a5e3-017309c9e6b7': 'PRO Reading Comp',
  'e35bd4ee-073a-491b-b7b1-69dd7811e50b': 'PRO Verbal Comprehension',
  'c2808ba1-5ba9-449c-afbf-a4dbd1d248dd': 'PRO Filipino Vocab',
  'd3b160b3-f0e1-4fd4-a9d8-c8dcbc401c79': 'PRO Filipino Grammar',
  '43399734-967c-444c-b583-b68fdff2de1c': 'PRO Filipino Reading',
  '867c0551-9aa4-4dad-a4fc-bc8d8d6eada4': 'PRO Filipino Paragraph',
  '93402385-8ef0-4369-ba42-5883dcd52fbf': 'PRO Word Association',
  '2c63e431-c2d8-4c52-9ed3-8155216bdb23': 'PRO Assumptions',
  '42afbfbc-eb26-4470-8482-3139e2a888aa': 'PRO Logic',
  'df65e506-4990-4575-b4c0-bade603612a8': 'PRO Data Interpretation',
  'fee58356-630c-416c-8c5c-3dbfaeb28804': 'PRO Basic Operations',
  '05987dfb-0f8e-4f74-a026-846b26347bcb': 'PRO Number Series',
  '097e3e89-db17-4f8f-ab8f-c816e9a11c80': 'PRO Word Problems',
  '66b572bd-cfb1-469e-84e2-bb73d33b2309': 'PRO Constitution',
  '9a1e25cb-c571-4785-b46b-04255a88261f': 'PRO RA 6713',
  '1c356aaa-aaad-4815-ba83-cddce482201e': 'PRO Peace/Human Rights',
  'a22c09fe-a0a0-4c97-ad90-c2944de0dc2e': 'PRO Environment',
  'd5388143-2857-4f97-bb76-8dd02f42a982': 'SUB Grammar',
  'd32d7e74-2958-4e1e-9049-2901156a0a06': 'SUB Vocabulary',
  '4e85b207-50d3-4e8b-8675-f3a56db77370': 'SUB Reading Comp',
  '539b1777-4f5d-40a8-8a04-703038f1653a': 'SUB Paragraph Org',
  'e4856eb1-2eaf-45e7-92b3-85953623a847': 'SUB Filipino Vocab',
  'd6e97a36-5e2f-4a98-a363-abefdcf7ab62': 'SUB Filipino Grammar',
  '679fffb1-c0ca-46e8-93e2-f0c35874b960': 'SUB Filipino Reading',
  '9b226eb5-beb6-41ac-b92e-b666294126a3': 'SUB Filipino Paragraph',
  '388e380d-69cb-4d91-b071-e7fde8c44e47': 'SUB Word Problems',
  '8ba47590-7a27-4576-a849-60baf7826152': 'SUB Basic Operations',
  'dec5d971-da1e-40cf-b359-d533e4160b02': 'SUB Number Series',
  'deb97a8a-da6a-4175-af1d-4b4d3eb937f8': 'SUB Philippine Gov.',
  'bc89d6de-05dd-43ec-9ec4-9a84229e6298': 'SUB Laws & Ethics',
  '38ae46c3-4cdd-4a65-8a11-3aaf01921f57': 'SUB Filing & Coding',
  '55bc7cff-808b-48b7-97cb-1cb93ca1e5ee': 'SUB Spelling',
};
let grandTotal = 0;
for (const [id, cnt] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${(topicNames[id] || id.slice(0,8)).padEnd(32)}: ${cnt}`);
  grandTotal += cnt;
}
console.log(`\n  GRAND TOTAL: ${grandTotal} flashcards`);
