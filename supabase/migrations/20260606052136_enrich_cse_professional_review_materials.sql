-- Enrich CSE Professional Notes tab with original ReviewNatin lessons and
-- cheat sheets. Source websites were used only to verify scope and topic
-- coverage; the bodies below are original summaries and study guidance.

WITH target AS (
  SELECT rm.id, t.slug AS topic_slug
  FROM review_materials rm
  JOIN topics t ON t.id = rm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'cse-professional'
    AND rm.title = 'Behaviorism quick review'
)
UPDATE review_materials rm
SET
  title = 'Main idea vs inference quick review',
  body = $rn$
**What the CSE usually asks**

Reading items rarely reward memorizing a passage. They test whether you can separate what is directly stated from what is reasonably implied.

**Main idea**

- The main idea is the whole point of the passage.
- It is broader than one detail but narrower than a vague topic.
- If the passage has a conclusion sentence, compare it with the first sentence and repeated keywords.

**Inference**

- An inference is not a guess. It must be supported by details in the passage.
- The correct answer often rephrases the evidence instead of copying exact words.
- Reject choices that add new facts, exaggerate, or contradict the tone.

**Fast method**

1. Ask: What is the author mostly trying to say?
2. Underline repeated nouns, causes, problems, and recommendations.
3. For inference items, require evidence from at least one sentence.
4. Eliminate answers that are true in real life but not supported by the passage.

**Exam trap**

If two choices sound possible, choose the one that needs the fewest assumptions.
$rn$,
  material_type = 'lesson',
  is_premium = false
FROM target
WHERE rm.id = target.id;

WITH target AS (
  SELECT rm.id, t.slug AS topic_slug
  FROM review_materials rm
  JOIN topics t ON t.id = rm.topic_id
  JOIN subject_areas sa ON sa.id = t.subject_area_id
  JOIN exam_types et ON et.id = sa.exam_type_id
  WHERE et.slug = 'cse-professional'
    AND rm.title = 'Constructivism in 5 minutes'
)
UPDATE review_materials rm
SET
  title = 'Context clues in 5 minutes',
  body = $rn$
**Why context clues matter**

Vocabulary questions in the CSE often test meaning in context, not dictionary memory. The same word can change meaning depending on the sentence.

**Four clue types**

| Clue | Signal | What to do |
| --- | --- | --- |
| Definition | is, means, refers to | Use the nearby explanation |
| Contrast | but, however, although | Choose the opposite direction |
| Example | such as, including, for instance | Infer from the examples |
| Cause-effect | because, therefore, as a result | Match the logical result |

**Process**

1. Cover the answer choices first.
2. Replace the difficult word with a simple word that fits the sentence.
3. Check whether the tone is positive, negative, or neutral.
4. Pick the closest answer in context, not the fanciest synonym.

**Exam trap**

Do not choose a synonym that is correct in isolation but wrong in the sentence.
$rn$,
  material_type = 'lesson',
  is_premium = false
FROM target
WHERE rm.id = target.id;

