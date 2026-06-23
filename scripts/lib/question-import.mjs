export const QUESTION_IMPORT_HEADERS = [
  'exam_type_slug',
  'subject_slug',
  'topic_slug',
  'stem',
  'choice_a',
  'choice_b',
  'choice_c',
  'choice_d',
  'correct_choice',
  'difficulty',
  'explanation_en',
  'explanation_fil',
  'source_note',
  'tags',
];

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  fields.push(current);
  return fields;
}

export function parseQuestionImportCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  if (header.length !== QUESTION_IMPORT_HEADERS.length || !header.every((h, i) => h === QUESTION_IMPORT_HEADERS[i])) {
    throw new Error(`Invalid CSV header. Expected: ${QUESTION_IMPORT_HEADERS.join(',')}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => !c.trim())) continue;

    const record = { rowNumber: i + 1 };
    QUESTION_IMPORT_HEADERS.forEach((key, idx) => {
      record[key] = (cols[idx] ?? '').trim();
    });
    rows.push(record);
  }

  return rows;
}

function stemKey(stem) {
  return stem.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizedChoiceText(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasUnbalancedParentheses(value) {
  return (String(value).match(/\(/g)?.length ?? 0) !== (String(value).match(/\)/g)?.length ?? 0);
}

function hasUnbalancedSmartQuotes(value) {
  const text = String(value);
  return /[“”]/.test(text) && (text.match(/[“”]/g)?.length ?? 0) % 2 !== 0;
}

const APPROVED_LET_SECONDARY_MAJOR_TOPICS = new Set([
  'english',
  'mathematics',
  'filipino',
  'social-studies-araling-panlipunan',
  'biological-science',
  'physical-science',
  'values-education',
  'mapeh',
  'tle',
]);

export function validateQuestionImportRows(rows, catalog, existingStemKeysByTopic = new Map()) {
  const errors = [];
  const valid = [];
  const batchStemKeys = new Map();

  for (const row of rows) {
    const rowErrors = [];

    if (!row.exam_type_slug) rowErrors.push({ rowNumber: row.rowNumber, field: 'exam_type_slug', message: 'Missing exam_type_slug' });
    if (!row.subject_slug) rowErrors.push({ rowNumber: row.rowNumber, field: 'subject_slug', message: 'Missing subject_slug' });
    if (!row.topic_slug) rowErrors.push({ rowNumber: row.rowNumber, field: 'topic_slug', message: 'Missing topic_slug' });

    const examMap = catalog.get(row.exam_type_slug);
    if (row.exam_type_slug && !examMap) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'exam_type_slug', message: `Unknown exam: ${row.exam_type_slug}` });
    }

    const subjectMap = examMap?.get(row.subject_slug);
    if (row.exam_type_slug && examMap && row.subject_slug && !subjectMap) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'subject_slug',
        message: `Unknown subject "${row.subject_slug}" for ${row.exam_type_slug}`,
      });
    }

    const topicEntry = subjectMap?.get(row.topic_slug);
    if (row.topic_slug && subjectMap && !topicEntry) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'topic_slug',
        message: `Unknown topic "${row.topic_slug}" under ${row.exam_type_slug}/${row.subject_slug}`,
      });
    }

    if (
      row.exam_type_slug === 'let-secondary' &&
      row.subject_slug === 'major' &&
      row.topic_slug &&
      !APPROVED_LET_SECONDARY_MAJOR_TOPICS.has(row.topic_slug)
    ) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'topic_slug',
        message:
          'LET Secondary major must be one of the approved 2026 major slugs. Use biological-science or physical-science instead of science, and tle instead of Home Economics/ICT/TVTEd sub-areas.',
      });
    }

    if (topicEntry && !topicEntry.examActive) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'exam_type_slug', message: `Exam ${row.exam_type_slug} is not active` });
    }

    if (!row.stem || row.stem.length < 10) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'stem', message: 'Stem must be at least 10 characters' });
    } else if (row.stem.length > 2000) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'stem', message: 'Stem exceeds 2000 characters' });
    }

    const choiceFields = ['choice_a', 'choice_b', 'choice_c', 'choice_d'];
    for (const field of choiceFields) {
      if (!row[field]?.trim()) {
        rowErrors.push({ rowNumber: row.rowNumber, field, message: 'Choice text is required' });
      }
    }

    const nonBlankChoices = choiceFields.map((field) => normalizedChoiceText(row[field])).filter(Boolean);
    if (new Set(nonBlankChoices).size !== nonBlankChoices.length) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'choices', message: 'Content QA failed: choices must not contain duplicate text' });
    }

    const correct = row.correct_choice?.toLowerCase();
    if (!correct || !['a', 'b', 'c', 'd'].includes(correct)) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'correct_choice', message: 'correct_choice must be a, b, c, or d' });
    }

    const difficultyNum = Number(row.difficulty);
    if (!Number.isInteger(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'difficulty', message: 'difficulty must be an integer 1–5' });
    }

    if (!row.explanation_en || row.explanation_en.length < 24) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        field: 'explanation_en',
        message: 'Content QA failed: explanation_en must be at least 24 characters',
      });
    }

    if (hasUnbalancedSmartQuotes(row.stem)) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'stem', message: 'Content QA failed: stem may contain unbalanced quotation marks' });
    }

    if (hasUnbalancedParentheses(row.stem)) {
      rowErrors.push({ rowNumber: row.rowNumber, field: 'stem', message: 'Content QA failed: stem may contain unbalanced parentheses' });
    }

    if (topicEntry?.topicId && row.stem.length >= 10) {
      const key = stemKey(row.stem);
      const topicId = topicEntry.topicId;
      const existing = existingStemKeysByTopic.get(topicId) ?? new Set();
      const batch = batchStemKeys.get(topicId) ?? new Set();

      if (existing.has(key) || batch.has(key)) {
        rowErrors.push({ rowNumber: row.rowNumber, field: 'stem', message: 'Duplicate stem in this topic' });
      } else {
        batch.add(key);
        batchStemKeys.set(topicId, batch);
      }
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
    } else if (topicEntry) {
      valid.push({
        ...row,
        topicId: topicEntry.topicId,
        difficultyNum,
        tagsList: row.tags ? row.tags.split('|').map((t) => t.trim()).filter(Boolean) : [],
        stemKey: stemKey(row.stem),
      });
    }
  }

  return { valid, errors };
}

export function buildImportErrorCsv(errors) {
  const lines = ['row_number,field,message'];
  for (const err of errors) {
    const field = err.field ?? '';
    const msg = err.message.replace(/"/g, '""');
    lines.push(`${err.rowNumber},"${field}","${msg}"`);
  }
  return lines.join('\n');
}

export function summarizeImportErrors(errors) {
  const counts = new Map();

  for (const error of errors) {
    const field = error.field?.trim() || 'row';
    counts.set(field, (counts.get(field) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));
}
