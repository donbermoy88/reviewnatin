const TOPIC_KEYWORDS = [
  {
    topic: /abstract|non[-\s]?verbal|pattern|sequence/i,
    expected: /\b(shape|figure|pattern|series|sequence|rotation|mirror|cube|matrix|next|odd one|analog|diagram|complete|missing|visual)\b/i,
  },
  {
    topic: /math|numerical|word-problem|quantitative|data-sufficiency/i,
    expected: /\b(percent|percentage|ratio|average|sum|product|number|equation|solve|₱|php|peso|cost|earn|divide|squared|surveyed|examinees|km|meter|liter|profit|loss|rate|time|distance)\b/i,
  },
  {
    topic: /grammar|usage|wastong|correct/i,
    expected: /\b(sentence|verb|subject|pronoun|adjective|adverb|tense|complete|completes|correct|usage|error|pangungusap|salita|wasto|mali|tama|pang-ukol|piliin|grammar)\b/i,
  },
  {
    topic: /vocabulary|synonym|antonym|kasingkahulugan|kasalungat/i,
    expected: /\b(word|expression|idiom|synonym|antonym|meaning|means|closest|opposite|context|vocabulary|kahulugan|kasingkahulugan|kasalungat|salitang|magkasingkahulugan|magkasalungat)\b/i,
  },
  {
    topic: /constitution|law|rights|ethics|code/i,
    expected: /\b(constitution|law|republic act|article|section|rights|public office|public official|senate|senator|congress|court|ethics|conduct|citizen|government|gift|peace|human rights)\b/i,
  },
  {
    topic: /reading|comprehension|paragraph/i,
    expected: /\b(passage|paragraph|author|main idea|inference|according to|tone|statement|selection|read|title|stanza|talata|binasa|akda|may-akda|paksa|ideya|pahayag|wastong pagkakasunod|panimulang pangungusap|concluding sentence|topic sentence)\b/i,
  },
];

const SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function choiceTexts(question) {
  return Array.isArray(question.choices) ? question.choices.map((choice) => String(choice?.text ?? '').trim()) : [];
}

function choiceIds(question) {
  return Array.isArray(question.choices) ? question.choices.map((choice) => String(choice?.id ?? '').trim()).filter(Boolean) : [];
}

function issue(code, severity, message) {
  return { code, severity, message };
}

function topicTextFor(content) {
  const topicSlug = String(content.topic_slug ?? content.topicSlug ?? '').trim();
  const topicName = String(content.topic_name ?? content.topicName ?? '').trim();
  return `${topicSlug} ${topicName}`;
}

function topicMismatchIssue(content, text) {
  const matchingRule = TOPIC_KEYWORDS.find((rule) => rule.topic.test(topicTextFor(content)));
  if (!matchingRule || matchingRule.expected.test(text)) return null;
  return issue('possible_topic_mismatch', 'low', 'Content wording does not appear to match its assigned topic.');
}

export function auditQuestion(question, context = {}) {
  const issues = [];
  const stem = String(question.stem ?? '').trim();
  const normalizedStem = normalizeText(stem);
  const choices = choiceTexts(question);
  const ids = choiceIds(question);
  const duplicateChoiceTexts = choices.filter((text, index) => text && choices.indexOf(text) !== index);
  const explanationEn = String(question.explanation_en ?? '').trim();
  const explanationFil = String(question.explanation_fil ?? '').trim();
  const correctChoiceId = String(question.correct_choice_id ?? '').trim();

  if (stem.length < 12) issues.push(issue('short_stem', 'high', 'Question stem is too short to be review-quality.'));
  if (/[ \t]{2,}/.test(stem)) issues.push(issue('extra_whitespace', 'low', 'Question stem contains repeated spaces.'));
  if (/[“”]/.test(stem) && (stem.match(/[“”]/g)?.length ?? 0) % 2 !== 0) {
    issues.push(issue('unbalanced_quotes', 'medium', 'Question stem may contain unbalanced quotation marks.'));
  }
  if ((stem.match(/\(/g)?.length ?? 0) !== (stem.match(/\)/g)?.length ?? 0)) {
    issues.push(issue('unbalanced_parentheses', 'medium', 'Question stem may contain unbalanced parentheses.'));
  }

  if (choices.length < 2) issues.push(issue('too_few_choices', 'critical', 'Question has fewer than two choices.'));
  if (choices.some((text) => text.length === 0)) issues.push(issue('blank_choice', 'critical', 'One or more choices are blank.'));
  if (duplicateChoiceTexts.length) issues.push(issue('duplicate_choices', 'critical', 'Two or more choices have the same text.'));
  if (!correctChoiceId || !ids.includes(correctChoiceId)) {
    issues.push(issue('invalid_correct_choice', 'critical', 'Correct choice id is missing or not present in choices.'));
  }

  if (!explanationEn && !explanationFil) {
    issues.push(issue('missing_explanation', 'high', 'Question has no English or Filipino explanation.'));
  } else if ((explanationEn || explanationFil).length < 24) {
    issues.push(issue('thin_explanation', 'medium', 'Explanation is too short to be useful.'));
  }

  const topicIssue = topicMismatchIssue(question, `${normalizedStem} ${choices.join(' ')}`);
  if (topicIssue) issues.push(topicIssue);

  const duplicateStemCount = context.stemCounts?.get(normalizedStem) ?? 0;
  if (normalizedStem && duplicateStemCount > 1) {
    issues.push(issue('duplicate_stem', 'high', `Same normalized stem appears ${duplicateStemCount} times.`));
  }

  return issues;
}