WITH material_rows(topic_slug, title, material_type, body) AS (
  VALUES
    ('grammar', 'Subject-verb agreement for CSE sentences', 'lesson', $rn$
**Core rule**

The verb agrees with the real subject, not the nearest noun.

**High-yield patterns**

- **Each, every, either, neither** usually takes a singular verb.
- **The number of** is singular; **a number of** is plural.
- Phrases between commas do not change the subject.
- Collective nouns can be singular when acting as one unit.
- In inverted sentences, find the subject after the verb.

**Examples**

| Sentence pattern | Correct logic |
| --- | --- |
| Each of the applicants **is** ready. | Subject is each |
| The list of names **was** submitted. | Subject is list |
| A number of files **are** missing. | A number of means several |

**Exam method**

1. Cross out prepositional phrases.
2. Find the real subject.
3. Decide singular or plural.
4. Check tense consistency.

**Common trap**

Do not let a plural object near the verb trick you. In "The box of records is heavy," the subject is box, not records.
$rn$),
    ('grammar', 'CSE Grammar cheat sheet', 'cheat_sheet', $rn$
**Agreement**

- Each, every, either, neither = singular.
- Compound subject joined by **and** = usually plural.
- Compound subject joined by **or/nor** = agree with the nearer subject.

**Pronouns**

- Use subject pronouns for doers: I, he, she, we, they.
- Use object pronouns after verbs/prepositions: me, him, her, us, them.
- Pronoun must clearly refer to one noun.

**Modifiers**

- Put descriptive phrases beside the word they describe.
- Avoid dangling modifiers: "After reviewing the file, the officer signed it."

**Tense**

- Keep one time frame unless the meaning changes.
- Use past perfect for an earlier past action: had submitted, had reviewed.

**Elimination rule**

Reject choices that are wordy, informal, ambiguous, or grammatically correct but less precise.
$rn$),
    ('vocabulary', 'Vocabulary in context and word relationships', 'lesson', $rn$
**What vocabulary items test**

CSE vocabulary is not only synonyms and antonyms. It also tests whether you understand relationships among words and can infer meaning from context.

**Relationship types**

- Synonym: same or nearly same meaning.
- Antonym: opposite or strongly contrasting meaning.
- Degree: warm, hot, scorching.
- Category: rose is to flower, salmon is to fish.
- Function: key is to lock, pen is to write.
- Cause-effect: negligence leads to accident.

**Context strategy**

1. Decide the sentence tone.
2. Replace the target word with your own simple word.
3. Check if the answer fits grammar and meaning.
4. Avoid choices that are too broad, too narrow, or emotionally stronger than the sentence.

**Word association tip**

For analogy-style vocabulary, name the relationship before looking at choices. If you cannot name the relationship, compare part of speech, function, and category.
$rn$),
    ('paragraph-org', 'Paragraph organization and logical flow', 'lesson', $rn$
**Goal**

Paragraph organization asks you to arrange sentences so the final paragraph has a clear beginning, middle, and end.

**Common order**

1. General statement or topic sentence.
2. Definition, background, or scope.
3. Supporting details, examples, or reasons.
4. Result, recommendation, or conclusion.

**Signal words**

- Sequence: first, next, finally.
- Contrast: however, although, on the other hand.
- Cause-effect: because, therefore, as a result.
- Addition: also, moreover, in addition.

**Fast method**

1. Find the sentence that introduces the subject without needing prior context.
2. Pair pronouns with their noun antecedents.
3. Keep examples after the general idea they support.
4. Put conclusions after evidence.

**Exam trap**

A sentence with "this" or "such" is rarely first because it points backward to a previous idea.
$rn$),
    ('reading-comp', 'Reading comprehension under time pressure', 'lesson', $rn$
**The practical approach**

Do not reread the whole passage for every item. Build a map once, then return to exact lines only when needed.

**Passage map**

- First sentence: likely topic.
- Repeated words: central issue.
- Transition words: author direction.
- Last sentence: conclusion or recommendation.

**Question types**

| Type | What to look for |
| --- | --- |
| Detail | Exact sentence or paraphrase |
| Main idea | Whole passage purpose |
| Inference | Supported implication |
| Tone | Author attitude |
| Vocabulary | Meaning in sentence |

**Time strategy**

Spend more time understanding the passage structure than staring at choices. Wrong choices often include one true detail but answer the wrong question.

**Exam trap**

"Always," "never," and extreme claims are suspicious unless the passage clearly supports them.
$rn$),
    ('grammar-fil', 'Balarila at wastong gamit quick lesson', 'lesson', $rn$
**Layunin**

Sinusukat ng Filipino grammar items kung kaya mong pumili ng pormal, malinaw, at wastong pangungusap.

**Madalas lumabas**

- Wastong gamit ng **ng** at **nang**.
- Pagkilala sa mali sa pangungusap.
- Tamang panlapi at anyo ng pandiwa.
- Pormal na salita sa halip na kolokyal.
- Malinaw na simuno at panaguri.

**Ng vs nang**

- **Ng**: ginagamit sa layon, pagmamay-ari, o tagaganap.
- **Nang**: ginagamit sa paraan, oras, o pag-uulit ng kilos.

**Paraan sa pagsagot**

1. Basahin ang buong pangungusap.
2. Tukuyin kung pormal o di-pormal ang gamit.
3. Hanapin ang salitang mali ang anyo, baybay, o relasyon sa ibang bahagi.
4. Piliin ang pinakamaikli at pinakamalinaw na tama.
$rn$),
    ('basic-operations', 'Numerical foundations: operations, fractions, decimals', 'lesson', $rn$
**Core skill**

Numerical Ability rewards clean arithmetic under time pressure. The exam usually uses basic operations, fractions, decimals, percentages, ratios, and word problems.

**Order of operations**

Use PEMDAS: parentheses, exponents, multiplication/division, addition/subtraction.

**Fractions**

- To add or subtract, use a common denominator.
- To multiply, multiply numerators and denominators.
- To divide, multiply by the reciprocal.
- Simplify before multiplying when possible.

**Decimals**

- Align decimal points for addition/subtraction.
- Count decimal places in multiplication.
- Move decimal points equally in division.

**Time saver**

Estimate first. If the exact computation is long, an estimate can eliminate impossible choices.

**Exam trap**

Negative signs and decimal places cause more mistakes than hard math. Circle them mentally before solving.
$rn$),
    ('word-problems', 'Word problem translation guide', 'lesson', $rn$
**The main skill**

Word problems test translation. Your job is to convert sentences into operations.

**Keyword guide**

| Wording | Usual operation |
| --- | --- |
| total, altogether, increased by | addition |
| difference, remaining, less than | subtraction |
| of, times, product | multiplication |
| per, each, quotient, shared equally | division |
| percent of | percent x base |

**Standard formulas**

- Average = sum / number of items.
- Speed = distance / time.
- Distance = speed x time.
- Percent change = change / original x 100.
- Part = rate x base.

**Process**

1. Identify what is being asked.
2. List given numbers with labels.
3. Convert words to operations.
4. Check if the answer unit matches the question.

**Exam trap**

"Less than" reverses order. "5 less than x" means x - 5, not 5 - x.
$rn$),
    ('number-series', 'Number series pattern bank', 'cheat_sheet', $rn$
**Check these patterns in order**

1. Constant addition or subtraction.
2. Constant multiplication or division.
3. Alternating operations.
4. Increasing gaps: +2, +4, +6.
5. Squares or cubes.
6. Prime numbers.
7. Two interleaved sequences: positions 1-3-5 and 2-4-6.

**Fast examples**

| Series | Rule |
| --- | --- |
| 3, 7, 11, 15 | +4 |
| 2, 6, 18, 54 | x3 |
| 1, 4, 9, 16 | squares |
| 5, 8, 14, 23 | +3, +6, +9 |

**Exam tip**

If one rule fails, split odd and even positions before guessing.
$rn$),
    ('logic', 'Logic and syllogism basics', 'lesson', $rn$
**What logic questions test**

Logic items ask whether a conclusion must follow from given statements. Do not use outside knowledge.

**Quantifier meanings**

- All A are B: every A belongs to B.
- Some A are B: at least one A is B.
- No A are B: A and B do not overlap.
- Some A are not B: at least one A is outside B.

**Valid conclusion rule**

A valid conclusion is unavoidable if the premises are true. It is not enough that it sounds likely.

**Method**

1. Translate statements into simple sets.
2. Draw circles if needed.
3. Test whether the conclusion is always true.
4. Reject conclusions that may be true but are not guaranteed.

**Exam trap**

"All managers are employees" does not mean "all employees are managers."
$rn$),
    ('assumptions-conclusions', 'Assumptions and conclusions strategy', 'lesson', $rn$
**Conclusion**

The conclusion is the claim the argument wants you to accept. It often follows words like therefore, thus, so, hence, or consequently.

**Assumption**

An assumption is an unstated idea the argument needs to work.

**How to find it**

1. Identify the evidence.
2. Identify the conclusion.
3. Ask what missing bridge connects them.
4. Negate the possible assumption. If the argument collapses, it is likely required.

**Weak vs strong conclusions**

- Strong conclusion: follows directly from evidence.
- Weak conclusion: adds new claims, overgeneralizes, or uses emotional language.

**Exam trap**

Do not choose a choice just because you agree with it. The right answer must be tied to the argument.
$rn$),
    ('data-interpretation', 'Data interpretation checklist', 'cheat_sheet', $rn$
**Before calculating**

- Read the title, units, years, and labels.
- Check whether values are totals, percentages, averages, or rates.
- Notice if the question asks greatest, least, difference, ratio, or approximate.

**Common operations**

| Asked phrase | Compute |
| --- | --- |
| difference | larger - smaller |
| total | add selected values |
| average | total / count |
| percent of total | part / total x 100 |
| percent increase | increase / original x 100 |
| ratio | compare after simplifying |

**Accuracy rule**

Use exact values when choices are close. Estimate only when choices are far apart.

**Exam trap**

Do not compare percentages with raw counts unless they have the same base.
$rn$),
    ('word-association', 'Word association and analogy guide', 'lesson', $rn$
**What to identify**

Word association items test relationship, not memorized pairs.

**Relationship bank**

- Part to whole: wheel : car.
- Tool to function: thermometer : measure.
- Cause to effect: drought : shortage.
- Worker to workplace: judge : court.
- Category to example: metal : iron.
- Degree: whisper : shout.
- Opposite: scarce : abundant.

**Method**

1. Turn the pair into a sentence: "A is used for B."
2. Keep the same part of speech.
3. Match the relationship, not the topic.
4. Eliminate pairs with reversed direction.

**Exam trap**

Two words may be related but in the wrong way. "Doctor : hospital" is workplace; "doctor : stethoscope" is tool.
$rn$),
    ('constitution', 'Philippine Constitution essentials for CSE', 'lesson', $rn$
**Why it matters**

General Information items often test basic constitutional principles because public service is grounded in public accountability, rights, duties, and government structure.

**Core concepts**

- Sovereignty resides in the people.
- Public office is a public trust.
- The Constitution divides government power among legislative, executive, and judicial branches.
- The Bill of Rights limits government action and protects individual liberties.
- Citizenship, suffrage, accountability, social justice, and national economy are recurring themes.

**Branch map**

| Branch | Core function |
| --- | --- |
| Legislative | makes laws |
| Executive | implements laws |
| Judicial | interprets laws and resolves cases |

**Exam tip**

When a question describes abuse of power, look for accountability, due process, equal protection, or separation of powers.
$rn$),
    ('ra-6713', 'RA 6713 public service ethics lesson', 'lesson', $rn$
**Big idea**

RA 6713 is the Code of Conduct and Ethical Standards for Public Officials and Employees. It reinforces that public office is a public trust.

**Eight norms of conduct**

1. Commitment to public interest.
2. Professionalism.
3. Justness and sincerity.
4. Political neutrality.
5. Responsiveness to the public.
6. Nationalism and patriotism.
7. Commitment to democracy.
8. Simple living.

**Important duties**

- Act promptly on public requests.
- Process documents expeditiously.
- Make public documents accessible.
- Submit required reports and disclosures.

**Prohibited conduct**

- Conflicting financial or material interest.
- Unauthorized outside employment related to office functions.
- Misuse of confidential information.
- Soliciting or accepting improper gifts.

**Exam tip**

Situational questions usually ask which action best protects public interest, neutrality, transparency, or accountability.
$rn$),
    ('ra-6713', 'RA 6713 cheat sheet', 'cheat_sheet', $rn$
**Memory anchor: PJP PRNDS**

- Public interest
- Justness
- Professionalism
- Political neutrality
- Responsiveness
- Nationalism
- Democracy
- Simple living

**15-day rule**

Public officials and employees must respond to public letters and requests within the period required by law.

**Conflict of interest**

If private interest may be affected by official duty, the public servant must avoid the conflict and follow divestment or inhibition rules.

**Gift rule**

Reject gifts, favors, loans, or benefits that may influence official action or appear connected to official duties.

**Best answer pattern**

In ethics questions, choose the action that is transparent, prompt, impartial, and public-interest oriented.
$rn$),
    ('peace-human-rights', 'Peace and human rights overview', 'lesson', $rn$
**Core idea**

Human rights questions test respect for dignity, equality, due process, and protection from abuse.

**Key concepts**

- Rights belong to every person by reason of being human.
- Civil and political rights protect participation, liberty, due process, and expression.
- Economic, social, and cultural rights include education, work, health, and welfare concerns.
- Peace is not only absence of conflict; it also involves justice, inclusion, and lawful resolution of disputes.

**Public service angle**

Government employees are expected to serve without discrimination, protect vulnerable groups, and follow lawful procedures.

**Exam tip**

When choices conflict, prefer the option that preserves dignity, follows due process, avoids discrimination, and uses lawful remedies.
$rn$),
    ('environment', 'Environmental management reviewer', 'lesson', $rn$
**What to know**

Environmental questions usually focus on responsible resource use, pollution control, disaster preparedness, and sustainable development.

**Core ideas**

- Reduce, reuse, recycle is only one part of waste management; proper segregation and disposal matter.
- Conservation protects resources for present and future generations.
- Climate and disaster risk require prevention, mitigation, preparedness, response, and recovery.
- Environmental laws and local ordinances support clean air, clean water, solid waste management, and protected areas.

**Decision rule**

Choose the option that prevents harm at the source, follows law, protects communities, and balances development with sustainability.

**Exam trap**

Avoid answers that solve one problem by creating another, such as dumping waste elsewhere or ignoring affected residents.
$rn$),
    ('pattern-completion', 'Abstract reasoning pattern rules', 'lesson', $rn$
**Common visual rules**

- Rotation: a figure turns by a fixed angle.
- Reflection: a mirror image appears across an axis.
- Movement: an element changes position in a predictable path.
- Count: dots, sides, or shapes increase or decrease.
- Shading: fill changes through a cycle.
- Combination: two rules happen at the same time.

**Matrix method**

1. Compare across rows.
2. Compare down columns.
3. Track one feature at a time.
4. Test whether the answer satisfies both row and column rules.

**Exam trap**

Do not choose the option that merely looks similar. Choose the one that continues the rule.
$rn$),
    ('series-completion', 'Abstract series completion cheat sheet', 'cheat_sheet', $rn$
**Checklist**

1. Direction or movement.
2. Rotation angle.
3. Number of elements.
4. Shape substitution.
5. Fill or shading cycle.
6. Alternating odd-even pattern.
7. Size increase or decrease.

**Fast rule**

Predict before looking at choices. If your prediction is unclear, eliminate choices that break a definite feature.

**Two-rule warning**

Many abstract items combine rules, such as rotation plus count. Solve each feature separately.
$rn$),
    ('odd-one-out', 'Odd one out decision system', 'lesson', $rn$
**Goal**

Find the figure that does not share the rule common to the others.

**Attributes to test**

- Number of sides or elements.
- Orientation.
- Symmetry.
- Fill or shading.
- Position of inner shapes.
- Relationship between parts.

**Method**

1. Name a possible shared rule.
2. Count how many figures follow it.
3. If more than one figure is excluded, the rule is too weak.
4. Keep testing until only one figure fails.

**Exam trap**

The odd figure is not always the most visually different. It is the one that violates the best shared rule.
$rn$)
)
INSERT INTO review_materials (topic_id, title, body, material_type, is_premium)
SELECT t.id, mr.title, mr.body, mr.material_type, false
FROM material_rows mr
JOIN topics t ON t.slug = mr.topic_slug
JOIN subject_areas sa ON sa.id = t.subject_area_id
JOIN exam_types et ON et.id = sa.exam_type_id AND et.slug = 'cse-professional'
WHERE NOT EXISTS (
  SELECT 1
  FROM review_materials existing
  WHERE existing.topic_id = t.id
    AND existing.title = mr.title
);
