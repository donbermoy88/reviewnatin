/**
 * Batch E: English Grammar (5 Pro + 10 Sub), Vocabulary (15 Pro + 5 Sub),
 * Reading Comp (13 Pro + 7 Sub), Verbal Comprehension (5 Pro)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase','utf8')
    .split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>[l.split('=')[0].trim(),l.slice(l.indexOf('=')+1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const T = {
  PRO_grammar:   '90ba4b46-caf1-41bc-9039-1cfbc2e0baf1',
  SUB_grammar:   'd5388143-2857-4f97-bb76-8dd02f42a982',
  PRO_vocab:     '1cd5d867-5041-4810-bad0-a911323ced1f',
  SUB_vocab:     'd32d7e74-2958-4e1e-9049-2901156a0a06',
  PRO_reading:   '5d338572-e1e8-4792-a5e3-017309c9e6b7',
  SUB_reading:   '4e85b207-50d3-4e8b-8675-f3a56db77370',
  PRO_verbal:    'e35bd4ee-073a-491b-b7b1-69dd7811e50b',
};
const f = (t, fr, bk) => ({ topic_id:t, front:fr, back:bk, is_premium:false });

// ── ENGLISH GRAMMAR (5 Pro, 10 Sub) ────────────────────────────────────────────
const grammar = [
  f(T.PRO_grammar,'What is the correct use of "rise" vs. "raise"?',
    '"RISE" (intransitive — no object): to move upward on its own. Rise/rose/risen.\n"The sun RISES in the east." "Prices ROSE last year."\n\n"RAISE" (transitive — needs an object): to lift or increase something. Raise/raised/raised.\n"Please RAISE your hand." "The company RAISED salaries."\n\nMemory: Rise = self-movement. Raise = you move something else.'),
  f(T.PRO_grammar,'What is the correct sentence?\nA. "I should of gone earlier."\nB. "I should have gone earlier."',
    'B. "I should HAVE gone earlier."\n\n"Should of" is a common spoken error based on the contraction "should\'ve" (should have) which sounds like "should of." The correct modal perfect is always: should/would/could/might + HAVE + past participle.\n\nNEVER: should of, would of, could of, might of.\nALWAYS: should have, would have, could have, might have.'),
  f(T.PRO_grammar,'What is the rule for capitalization in writing?',
    'Capitalize: (1) First word of a sentence; (2) Proper nouns (names of people, places, organizations); (3) Official titles when used before a name ("President Marcos" but "the president signed"); (4) Titles of works (Noli Me Tangere); (5) First word of direct quotations; (6) Months, days, holidays (July, Monday, Christmas).\n\nDo NOT capitalize: common nouns (government, school), seasons (summer, winter), directions unless part of a name (south vs. South Korea).'),
  f(T.PRO_grammar,'Correct usage: Apostrophe rules for possessives',
    "SINGULAR POSSESSIVE: add 's regardless of ending.\n\"The student's paper\" / \"James's book\" / \"the boss's decision\"\n\nPLURAL POSSESSIVE (ending in s): add ' only.\n\"The students' papers\" / \"the teachers' lounge\"\n\nPLURAL POSSESSIVE (NOT ending in s): add 's.\n\"The children's playground\" / \"the men's room\"\n\nIT'S ≠ ITS: it's = it is; its = possessive of it (no apostrophe)."),
  f(T.PRO_grammar,'What is the correct verb tense in: "By next year, she ___ with the company for 10 years."',
    '"By next year, she WILL HAVE BEEN with the company for 10 years."\n\nFUTURE PERFECT tense: will + have + past participle. Used when an action will be completed by a specific point in the future.\n\nFormula: will + have + past participle (+ by/before/when + future time reference)\nMore examples: "By 2030, renewable energy will have replaced most fossil fuels."'),
  // Sub grammar
  f(T.SUB_grammar,'What are the 8 parts of speech in English?',
    '1. NOUN — names a person, place, thing, or idea (teacher, Manila, book)\n2. PRONOUN — replaces a noun (he, she, it, they, who)\n3. VERB — shows action or state (run, is, seem)\n4. ADJECTIVE — describes a noun (beautiful, many, red)\n5. ADVERB — modifies verb, adjective, or another adverb (quickly, very, never)\n6. PREPOSITION — shows relationship (in, on, at, for, by)\n7. CONJUNCTION — connects words or clauses (and, but, because, although)\n8. INTERJECTION — expresses emotion (Oh!, Wow!, Alas!)'),
  f(T.SUB_grammar,'Which verb is correct: "Each of the students ___ a book."\nA. have  B. has',
    'B. HAS\n"Each" is a singular indefinite pronoun — it ALWAYS takes a singular verb.\n"Each of the students HAS a book." (not "have")\n\nOther always-singular indefinite pronouns: everyone, everyone, no one, nobody, anyone, someone, everything, something, nothing.'),
  f(T.SUB_grammar,'Correct the error: "She don\'t know the answer."',
    '"She DOESN\'T know the answer."\n\nFor third-person singular subjects (he, she, it, Juan, the teacher), use DOESN\'T (not don\'t) in negative sentences.\nI don\'t → you don\'t → he/she/it DOESN\'T → we don\'t → they don\'t.\n\nAlso: "He don\'t like it" → "He DOESN\'T like it."'),
  f(T.SUB_grammar,'What are irregular verbs? Give 10 common examples.',
    'Irregular verbs do NOT follow the regular -ed pattern for past tense.\nKey examples:\n• go → went → gone\n• see → saw → seen\n• come → came → come\n• eat → ate → eaten\n• write → wrote → written\n• take → took → taken\n• give → gave → given\n• know → knew → known\n• run → ran → run\n• begin → began → begun'),
  f(T.SUB_grammar,'Correct the error: "He is more taller than his brother."',
    '"He is TALLER than his brother."\n\nNever use "more" with one-syllable comparatives (-er form) or with adjectives that already have the comparative form.\n"More taller" is DOUBLE COMPARATIVE — a grammar error.\n\nRule: Use EITHER -er OR "more" (not both).\n✓ taller, bigger, smarter\n✓ more beautiful, more expensive\n✗ more taller, more bigger'),
  f(T.SUB_grammar,'What is subject-verb agreement? Give the basic rule.',
    'SUBJECT-VERB AGREEMENT: The verb must match the subject in number (singular or plural).\n\nSINGULAR subjects → singular verbs (often end in -s in present tense)\n"She WORKS at the office."\n\nPLURAL subjects → plural verbs (no -s)\n"They WORK at the office."\n\nTrick: In present tense, the noun gets NO -s when the verb gets -s. "The teacher TEACHES." (teacher = singular noun; teaches = singular verb)'),
  f(T.SUB_grammar,'What is a pronoun and when should "I" vs. "me" be used?',
    'SUBJECT PRONOUNS (used as subject of verb): I, you, he, she, it, we, they\n"I went to the store."\n\nOBJECT PRONOUNS (used as object of verb or preposition): me, you, him, her, it, us, them\n"She gave the book to ME." / "Between you and ME."\n\nTest: Remove the other person. "You and I went" → "I went" ✓. "Give to you and I" → "Give to I" ✗ → use "me."'),
  f(T.SUB_grammar,'What is the difference between "do" and "does"?',
    'USE "DOES" with singular third-person subjects: he, she, it, Juan, the teacher.\n"She DOES her homework daily." / "The committee DOES meet regularly."\n\nUSE "DO" with I, you, we, they, and all plural subjects.\n"They DO their best." / "I DO not agree."\n\nFor questions: "DOES she study?" "DO they know?"'),
  f(T.SUB_grammar,'What are common comma usage rules?',
    '1. BEFORE COORDINATING CONJUNCTIONS joining two independent clauses: "I studied, and I passed."\n2. AFTER INTRODUCTORY ELEMENTS: "Because she was ill, she stayed home."\n3. BETWEEN ITEMS IN A SERIES: "She bought pens, paper, and notebooks."\n4. BEFORE/AFTER NONESSENTIAL CLAUSES: "My teacher, who is kind, helped me."\n5. BETWEEN COORDINATE ADJECTIVES: "a long, difficult exam."\n\nDo NOT use a comma between subject and verb.'),
  f(T.SUB_grammar,'What is an adjective? Give examples of how adjectives are used.',
    'An ADJECTIVE describes or modifies a noun or pronoun, answering: What kind? How many? Which one?\n\nTypes: descriptive (beautiful, kind), quantity (many, few, several), demonstrative (this, that, these), interrogative (which, what)\n\nPositions:\n• Before noun: "a TALL building"\n• After linking verb (predicate adjective): "The building IS TALL."\n\nComparative: taller; Superlative: tallest.'),
  f(T.SUB_grammar,'What are the most common errors with verb tense?',
    'Common tense errors:\n1. TENSE SHIFT: "She entered the room and sees him." → Should be consistent: "...and SAW him."\n2. WRONG PERFECT: "She have finished." → "She HAS finished."\n3. DOUBLE PAST: "She didn\'t went." → "She didn\'t GO." (After did/didn\'t, use BASE form.)\n4. -ED WITH PAST AFTER "DID": "Did she studied?" → "Did she STUDY?"\n5. WOULD + BASE: "She would went" → "She WOULD GO."'),
];

// ── VOCABULARY (15 Pro, 5 Sub) ────────────────────────────────────────────────
const vocab = [
  f(T.PRO_vocab,'JUDICIOUS (adjective)',
    'Meaning: Having or showing good judgment; sensible and wise.\nSynonyms: wise, prudent, sensible, sound, discerning\nAntonyms: foolish, imprudent, unwise, rash\nExample: "A judicious use of public funds is essential in government service."'),
  f(T.PRO_vocab,'DILIGENCE (noun)',
    'Meaning: Careful and persistent work or effort; steady application.\nSynonyms: hard work, industriousness, perseverance, dedication, assiduity\nAntonyms: laziness, negligence, sloth, idleness\nExample: "His diligence in reviewing every document earned him a promotion."'),
  f(T.PRO_vocab,'CIRCUMSPECT (adjective)',
    'Meaning: Wary and unwilling to take risks; cautious and prudent.\nSynonyms: cautious, careful, prudent, wary, guarded\nAntonyms: reckless, careless, rash, impulsive\nExample: "A circumspect official considers all consequences before making decisions."'),
  f(T.PRO_vocab,'ACQUIESCE (verb)',
    'Meaning: To accept or comply without protest; to agree reluctantly.\nSynonyms: agree, comply, consent, concede, submit\nAntonyms: resist, oppose, refuse, protest, dissent\nExample: "After much debate, the committee acquiesced to the proposed changes."'),
  f(T.PRO_vocab,'EBULLIENT (adjective)',
    'Meaning: Cheerful and full of energy; exuberant.\nSynonyms: exuberant, buoyant, enthusiastic, cheerful, vivacious\nAntonyms: gloomy, somber, subdued, depressed, lethargic\nExample: "Her ebullient personality made the orientation session lively and engaging."'),
  f(T.PRO_vocab,'IMPETUOUS (adjective)',
    'Meaning: Acting or done quickly without thought; impulsive.\nSynonyms: impulsive, rash, hasty, reckless, spontaneous\nAntonyms: careful, deliberate, cautious, restrained, measured\nExample: "His impetuous decision to resign without a plan left him in financial difficulty."'),
  f(T.PRO_vocab,'ENUMERATE (verb)',
    'Meaning: To mention a number of things one by one; to list.\nSynonyms: list, itemize, name, specify, detail, catalog\nAntonyms: — (no common antonym)\nExample: "The section chief was asked to enumerate the requirements for the application."'),
  f(T.PRO_vocab,'VACILLATE (verb)',
    'Meaning: To be unable to decide between opinions or courses of action; to waver.\nSynonyms: waver, hesitate, fluctuate, dither, be indecisive\nAntonyms: decide, commit, resolve, be steadfast\nExample: "The new official vacillated between two policy options, delaying the project."'),
  f(T.PRO_vocab,'ANACHRONISM (noun)',
    'Meaning: Something out of its proper time; a thing or person that belongs to an earlier period.\nSynonyms: archaism, relic, throwback, outmoded practice\nAntonyms: modern innovation, contemporary development\nExample: "Using typewriters in a digital office is an anachronism."'),
  f(T.PRO_vocab,'CONSPICUOUS (adjective)',
    'Meaning: Standing out so as to be clearly visible; attracting notice.\nSynonyms: obvious, noticeable, prominent, striking, apparent\nAntonyms: inconspicuous, hidden, invisible, unnoticeable\nExample: "His conspicuous absence at the meeting raised questions about his commitment."'),
  f(T.PRO_vocab,'DISINGENUOUS (adjective)',
    'Meaning: Not candid or sincere; feigning innocence or ignorance.\nSynonyms: insincere, deceptive, misleading, not candid, sly\nAntonyms: sincere, candid, honest, genuine, forthright\nExample: "His disingenuous claim that he didn\'t know about the irregularities was unconvincing."'),
  f(T.PRO_vocab,'CONSCIENTIOUS (adjective)',
    'Meaning: Wishing to do what is right; showing care and precision in one\'s work.\nSynonyms: careful, meticulous, painstaking, diligent, thorough\nAntonyms: careless, negligent, sloppy, irresponsible\nExample: "The conscientious civil servant double-checks every document for accuracy."'),
  f(T.PRO_vocab,'CORROBORATE (verb)',
    'Meaning: To confirm or support a statement, theory, or finding.\nSynonyms: confirm, verify, support, validate, substantiate\nAntonyms: contradict, undermine, refute, disprove\nExample: "The witness\'s testimony corroborated the documentary evidence presented in court."'),
  f(T.PRO_vocab,'MITIGATE (verb)',
    'Meaning: To make less severe, serious, or painful; to lessen.\nSynonyms: lessen, reduce, alleviate, ease, diminish\nAntonyms: exacerbate, worsen, intensify, aggravate\nExample: "The government\'s emergency relief program helped mitigate the effects of the typhoon."'),
  f(T.PRO_vocab,'PERSPICACIOUS (adjective)',
    'Meaning: Having a ready insight; shrewdly perceptive.\nSynonyms: perceptive, insightful, astute, shrewd, discerning\nAntonyms: oblivious, unobservant, obtuse, slow-witted\nExample: "The perspicacious auditor detected the discrepancy after reviewing the figures only once."'),
  // Sub vocab
  f(T.SUB_vocab,'INITIATIVE (noun)',
    'Meaning: The ability to assess a situation and take action without being told; taking the first step.\nSynonyms: enterprise, drive, ambition, self-starting ability\nAntonyms: passivity, apathy, inaction\nExample: "The new employee showed great initiative by proposing improvements before being asked."'),
  f(T.SUB_vocab,'PROMPT (adjective/verb)',
    'Adjective meaning: Done quickly; without delay. "A prompt response is expected."\nVerb meaning: To cause or encourage action. "His question prompted her to think more carefully."\nSynonyms (adj): quick, immediate, timely, punctual\nAntonyms: slow, delayed, tardy, late'),
  f(T.SUB_vocab,'OBJECTIVE (adjective/noun)',
    'Adjective: Not influenced by personal feelings; unbiased. "Be objective in evaluating the reports."\nNoun: A goal or aim. "Our objective is to improve service delivery."\nSynonyms (adj): impartial, unbiased, neutral, fair\nAntonyms: subjective, biased, partial, one-sided'),
  f(T.SUB_vocab,'VERIFY (verb)',
    'Meaning: To confirm the truth or accuracy of something.\nSynonyms: confirm, check, validate, authenticate, substantiate\nAntonyms: disprove, invalidate, refute\nExample: "Please verify your personal information before submitting the application."'),
  f(T.SUB_vocab,'SUBSTANTIAL (adjective)',
    'Meaning: Of considerable importance, size, or worth; significant.\nSynonyms: significant, considerable, large, major, sizable\nAntonyms: negligible, minor, insignificant, small, trivial\nExample: "The audit revealed a substantial discrepancy in the agency\'s budget records."'),
];

// ── READING COMPREHENSION (13 Pro, 7 Sub) ──────────────────────────────────────
const reading = [
  f(T.PRO_reading,'What is the difference between explicit and implicit meaning?',
    'EXPLICIT meaning: directly stated in the text; you don\'t need to interpret.\n"The exam score was 90%." (explicit — directly stated)\n\nIMPLICIT meaning: suggested or hinted but not directly stated; requires reading between the lines.\n"She stared at the blank exam paper, then slowly set down her pen." (implies she couldn\'t answer — implied, not stated)\n\nCSE reading comp often asks both: "What does the text say?" (explicit) and "What does it imply?" (implicit)'),
  f(T.PRO_reading,'What is the "author\'s purpose" and how do you identify it?',
    'AUTHOR\'S PURPOSE = the main reason for writing the text.\nCommon purposes: (1) TO INFORM: news articles, reports (facts, data, neutral tone); (2) TO PERSUADE: opinion pieces, arguments (one-sided, calls to action); (3) TO ENTERTAIN: stories, humor (narrative, engaging); (4) TO EXPLAIN: instructions, how-to (sequential, step-by-step).\n\nTo identify: (1) Notice the tone; (2) Check if the text argues a point or presents facts neutrally; (3) Consider the type of text.'),
  f(T.PRO_reading,'What is "connotation" vs. "denotation"?',
    'DENOTATION: The literal/dictionary meaning of a word.\n"Home" = a place where one lives.\n\nCONNOTATION: The emotional/cultural associations of a word.\n"Home" connotes warmth, safety, family, belonging (positive).\n\nWhy it matters for CSE: Authors choose words with specific connotations to create a desired effect. "Slender" (positive) vs. "skinny" (negative) have the same denotation but different connotations.'),
  f(T.PRO_reading,'What is the "central theme" of a passage?',
    'The CENTRAL THEME is the universal idea, message, or lesson that the author communicates throughout the entire text — broader than the main idea.\n\nMain idea: "The passage discusses the importance of education for women in the Philippines."\nTheme: "Equality of opportunity empowers communities." (universal, abstract)\n\nFor literary texts: themes are often abstract (justice, courage, sacrifice). Identify by asking: "What does the author want us to understand about life/humanity?"'),
  f(T.PRO_reading,'What is "point of view" in a passage?',
    'POINT OF VIEW indicates the perspective from which the text is written:\n\n1. FIRST PERSON: "I" or "we" — author/narrator is a participant. Subjective, personal.\n2. SECOND PERSON: "you" — directly addresses the reader. Common in instructions.\n3. THIRD PERSON LIMITED: "he/she/they" — narrator knows only one character\'s thoughts. Objective about others.\n4. THIRD PERSON OMNISCIENT: all-knowing narrator can access all characters\' thoughts.\n\nFor informational texts: "first person" = author\'s direct experience; "third person" = more objective reporting.'),
  f(T.PRO_reading,'How do you find the meaning of an underlined word from context?',
    'CONTEXT CLUE STRATEGY:\n1. Read the sentence and the sentences before and after.\n2. Look for: (a) SYNONYMS nearby — same meaning words; (b) ANTONYMS + contrast signals; (c) DEFINITIONS — "X, which means..."; (d) EXAMPLES — "such as, including."\n3. Substitute each answer choice; choose the one that makes sense in context.\n4. Don\'t rely on the word\'s common meaning — context may use it differently.\n\nKey: The correct meaning must fit the SPECIFIC context, not just any definition.'),
  f(T.PRO_reading,'What does "drawing a conclusion" mean in reading comprehension?',
    'DRAWING A CONCLUSION: Reaching a new understanding based on information from the text — like a logical inference.\n\nRequirements for a valid conclusion:\n1. Must be SUPPORTED by the text\n2. Must NOT contradict any information in the text\n3. Must NOT require information from OUTSIDE the text\n4. Must be more than just a restatement of what\'s in the text\n\nStrategy: Find evidence → apply logic → reach the conclusion. If the conclusion requires assumptions → likely wrong answer.'),
  f(T.PRO_reading,'How do you identify a "supporting detail" vs. a "main idea" in a question?',
    'MAIN IDEA question: "What is the passage/paragraph mainly about?"\nAnswer: The broad, central message that ALL details support.\n\nSUPPORTING DETAIL question: "According to the passage, what is the reason for X?"\nAnswer: A specific piece of information found directly in the text.\n\nTest: If the answer only covers ONE part of the passage → it\'s a detail. If it covers ALL or MOST of the passage → it\'s the main idea.\n\nCommon error: Choosing a major detail as the main idea.'),
  f(T.PRO_reading,'What is a "generalization" in reading comprehension?',
    'GENERALIZATION: A broad statement about a group based on examples given.\n\nValid generalization: supported by sufficient evidence in the text.\n"Most students who attend review programs score higher." (if text shows data supporting this)\n\nInvalid (hasty) generalization: conclusion based on too few examples.\n"All government offices are inefficient" based on one department\'s performance.\n\nCSE tip: Choose generalizations that are QUALIFIED ("many," "most," "usually") rather than absolute ("all," "always," "never") unless the text clearly supports the absolute.'),
  f(T.PRO_reading,'What are "signal words" for different text structures?',
    'CAUSE-EFFECT: because, therefore, as a result, consequently, due to, led to\nCOMPARE-CONTRAST: however, similarly, on the other hand, in contrast, likewise, whereas\nSEQUENCE: first, next, then, finally, afterward, subsequently, following this\nPROBLEM-SOLUTION: the problem is, one solution, to resolve, this can be addressed\nDESCRIPTION: consists of, is characterized by, includes, appears to be\nOPINION: in my view, I believe, it seems that, perhaps, likely, should'),
  f(T.PRO_reading,'How do you answer "What can be inferred from the passage?"',
    'Inference = reading between the lines.\n\nProcess:\n1. Identify what IS stated in the passage.\n2. Look for what is SUGGESTED but not stated.\n3. The inference must be: (a) consistent with passage facts; (b) a logical extension; (c) NOT something explicitly stated (that\'s not an inference).\n\nTest each choice: "Does the passage PROVE this?" If yes → not an inference. "Does the passage SUGGEST this without stating it?" If yes → likely the inference.\n\nEliminate: choices that contradict the passage or require outside knowledge.'),
  f(T.PRO_reading,'What is the difference between a biased and an objective passage?',
    'OBJECTIVE passage: presents facts without personal judgment; balanced view; uses neutral language; may include multiple perspectives.\nSignal words: "According to data...", "Research shows...", "Statistics indicate..."\n\nBIASED passage: presents a one-sided view; uses emotionally charged language; omits contradicting evidence; makes absolute claims.\nSignal words: "Clearly...," "Obviously...," "Anyone can see...," one-sided examples only.\n\nCSE tip: Identify whether the author uses FACTUAL, NEUTRAL language or PERSUASIVE, EMOTIONAL language.'),
  f(T.PRO_reading,'What is the purpose of a "rhetorical question" in a passage?',
    'A RHETORICAL QUESTION is a question that the author does NOT expect a literal answer to — it\'s used for EFFECT.\n\nPurposes: (1) To emphasize a point; (2) To provoke thought in the reader; (3) To make a statement more persuasively.\n\nExample: "Who among us would allow our children to grow up in poverty?" (Not asking who — implying NO ONE should.)\n\nIn CSE: Recognize rhetorical questions as persuasion devices, not actual inquiries.'),
  // Sub reading
  f(T.SUB_reading,'What is the main idea and how is it different from a detail?',
    'MAIN IDEA: The central message of the entire passage — broad enough to cover all details.\n"Exercise has many physical benefits."\n\nDETAIL: A specific piece of information supporting the main idea.\n"Exercise reduces the risk of heart disease by 30%."\n\nTest: If the answer only covers ONE part → detail. If it covers EVERYTHING → main idea.'),
  f(T.SUB_reading,'What are context clues and how do you use them?',
    'CONTEXT CLUES help determine the meaning of an unfamiliar word from surrounding text.\n\nTypes:\n1. SYNONYM: "The problem was complex, or difficult, to solve."\n2. ANTONYM: "Unlike his shy brother, Pedro was gregarious."\n3. DEFINITION: "The agency, which is an office that provides specific services, opened."\n\nStrategy: Read the sentence carefully; use surrounding words to guess the meaning.'),
  f(T.SUB_reading,'What does "according to the passage" signal in a question?',
    '"ACCORDING TO THE PASSAGE" means the answer must be DIRECTLY STATED in the passage.\n\nDo NOT: infer, assume, or use outside knowledge.\nDO: find the exact sentence in the passage that answers the question.\n\nStrategy: Search for keywords from the question in the passage. Read that section carefully. Choose the answer closest to what the passage explicitly states.'),
  f(T.SUB_reading,'How do you find the meaning of a word "as used in the passage"?',
    '"As used in the passage" = do NOT use just the dictionary definition. Use CONTEXT.\n\nSteps:\n1. Find the word in the passage.\n2. Read the full sentence and surrounding sentences.\n3. Substitute each answer choice.\n4. Choose the one that makes the most sense IN THAT CONTEXT.\n\nNote: A word may have multiple meanings. Only the meaning that fits the context is correct.'),
  f(T.SUB_reading,'What is an inference? How is it different from what is directly stated?',
    'INFERENCE: A conclusion that is SUGGESTED by the passage but NOT directly stated.\n\nDIRECTLY STATED: "The office opens at 8:00 AM."\nINFERENCE: The passage says "employees arrived before sunrise to prepare." → We infer work started very early.\n\nTest: Can you find the EXACT WORDS in the passage? If yes → directly stated, not an inference. If no, but it logically follows → inference.'),
  f(T.SUB_reading,'What is the author\'s purpose and what are the three main purposes?',
    'AUTHOR\'S PURPOSE = why the author wrote the text.\n\n1. TO INFORM: share facts, data, information (news, reports, textbooks)\n2. TO PERSUADE: convince the reader to agree with a position (opinion essays, arguments)\n3. TO ENTERTAIN: engage the reader (stories, humor, personal narratives)\n\nClue: "Inform" texts are factual and neutral. "Persuade" texts argue one side. "Entertain" texts are engaging and narrative.'),
  f(T.SUB_reading,'What is a "conclusion" in reading comprehension?',
    'A CONCLUSION in reading comprehension is a decision or judgment you reach based on the information in the passage. It must be:\n1. SUPPORTED by facts in the passage\n2. NOT contradicting anything in the passage\n3. NOT going too far beyond what the passage states\n\nPoor conclusion: requires information not in the passage.\nStrong conclusion: logically follows from what is stated.\n\nAsk: "Does the passage PROVE this?" If mostly yes → valid conclusion.'),
];

// ── VERBAL COMPREHENSION (5 Pro) ──────────────────────────────────────────────
const verbal = [
  f(T.PRO_verbal,'What is alliteration and how is it used in literature?',
    'ALLITERATION: The repetition of the same initial consonant sound in consecutive or closely connected words.\nExamples: "Peter Piper picked a peck." / "The fair breeze blew, the white foam flew." (Coleridge)\n\nEffect: Creates rhythm, emphasis, musicality, and makes text more memorable.\nCommonly used in: poetry, song lyrics, catchy phrases, advertising slogans.\nCSE reading comp: May be asked to identify or explain the effect of alliteration.'),
  f(T.PRO_verbal,'What is onomatopoeia and give examples?',
    'ONOMATOPOEIA: Words that phonetically imitate the sounds they describe.\nExamples: buzz, hiss, crash, bang, sizzle, murmur, clink, roar, rustle, drip, cuckoo.\n\nIn Filipino: alingawngaw, hagulgol, tiktik, kalabog, lagaslas.\n\nEffect: Creates vivid sensory experience; makes descriptions more immediate and lifelike. Often used in children\'s literature and poetry to engage readers through sound.'),
  f(T.PRO_verbal,'What is irony and what are its three main types?',
    '1. VERBAL IRONY: Saying the opposite of what you mean, often sarcastically. "Oh great, another power outage!" (said angrily)\n2. SITUATIONAL IRONY: When the outcome is the opposite of what\'s expected. A fire station burns down.\n3. DRAMATIC IRONY: When the audience knows something the character doesn\'t. The reader knows the letter is a lie, but the character trusts it.\n\nCSE tip: Distinguish irony from coincidence (coincidence has no element of contradiction or expectation).'),
  f(T.PRO_verbal,'What is a euphemism and when is it used?',
    'EUPHEMISM: A milder or more pleasant word/phrase used instead of one that might be too harsh or blunt.\n\nExamples: "passed away" (died), "let go" (fired), "senior citizen" (old person), "collateral damage" (civilian casualties), "downsizing" (layoffs).\n\nWhy used: (1) To be polite/sensitive; (2) To soften bad news; (3) In diplomacy and politics; (4) Sometimes to obscure the truth.\n\nCSE: Identify the actual meaning behind the euphemism.'),
  f(T.PRO_verbal,'What is an allusion and how does it enrich writing?',
    'ALLUSION: A brief, indirect reference to a person, place, event, or piece of literature that the reader is expected to recognize without explanation.\n\nExamples: "He faced a Herculean task." (reference to Hercules and his labors — implies enormously difficult) / "She was the Delilah of our team." (reference to the biblical Delilah who betrayed Samson)\n\nEffect: Adds depth, creates connections, and allows writers to convey complex ideas briefly. Effective only when the audience recognizes the reference.'),
];

const allCards = [...grammar, ...vocab, ...reading, ...verbal];
console.log(`\nBatch E: ${allCards.length} total cards`);

const byTopic = {};
for (const card of allCards) {
  if (!byTopic[card.topic_id]) byTopic[card.topic_id] = [];
  byTopic[card.topic_id].push(card);
}

let totalInserted = 0, totalSkipped = 0;
for (const [topicId, cards] of Object.entries(byTopic)) {
  const { data: ex } = await sb.from('flashcards').select('front').eq('topic_id', topicId).limit(2000);
  const existing = new Set((ex||[]).map(r => r.front));
  const newCards = cards.filter(c => !existing.has(c.front));
  const skipped = cards.length - newCards.length;
  if (newCards.length === 0) { console.log(`  Skip all (${skipped} dupes) for ${topicId.slice(0,8)}`); continue; }
  const { error } = await sb.from('flashcards').insert(newCards);
  if (error) { console.error(`  ERROR ${topicId.slice(0,8)}: ${error.message}`); continue; }
  totalInserted += newCards.length;
  totalSkipped += skipped;
  console.log(`  ✓ +${newCards.length} (skipped ${skipped}) → ${topicId.slice(0,8)}`);
}

const { count } = await sb.from('flashcards').select('*',{count:'exact',head:true});
console.log(`\n✅ Batch E done. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
console.log(`📊 Total flashcards: ${count}`);