export function auditFlashcard(card, context = {}) {
  const issues = [];
  const front = String(card.front ?? '').trim();
  const back = String(card.back ?? '').trim();
  const normalizedFront = normalizeText(front);

  if (front.length < 8) issues.push(issue('short_front', 'high', 'Flashcard front is too short to be useful.'));
  if (back.length < 20) issues.push(issue('thin_back', 'high', 'Flashcard back is too thin for review-quality learning.'));
  if (front && back && normalizeText(front) === normalizeText(back)) {
    issues.push(issue('front_matches_back', 'critical', 'Flashcard front and back are effectively identical.'));
  }
  if (/[ \t]{2,}/.test(front) || /[ \t]{2,}/.test(back)) {
    issues.push(issue('extra_whitespace', 'low', 'Flashcard contains repeated spaces.'));
  }

  const topicIssue = topicMismatchIssue(card, `${normalizedFront} ${normalizeText(back)}`);
  if (topicIssue) issues.push(topicIssue);

  const duplicateFrontCount = context.frontCounts?.get(normalizedFront) ?? 0;
  if (normalizedFront && duplicateFrontCount > 1) {
    issues.push(issue('duplicate_front', 'high', `Same normalized flashcard front appears ${duplicateFrontCount} times.`));
  }

  return issues;
}

export function auditReviewMaterial(material, context = {}) {
  const issues = [];
  const title = String(material.title ?? '').trim();
  const body = String(material.body ?? '').trim();
  const normalizedTitle = normalizeText(title);
  const materialType = String(material.material_type ?? material.materialType ?? '').trim();

  if (title.length < 8) issues.push(issue('short_title', 'medium', 'Review material title is too short.'));
  if (body.length < 350) issues.push(issue('thin_body', 'high', 'Review material body is too short for a lesson or cheat sheet.'));
  if (!['lesson', 'cheat_sheet', 'cheat sheet', 'notes', 'note'].includes(materialType)) {
    issues.push(issue('unknown_material_type', 'medium', 'Review material has an unknown type.'));
  }
  if (/[ \t]{3,}/.test(body)) issues.push(issue('extra_whitespace', 'low', 'Review material body contains repeated spaces.'));
  if ((body.match(/\(/g)?.length ?? 0) !== (body.match(/\)/g)?.length ?? 0)) {
    issues.push(issue('unbalanced_parentheses', 'medium', 'Review material may contain unbalanced parentheses.'));
  }

  const topicIssue = topicMismatchIssue(material, `${normalizedTitle} ${normalizeText(body)}`);
  if (topicIssue) issues.push(topicIssue);

  const duplicateTitleCount = context.titleCounts?.get(normalizedTitle) ?? 0;
  if (normalizedTitle && duplicateTitleCount > 1) {
    issues.push(issue('duplicate_title', 'medium', `Same normalized material title appears ${duplicateTitleCount} times.`));
  }

  return issues;
}

export function summarizeIssues(results) {
  const summary = {
    totalQuestions: results.length,
    totalItems: results.length,
    questionsWithIssues: 0,
    itemsWithIssues: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    byCode: {},
  };

  for (const result of results) {
    if (result.issues.length) summary.questionsWithIssues += 1;
    if (result.issues.length) summary.itemsWithIssues += 1;
    for (const item of result.issues) {
      summary[item.severity] += 1;
      summary.byCode[item.code] = (summary.byCode[item.code] ?? 0) + 1;
    }
  }

  return summary;
}

export function hasIssueAtOrAbove(summary, severity) {
  const minimum = SEVERITY_RANK[severity] ?? SEVERITY_RANK.critical;
  return Object.entries(SEVERITY_RANK).some(([key, rank]) => rank >= minimum && (summary[key] ?? 0) > 0);
}
