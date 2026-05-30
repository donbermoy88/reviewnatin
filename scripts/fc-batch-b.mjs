/**
 * Flashcard Batch B: Logic (27 new), Assumptions/Conclusions (22 new),
 * Data Interpretation (13 new), Word Association (6 new)
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
  PRO_logic:       '42afbfbc-eb26-4470-8482-3139e2a888aa',
  PRO_assumptions: '2c63e431-c2d8-4c52-9ed3-8155216bdb23',
  PRO_data_interp: 'df65e506-4990-4575-b4c0-bade603612a8',
  PRO_word_assoc:  '93402385-8ef0-4369-ba42-5883dcd52fbf',
};

async function getExistingFronts(topicId) {
  const { data } = await sb.from('flashcards').select('front').eq('topic_id', topicId).limit(2000);
  return new Set((data||[]).map(r => r.front));
}
const f = (t, fr, bk) => ({ topic_id:t, front:fr, back:bk, is_premium:false });

// ── LOGIC AND REASONING (27 new) ─────────────────────────────────────────────
const logic = [
  f(T.PRO_logic,'What is deductive reasoning?',
    'DEDUCTIVE reasoning moves from GENERAL premises to a SPECIFIC conclusion. If the premises are true AND the argument is valid, the conclusion MUST be true. Example: "All government employees must file a SALN. Ana is a government employee. → Ana must file a SALN." If any premise is false, the conclusion may be wrong even if the form is valid.'),
  f(T.PRO_logic,'What is inductive reasoning?',
    'INDUCTIVE reasoning moves from SPECIFIC observations to a GENERAL conclusion. The conclusion is PROBABLE but not certain. Example: "In the last 5 CSE exams, vocabulary questions appeared in Part I. → The next CSE will likely have vocabulary questions in Part I." Inductive conclusions can be strengthened by more evidence but can never be proven with certainty.'),
  f(T.PRO_logic,'What is a syllogism? Identify the valid form.',
    'A SYLLOGISM has: Major Premise → Minor Premise → Conclusion.\nVALID form (Modus Ponens): All A are B. C is A. → C is B. ✓\nINVALID form (Undistributed Middle): All A are B. C is B. → C is A. ✗ (Wrong — not all B are A)\nINVALID form (Affirming Consequent): If P then Q. Q is true. → P is true. ✗'),
  f(T.PRO_logic,'If P → Q and Q → R, what can you conclude?',
    'By HYPOTHETICAL SYLLOGISM (chain reasoning): P → Q and Q → R gives us P → R.\nExample: "If Ana studies (P), she will pass (Q). If she passes (Q), she will get a government job (R). → If Ana studies (P), she will get a government job (R)."\nThis is called TRANSITIVE PROPERTY of conditional statements.'),
  f(T.PRO_logic,'What is the CONTRAPOSITIVE of "If P then Q"?',
    'The CONTRAPOSITIVE of "If P then Q" is "If NOT Q then NOT P." The contrapositive is LOGICALLY EQUIVALENT to the original — if the original is true, so is the contrapositive.\nExample: "If it rains (P), the ground gets wet (Q)." Contrapositive: "If the ground is NOT wet (¬Q), then it did NOT rain (¬P)." ✓\nDo NOT confuse with CONVERSE (If Q then P) or INVERSE (If ¬P then ¬Q) — these are NOT equivalent.'),
  f(T.PRO_logic,'What is Modus Tollens?',
    'MODUS TOLLENS: If P → Q, and Q is FALSE, then P is FALSE.\nForm: (1) If P then Q. (2) Not Q. → (3) Therefore, not P.\nExample: "If the exam passed, the applicant is hired. The applicant was NOT hired. → Therefore, the exam was NOT passed."\nThis is a VALID logical argument — the denial of the consequent leads to denial of the antecedent.'),
  f(T.PRO_logic,'What is the fallacy of Affirming the Consequent?',
    'AFFIRMING THE CONSEQUENT: If P → Q, and Q is true, you CANNOT conclude P is true — this is a FALLACY.\nForm: (1) If P then Q. (2) Q is true. → (3) Therefore, P is true. ✗ INVALID.\nExample: "If it is raining, the streets are wet. The streets are wet. → Therefore, it is raining." WRONG — streets could be wet for other reasons (street cleaning, flooding).'),
  f(T.PRO_logic,'What is the fallacy of Denying the Antecedent?',
    'DENYING THE ANTECEDENT: If P → Q, and P is false, you CANNOT conclude Q is false — this is a FALLACY.\nForm: (1) If P then Q. (2) P is false. → (3) Therefore, Q is false. ✗ INVALID.\nExample: "If Ana studies, she passes. Ana did NOT study. → Ana did NOT pass." WRONG — she might have passed even without studying.'),
  f(T.PRO_logic,'What is the Ad Hominem fallacy?',
    'AD HOMINEM ("against the person"): Attacking the PERSON making the argument rather than the argument itself.\nExample: "We should not follow Senator X\'s proposals on healthcare reform because he is corrupt." (The corruption issue is irrelevant to whether the proposal is medically sound.)\nForm of Ad Hominem to watch: "You cannot argue about poverty because you are rich."'),
  f(T.PRO_logic,'What is the Hasty Generalization fallacy?',
    'HASTY GENERALIZATION: Drawing a broad conclusion from too few or unrepresentative examples.\nExample: "I met two rude government employees; therefore, all government employees are rude."\nFlaw: Two people do not represent millions of government employees.\nCorrection: A valid generalization requires a sufficiently large and representative sample.'),
  f(T.PRO_logic,'What is the False Dichotomy (either-or) fallacy?',
    'FALSE DICHOTOMY: Presenting only two options when more exist, implying no middle ground.\nExample: "Either you support this budget cut, or you want the government to go bankrupt."\nFlaw: There may be other options — reducing other expenses, finding new revenue, partial cuts.\nIdentify: Look for "either...or," "you\'re with us or against us," "no choice but to..."'),
  f(T.PRO_logic,'What is Circular Reasoning (Begging the Question)?',
    'CIRCULAR REASONING: Using the conclusion as a premise, going in a circle.\nExample: "The government\'s policy is correct because the government says it is correct, and the government doesn\'t lie."\nFlaw: The premise assumes what needs to be proved.\nAlso called: Petitio Principii or Begging the Question.'),
  f(T.PRO_logic,'What is Slippery Slope fallacy?',
    'SLIPPERY SLOPE: Arguing that one event will inevitably lead to extreme consequences without evidence.\nExample: "If we allow online gaming, people will become addicted, crime will rise, families will break apart, and the country will collapse."\nFlaw: No evidence that each step necessarily follows. Many causal steps are assumed without support.\nNot all slippery slopes are fallacies — some causal chains are evidenced.'),
  f(T.PRO_logic,'What is a Venn Diagram used for in logic?',
    'Venn diagrams show relationships between sets visually with overlapping circles.\nAll A are B → circle A is INSIDE circle B.\nNo A are B → circles A and B do NOT overlap.\nSome A are B → circles A and B PARTIALLY overlap.\nUse Venn diagrams to test syllogism validity: draw the premises, see if the conclusion must be true.'),
  f(T.PRO_logic,'What is the logical operator AND (conjunction)?',
    'AND (conjunction, ∧): P AND Q is true ONLY when BOTH P and Q are true.\nTruth table: T∧T=T; T∧F=F; F∧T=F; F∧F=F.\nExample: "She passed AND she was hired" is true only if BOTH events occurred.\nIn CSE: "Statement 1 AND Statement 2 are both true" → conclusion must follow from both.'),
  f(T.PRO_logic,'What is the logical operator OR (disjunction)?',
    'OR (disjunction, ∨): P OR Q is true when AT LEAST ONE of P or Q is true.\nInclusive OR: T∨T=T; T∨F=T; F∨T=T; F∨F=F.\nExclusive OR (XOR): true only when exactly ONE is true (not both).\nExample (Inclusive): "Pass the written exam OR qualify via special exam" — both could apply.\nIn CSE reasoning, OR is typically inclusive unless stated otherwise.'),
  f(T.PRO_logic,'What is the logical operator NOT (negation)?',
    'NOT (negation, ¬): reverses the truth value. If P is true, ¬P is false. If P is false, ¬P is true.\nKey application: the CONTRAPOSITIVE uses double negation.\n"If P then Q" ↔ "If ¬Q then ¬P"\nNegation of "All A are B" → "Some A are NOT B" (not "No A are B")\nNegation of "Some A are B" → "No A are B"'),
  f(T.PRO_logic,'What is Reductio ad Absurdum in logic?',
    'REDUCTIO AD ABSURDUM: A method of proof that assumes the OPPOSITE of what you want to prove, then shows this leads to a contradiction or absurd result, thereby proving the original statement.\nExample: To prove "there are infinitely many prime numbers," assume there are finitely many, then show a contradiction arises.\nUsed in mathematics, law, and philosophy.'),
  f(T.PRO_logic,'What is analogical reasoning?',
    'ANALOGICAL REASONING: Drawing conclusions based on the similarity between two cases.\n"A is similar to B. B has property X. → A likely has property X."\nStrength depends on: how similar A and B really are, and whether the relevant similarities (not just superficial ones) are shared.\nExample: "This case is similar to a past Supreme Court case where a law was struck down. → This law will likely be struck down too."'),
  f(T.PRO_logic,'How do you evaluate the strength of an argument in CSE logical reasoning questions?',
    'An argument is STRONG (or valid) when: (1) premises are true; (2) conclusion follows logically from premises; (3) no fallacies are present.\nStrategies for CSE: (1) Identify conclusion; (2) identify premises; (3) check if conclusion must be true given premises; (4) check for common fallacies (ad hominem, hasty generalization, false dichotomy, circular reasoning); (5) eliminate choices that introduce unsupported claims.'),
  f(T.PRO_logic,'What is the difference between a valid argument and a sound argument?',
    'VALID: The argument\'s FORM is correct — IF the premises are true, the conclusion MUST be true. (Can be valid even with false premises.)\nSOUND: The argument is valid AND all premises are actually true.\nExample: "All cats can fly. Whiskers is a cat. → Whiskers can fly." This is VALID (correct form) but NOT SOUND (premise 1 is false).'),
  f(T.PRO_logic,'What is the difference between "necessary" and "sufficient" conditions?',
    'NECESSARY condition: A must exist for B to occur. Without A, B cannot happen. (A is required, but not enough.)\nSUFFICIENT condition: If A occurs, B definitely occurs. (A alone guarantees B.)\nExample: "Having a CSE rating" may be necessary (required) for some government jobs, but not sufficient (you also need other qualifications like residency, age, education).'),
  f(T.PRO_logic,'In logic, what is a tautology?',
    'A TAUTOLOGY is a statement that is ALWAYS TRUE regardless of the truth values of its component parts.\nExample: "Either it is raining, or it is not raining" (P ∨ ¬P) — always true.\nContrast with CONTRADICTION: a statement that is ALWAYS FALSE (P ∧ ¬P — P and not P simultaneously).\nIn CSE: tautologies provide no new information; contradictions mean an error in the argument.'),
  f(T.PRO_logic,'What is an argument vs. a statement?',
    'A STATEMENT (proposition) is a declarative sentence that is either TRUE or FALSE.\nExamples: "The CSE is held twice a year." ✓ / "Should you study?" ✗ (question, not a statement)\nAn ARGUMENT is a set of statements where one (the CONCLUSION) is claimed to follow from the others (the PREMISES).\nIn CSE analytical reasoning, you must distinguish premises from the conclusion.'),
  f(T.PRO_logic,'What is abductive reasoning?',
    'ABDUCTIVE REASONING: Inferring the MOST LIKELY explanation for an observation (inference to the best explanation).\nExample: "The file is missing from the cabinet. The only person with access is the supervisor. → The supervisor likely took the file."\nAbduction gives the BEST explanation, not a certain one. Used in: diagnosis, detective work, scientific hypothesis formation.'),
  f(T.PRO_logic,'What is the Straw Man fallacy?',
    'STRAW MAN: Misrepresenting someone\'s argument in a weaker or exaggerated form, then attacking the misrepresented version.\nExample: Person A says: "We should reduce defense spending." Person B responds: "Person A wants to leave the country defenseless."\nFlaw: Person B attacks a position that Person A never held.\nTo avoid: always address the ACTUAL argument, not an exaggerated version.'),
  f(T.PRO_logic,'What is Appeal to Authority fallacy?',
    'APPEAL TO AUTHORITY (Argumentum ad Verecundiam): Citing an authority\'s opinion as evidence when the authority is not expert in the relevant field, or when the claim contradicts established evidence.\nExample: "This vitamin supplement must work — a famous actor endorses it."\nFlaw: Actors are not medical authorities. However, citing a legitimate expert IS valid — the fallacy is citing a WRONG or IRRELEVANT authority.'),
];

// ── ASSUMPTIONS AND CONCLUSIONS (22 new) ──────────────────────────────────────
const assumptions = [
  f(T.PRO_assumptions,'What is an "assumption" in an argument?',
    'An ASSUMPTION is an UNSTATED PREMISE that the argument takes for granted. It is a hidden belief that must be true for the argument to hold. To find assumptions: identify the gap between the premise(s) and conclusion. Ask: "What must be true for the conclusion to follow?"\nExample argument: "Ana scored highest in the CSE. She will be hired." Assumption: "The highest scorer will be hired" — this is never stated.'),
  f(T.PRO_assumptions,'How do you identify the conclusion in an argument?',
    'The CONCLUSION is the main claim the argument is trying to establish. Signal words for conclusions: THEREFORE, THUS, HENCE, SO, CONSEQUENTLY, AS A RESULT, WHICH MEANS THAT, IT FOLLOWS THAT.\nStrategy: Find what follows "therefore" or what the premises are trying to prove. If no signal word: ask "What is the author trying to convince me of?"'),
  f(T.PRO_assumptions,'How do you identify the premise(s) in an argument?',
    'PREMISES are the reasons or evidence given to support the conclusion. Signal words: BECAUSE, SINCE, AS, FOR, GIVEN THAT, THE REASON IS THAT, IN VIEW OF THE FACT THAT.\nExample: "The budget must be cut [CONCLUSION] BECAUSE revenue has declined [PREMISE 1] AND government debt has risen [PREMISE 2]."\nTip: Premises come before or after the conclusion — use signal words to locate them.'),
  f(T.PRO_assumptions,'What makes a conclusion VALID (logically) versus merely SUPPORTED?',
    'A VALID conclusion follows NECESSARILY from the premises — it cannot be false if all premises are true (deductive).\nA SUPPORTED conclusion is probably true given the premises (inductive) — it is well-evidenced but not certain.\nIn CSE: "valid" conclusions follow logically without adding external information. "Supported" conclusions are reasonable inferences. "Unsupported" conclusions go beyond what the premises can justify.'),
  f(T.PRO_assumptions,'What is a "necessary assumption" vs. a "sufficient assumption"?',
    'NECESSARY assumption: the argument CANNOT work without it — if this assumption is false, the conclusion fails.\nSUFFICIENT assumption: if added to the argument, it ALONE would make the conclusion valid.\nFor CSE assumption questions: identify which statement the argument CANNOT do without (necessary). Test: negate the assumption — if negating it destroys the argument, it IS a necessary assumption.'),
  f(T.PRO_assumptions,'How to solve: "Which of the following is assumed in the argument?"',
    'PROCESS: (1) Read the argument and identify conclusion. (2) Check each answer choice. (3) For each choice, NEGATE it (assume it is false). (4) If negating choice X would make the conclusion fall apart → X is a NECESSARY ASSUMPTION. (5) Eliminate choices that are too broad, too specific, or that the argument doesn\'t need.\nTip: The assumption bridges the gap between the premise and the conclusion.'),
  f(T.PRO_assumptions,'What is an "irrelevant" conclusion (non sequitur)?',
    'A NON SEQUITUR ("it does not follow") is a conclusion that does NOT logically follow from the given premises — the conclusion is IRRELEVANT to the premises.\nExample: "Study hard for the exam. My sister passed the exam. → You should eat breakfast before exams."\nThe conclusion (eat breakfast) does not follow from the premises (study hard, sister passed).\nIn CSE: eliminate answer choices where the conclusion jumps to an unrelated topic.'),
  f(T.PRO_assumptions,'What is "overgeneralization" in conclusions?',
    'OVERGENERALIZATION: A conclusion that is BROADER than what the evidence supports — applying findings from a small sample to an entire population.\nExample Premise: "Three government offices in Metro Manila are inefficient." Overgeneralized Conclusion: "All Philippine government offices are inefficient."\nCorrect conclusion: "Some government offices in Metro Manila may be inefficient."\nCSE tip: Watch for absolute words (all, none, always, never) — they require strong evidence.'),
  f(T.PRO_assumptions,'What is the Assumption of Uniformity?',
    'Assumption of Uniformity: assuming that what is true in the past will hold in the future, or what is true in one place/group is true everywhere/everyone.\nExample: "Every CSE exam in the last 10 years had 30 analytical questions. → The next exam will have 30 analytical questions." The assumption is that the pattern will continue — this may or may not be true.'),
  f(T.PRO_assumptions,'What is a "weakener" of an argument?',
    'A WEAKENER is a statement that, if true, reduces the likelihood that the conclusion follows from the premises. It does NOT necessarily disprove the conclusion but makes it less convincing.\nExample: Argument: "Regular exercise leads to long life." Weakener: "Studies show that genetics plays a stronger role in longevity than lifestyle."\nCSE questions may ask: "Which WEAKENS the argument?" → find the choice that attacks a premise or introduces contradicting evidence.'),
  f(T.PRO_assumptions,'What is a "strengthener" of an argument?',
    'A STRENGTHENER is a statement that makes the conclusion more likely to follow from the premises. It fills gaps, provides additional support, or eliminates alternative explanations.\nExample: Argument: "Employee X took office funds." Strengthener: "Security footage shows Employee X accessing the safe at the time funds disappeared."\nCSE: "Which STRENGTHENS the argument?" → find the choice that supports the premise-conclusion link.'),
  f(T.PRO_assumptions,'What is a "conclusion" vs. an "inference" in reasoning questions?',
    'CONCLUSION: Specifically stated in or directly implied by the argument. The logical end-point of reasoning.\nINFERENCE: A new statement derived from the given information — may extend slightly beyond the explicit conclusion.\nIn CSE questions, a correct inference: (1) must be supported by the passage; (2) must not contradict any statement; (3) should not go far beyond what is stated.\nAvoid choices that "might" be true but aren\'t clearly supported.'),
  f(T.PRO_assumptions,'What is a "counter-example" in logical reasoning?',
    'A COUNTER-EXAMPLE is a specific case that contradicts a general claim, thereby disproving it.\nExample: Claim: "All government officials who accept bribes are prosecuted." Counter-example: "Official X accepted a bribe but was not prosecuted."\nOne valid counter-example is enough to disprove a universal statement. Counter-examples are powerful tools in deductive reasoning.'),
  f(T.PRO_assumptions,'What does "presupposes" mean in logical reasoning?',
    'To PRESUPPOSE is to assume something is true as a precondition of a statement. Similar to an assumption, but often embedded in the language itself.\nExample: "When did you stop being late to work?" PRESUPPOSES that you were late at some point. This is a "loaded question."\nIn arguments: unstated presuppositions are necessary assumptions that must be identified to understand the full logical structure.'),
  f(T.PRO_assumptions,'What is the "argument pattern" approach for CSE analytical questions?',
    'ARGUMENT PATTERN approach:\n(1) Find CONCLUSION (what the author claims)\n(2) Find PREMISE(S) (evidence given)\n(3) Identify the ASSUMPTION (the unstated bridge)\n(4) Check choices: (a) consistent with the argument? (b) necessary for the argument to hold?\nPractice: "Our city has low crime because we have many police officers." Assumption: "Having many police officers reduces crime" (never explicitly stated but necessary).'),
  f(T.PRO_assumptions,'How do you approach "Identify the flaw" reasoning questions?',
    'Steps: (1) Read the argument carefully. (2) Identify the conclusion and premises. (3) Look for logical gaps or invalid reasoning. (4) Match to common fallacy types: ad hominem, hasty generalization, circular reasoning, false dichotomy, slippery slope, appeal to authority. (5) Choose the answer that accurately describes the flaw — avoid vague choices like "the argument is wrong."'),
  f(T.PRO_assumptions,'What is "parallel reasoning" in logical reasoning questions?',
    'PARALLEL REASONING: Finding an argument that uses the SAME LOGICAL STRUCTURE as the original, even if the subject matter differs.\nExample original: "All employees must submit reports. Ana is an employee. → Ana must submit reports." (All A→B; C=A; ∴ C→B)\nParallel: "All citizens must vote. Pedro is a citizen. → Pedro must vote." Same structure ✓\nCSE tip: Focus on the STRUCTURE (form), not the content.'),
  f(T.PRO_assumptions,'What is "sufficient evidence" vs. "necessary evidence"?',
    'SUFFICIENT evidence: enough to prove the claim on its own. If this evidence exists, the claim is proven.\nNECESSARY evidence: must exist for the claim to possibly be true. Without it, the claim fails.\nExample (criminal case): A signed confession is SUFFICIENT evidence of guilt. Presence at the crime scene is NECESSARY (but not sufficient — the person could have witnessed, not committed, the crime).'),
  f(T.PRO_assumptions,'What does "it can be concluded that" signal in a question?',
    '"It can be concluded that" = the answer must be DIRECTLY SUPPORTED by the passage. It must be: (1) true given the stated information; (2) not requiring additional assumptions; (3) not going beyond the scope of the passage.\nContrast with "it is likely that" (inductive, probabilistic) and "it must be true" (necessarily true — strongest requirement).\nStrategy: If a choice requires an external assumption → eliminate it.'),
  f(T.PRO_assumptions,'What is the difference between a FACT and an OPINION in reasoning?',
    'FACT: Objectively verifiable statement — can be proven true or false with evidence.\nExamples: "The Civil Service Exam is administered by the CSC." / "RA 6713 was enacted in 1989."\nOPINION: Subjective statement — reflects a judgment, belief, or interpretation.\nExamples: "The CSE is the most important exam for Filipinos." / "RA 6713 is insufficient to prevent corruption."\nIn CSE passages: arguments often mix facts and opinions — valid conclusions should rest on facts.'),
  f(T.PRO_assumptions,'What is "logical consistency"?',
    'An argument is LOGICALLY CONSISTENT when all statements within it can simultaneously be true — there are no contradictions.\nExample: "All civil servants are honest. Some civil servants accepted bribes." These are INCONSISTENT — they cannot both be true.\nIn CSE: an inconsistency in the premises makes the conclusion unreliable. Eliminate answer choices that contradict the stated information.'),
  f(T.PRO_assumptions,'What is the "Burden of Proof" in argumentation?',
    'BURDEN OF PROOF: The obligation to PROVE a claim rests on whoever MAKES the claim.\n"Innocent until proven guilty" in criminal law: the prosecution bears the burden of proof, not the defendant.\nIn logical reasoning: if someone asserts a fact, they must provide evidence. The opposite side does not need to disprove an unsupported claim.\nExample: "Anyone claiming a supplement cures disease must provide clinical evidence."'),
];

// ── DATA INTERPRETATION (13 new) ──────────────────────────────────────────────
const data = [
  f(T.PRO_data_interp,'How do you calculate percent of total from a pie chart?',
    'Percent of total = (Part / Total) × 100. In pie charts: each sector\'s angle is proportional to its percent (360° = 100%). To find a value from percent: Value = (Percent / 100) × Total.\nExample: If education gets 30% of a ₱10M budget → Education allocation = 0.30 × 10,000,000 = ₱3,000,000.'),
  f(T.PRO_data_interp,'How do you calculate percentage increase from a table or graph?',
    'Percentage increase = [(New Value − Old Value) / Old Value] × 100.\nIf negative, it\'s a percentage DECREASE.\nExample: Sales went from ₱500,000 in 2022 to ₱650,000 in 2023. % increase = [(650,000 − 500,000) / 500,000] × 100 = [150,000 / 500,000] × 100 = 30%.'),
  f(T.PRO_data_interp,'How do you find the average from a frequency table?',
    'Weighted mean = Σ(value × frequency) / Σ(frequency).\nExample: Scores: 70 (3 students), 80 (5 students), 90 (2 students).\nWeighted mean = [(70×3)+(80×5)+(90×2)] / (3+5+2) = [210+400+180] / 10 = 790/10 = 79.\nThis is the mean/average score.'),
  f(T.PRO_data_interp,'In a bar graph, how do you find the difference between two values?',
    'Read EACH bar\'s value from the y-axis (horizontal line from bar top to y-axis). Subtract the smaller from the larger.\nTip: If the y-axis scale starts at a non-zero value (truncated axis), be careful — the visual difference appears exaggerated but actual difference is the y-axis reading.\nAlways check scale intervals and starting points before interpreting bar graphs.'),
  f(T.PRO_data_interp,'What does a line graph\'s slope indicate?',
    'The SLOPE of a line graph shows the RATE OF CHANGE:\nSteep upward slope = rapid increase\nGentle upward slope = slow increase\nFlat (horizontal) line = no change\nDownward slope = decrease\nAbrupt changes (spikes or drops) indicate unusual events in that period.\nFor CSE: identify periods of greatest increase (steepest rise) or greatest decrease (steepest fall) by comparing slopes between points.'),
  f(T.PRO_data_interp,'What is a data sufficiency question and how do you approach it?',
    'Data sufficiency: Given a question and two statements (S1, S2), determine which combination of statements is SUFFICIENT to answer the question.\nChoices: A) S1 alone; B) S2 alone; C) Both together; D) Either alone; E) Neither is sufficient.\nProcess: (1) Try S1 alone — can you answer definitely? (2) Try S2 alone. (3) If neither alone works, try combining. (4) If still insufficient, choose E.\nKey: "sufficient" means one DEFINITE answer — not just a possible answer.'),
  f(T.PRO_data_interp,'How do you read a double bar graph?',
    'A double bar graph compares TWO data sets side-by-side for each category. Each category has two bars (typically different colors/patterns).\nApproach: (1) Identify what each color/bar represents from the legend. (2) For each category, read both bars. (3) Compare across categories to find trends. (4) Sum both bars per category if total is needed.\nExample: Monthly sales of Product A vs. Product B — double bar graph shows both in each month.'),
  f(T.PRO_data_interp,'In a table with row and column totals, how do you check accuracy?',
    'Sum all row totals → should equal the grand total.\nSum all column totals → should also equal the grand total.\nIf row total ≠ column total → there is an error in the table.\nIn CSE questions: use this to find the missing value in a row or column. Missing value = Row Total − (sum of all other values in that row).'),
  f(T.PRO_data_interp,'What is "range" and how is it used in data analysis?',
    'RANGE = Maximum value − Minimum value. It measures the spread of data.\nExample: Scores: 55, 63, 70, 82, 95. Range = 95 − 55 = 40.\nLarger range = more variable (spread out) data. Smaller range = more consistent data.\nLimitation: Range is affected by outliers (extreme values). Use standard deviation for a better measure of spread.'),
  f(T.PRO_data_interp,'What is the difference between mean, median, and mode?',
    'MEAN (Average): Sum of all values ÷ number of values. Best for symmetric distributions.\nMEDIAN: Middle value when data is arranged in order. Best when data has outliers.\nMODE: Most frequently occurring value. Best for categorical data or discrete distributions.\nExample: {2, 3, 3, 7, 100}: Mean=23, Median=3, Mode=3. The outlier (100) makes mean misleading; median and mode better represent typical values.'),
  f(T.PRO_data_interp,'How do you find the missing value in a ratio problem from table data?',
    'If Total = T and one part\'s ratio is a:b, find each part:\nPart 1 = [a/(a+b)] × T and Part 2 = [b/(a+b)] × T.\nAlternative (if one value is known and ratio is a:b): Other value = (known value × b)/a.\nExample: If Region A:Region B = 3:5 and Region A received ₱6M, Region B = (6×5)/3 = ₱10M.'),
  f(T.PRO_data_interp,'What is a "trend" in line graph analysis and how do you describe it?',
    'TREND describes the general direction of data over time:\nUPWARD TREND: values generally increase (may fluctuate but overall higher)\nDOWNWARD TREND: values generally decrease\nFLUCTUATING: values alternate up and down without clear direction\nSTABLE/FLAT: values remain roughly the same\nFor CSE: "What is the overall trend from 2015-2025?" → Look at first and last value and the general pattern, not individual spikes.'),
  f(T.PRO_data_interp,'How do you calculate the total from a stacked bar graph?',
    'In a stacked bar graph, multiple segments are stacked vertically within one bar. Total height = sum of all segments.\nTo read: subtract the lower boundary from the upper boundary of each segment to get that segment\'s value.\nExample: Bottom segment = 0 to 400 (value: 400). Middle segment = 400 to 700 (value: 300). Top segment = 700 to 900 (value: 200). Total = 900.'),
];

// ── WORD ASSOCIATION — additional 6 ─────────────────────────────────────────
const wordAssoc = [
  f(T.PRO_word_assoc,'Complete: CARTOGRAPHER : MAP :: CHOREOGRAPHER : ___',
    'DANCE (or CHOREOGRAPHY or PERFORMANCE).\nRelationship: CREATOR-TO-PRODUCT.\nA cartographer creates maps; a choreographer creates dance routines.\nSimilar analogies: Author:Novel, Architect:Blueprint, Sculptor:Statue.'),
  f(T.PRO_word_assoc,'Complete: MERCURY : PLANET :: GOLD : ___',
    'ELEMENT (or METAL or SUBSTANCE).\nRelationship: MEMBER-TO-CATEGORY.\nMercury is a planet in the solar system; gold is a chemical element on the periodic table.\nNote: Mercury is ALSO an element — so the relationship is confirmed by context.'),
  f(T.PRO_word_assoc,'Complete: DROUGHT : CROPS :: RECESSION : ___',
    'ECONOMY (or BUSINESS or EMPLOYMENT).\nRelationship: HARMFUL CONDITION → AFFECTED ENTITY.\nDrought harms/destroys crops; recession harms/damages the economy.\nAlternately: CAUSE:EFFECT — drought causes crop failure; recession causes economic decline.'),
  f(T.PRO_word_assoc,'Complete: SURGEON : SCALPEL :: ARCHER : ___',
    'BOW (or ARROW or BOW AND ARROW).\nRelationship: PROFESSIONAL-TO-PRIMARY TOOL.\nA surgeon uses a scalpel; an archer uses a bow.\nSimilar: Carpenter:Hammer, Painter:Brush, Chef:Knife.'),
  f(T.PRO_word_assoc,'Complete: LITERACY : READING :: NUMERACY : ___',
    'MATHEMATICS (or ARITHMETIC or NUMBERS or CALCULATION).\nRelationship: SKILL-TO-DOMAIN.\nLiteracy is the skill of reading (and writing); numeracy is the skill of working with numbers/mathematics.\nThese are foundational competencies in education.'),
  f(T.PRO_word_assoc,'Complete: TRANSPARENT : GLASS :: OPAQUE : ___',
    'WOOD (or WALL or METAL or any solid non-transparent material).\nRelationship: PROPERTY-TO-EXAMPLE.\nGlass is transparent (light passes through); wood (or wall, metal) is opaque (light cannot pass through).\nNote: The answer must be a solid material that is opaque.'),
];

const allCards = [...logic, ...assumptions, ...data, ...wordAssoc];
console.log(`\nBatch B: ${allCards.length} cards to process`);

const byTopic = {};
for (const card of allCards) {
  if (!byTopic[card.topic_id]) byTopic[card.topic_id] = [];
  byTopic[card.topic_id].push(card);
}

let totalInserted = 0, totalSkipped = 0;
for (const [topicId, cards] of Object.entries(byTopic)) {
  const existing = await getExistingFronts(topicId);
  const newCards = cards.filter(c => !existing.has(c.front));
  const skipped = cards.length - newCards.length;
  if (newCards.length === 0) { console.log(`  Skip all (${skipped} dupes) for ${topicId.slice(0,8)}`); continue; }
  const { error } = await sb.from('flashcards').insert(newCards);
  if (error) { console.error(`  ERROR ${topicId.slice(0,8)}: ${error.message}`); continue; }
  totalInserted += newCards.length;
  totalSkipped += skipped;
  console.log(`  ✓ Inserted ${newCards.length} (skipped ${skipped}) for ${topicId.slice(0,8)}`);
}

const { count } = await sb.from('flashcards').select('*',{count:'exact',head:true});
console.log(`\n✅ Batch B done. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
console.log(`📊 Total flashcards: ${count}`);
