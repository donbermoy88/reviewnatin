#!/usr/bin/env node
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourceFile = 'output/pdf/cse_logic_2026_extracted_questions.json';
const dryRun = process.argv.includes('--dry-run');
const reportFile = dryRun
  ? 'output/pdf/cse_logic_2026_upload_report_dry_run.json'
  : 'output/pdf/cse_logic_2026_upload_report.json';
const sourceToken = 'cse_logic_2026';
const examSlug = 'cse-professional';

const targetByTopic = {
  logic: { subjectSlug: 'analytical', topicSlug: 'logic' },
  'word-association': { subjectSlug: 'analytical', topicSlug: 'word-association' },
  'number-series': { subjectSlug: 'numerical', topicSlug: 'number-series' },
  'series-completion': { subjectSlug: 'abstract', topicSlug: 'series-completion' },
};

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const i = line.indexOf('=');
          return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, '')];
        }),
    );
  } catch {
    return {};
  }
}

function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildChoices(row) {
  return ['A', 'B', 'C', 'D', 'E']
    .map((letter) => {
      const value = letter === 'E' ? row['Choice E if there is'] : row[`Choice ${letter}`];
      return { id: letter.toLowerCase(), text: String(value ?? '').trim() };
    })
    .filter((choice) => choice.text);
}

function choiceKey(choices) {
  return choices.map((choice) => `${choice.id}:${normalizeText(choice.text)}`).join('|');
}

function existingContentKey(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  return `${question.topic_id}::${normalizeText(question.stem)}::${choiceKey(choices)}::${question.correct_choice_id ?? ''}`;
}

function candidateContentKey(row, topicId) {
  return `${topicId}::${normalizeText(row.Question)}::${choiceKey(buildChoices(row))}::${String(row['Correct Answer']).toLowerCase()}`;
}

function sourceKeyFromParts(row, topicSlug) {
  return `${sourceToken}|${examSlug}|${topicSlug}|${row['Source PDF']}|${row['Original No.']}|${row.Page}`;
}

function sourceKeyFromNote(note) {
  return String(note ?? '').match(/source_key:([^;]+)/)?.[1]?.trim() ?? '';
}

function sourceNote(row, topicSlug) {
  return [
    'CSE Logic 2026',
    `source_token:${sourceToken}`,
    `source_key:${sourceKeyFromParts(row, topicSlug)}`,
    `exam:${examSlug}`,
    `topic:${topicSlug}`,
    `page ${row.Page}`,
    row['Source PDF'],
    `original no. ${row['Original No.']}`,
    row.Notes,
  ].filter(Boolean).join('; ').slice(0, 1000);
}

function explanation(row) {
  return String(row.Explanation ?? '').trim() || `Correct answer from extracted CSE Logic 2026 answer key: ${row['Correct Answer']}.`;
}

function payload(row, topicId, topicSlug) {
  return {
    topic_id: topicId,
    stem: row.Question,
    choices: buildChoices(row),
    correct_choice_id: String(row['Correct Answer']).toLowerCase(),
    explanation_en: explanation(row),
    explanation_fil: null,
    difficulty: Number(row.Difficulty) || 3,
    status: 'published',
    image_url: null,
    source: 'pdf_extraction',
    source_note: sourceNote(row, topicSlug),
    is_verified: true,
    tags: [
      'cse',
      'pdf-extraction',
      'cse-logic-2026',
      examSlug,
      `topic:${topicSlug}`,
      `source:${slugify(row['Source PDF'])}`,
    ],
    needs_review: false,
    review_reason: null,
  };
}

async function fetchExistingQuestions(sb, topicIds) {
  const all = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('questions')
      .select('id, topic_id, stem, choices, correct_choice_id, source_note')
      .in('topic_id', topicIds)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
  process.exit(1);
}

if (!existsSync(resolve(root, sourceFile))) {
  console.error(`Missing source file: ${sourceFile}`);
  process.exit(1);
}

const sb = createClient(url, key);

const { data: topics, error: topicsError } = await sb
  .from('topics')
  .select('id, slug, subject_areas!inner(slug, exam_types!inner(slug))');
if (topicsError) throw topicsError;

const topicMap = new Map();
for (const topic of topics ?? []) {
  const topicExamSlug = topic.subject_areas?.exam_types?.slug;
  const areaSlug = topic.subject_areas?.slug;
  if (topicExamSlug === examSlug) {
    topicMap.set(`${areaSlug}:${topic.slug}`, topic.id);
  }
}

for (const [sourceTopic, target] of Object.entries(targetByTopic)) {
  if (!topicMap.has(`${target.subjectSlug}:${target.topicSlug}`)) {
    throw new Error(`Missing CSE topic for ${sourceTopic}: ${examSlug}/${target.subjectSlug}/${target.topicSlug}`);
  }
}

const rows = JSON.parse(readFileSync(resolve(root, sourceFile), 'utf8'));
const readyRows = rows.filter((row) => row.Status === 'Ready for Upload');
const skipped = rows
  .filter((row) => row.Status !== 'Ready for Upload')
  .map((row) => ({
    row: row['No.'],
    source_pdf: row['Source PDF'],
    original_no: row['Original No.'],
    status: row.Status,
    topic_slug: row['Topic Slug'],
    notes: row.Notes || '',
  }));

const topicIds = [...new Set(Object.values(targetByTopic).map((target) =>
  topicMap.get(`${target.subjectSlug}:${target.topicSlug}`),
))];
const existing = await fetchExistingQuestions(sb, topicIds);
const existingBySourceKey = new Map();
const plannedByContent = new Map();
for (const question of existing) {
  const sourceKey = sourceKeyFromNote(question.source_note);
  if (sourceKey) existingBySourceKey.set(sourceKey, question);
  plannedByContent.set(existingContentKey(question), question);
}

const inserts = [];
const updates = [];
const duplicates = [];
const invalid = [];

for (const row of readyRows) {
  const choices = buildChoices(row);
  const correct = String(row['Correct Answer'] ?? '').toLowerCase();
  const target = targetByTopic[row['Topic Slug']];
  const topicSlug = target?.topicSlug;
  const topicId = target ? topicMap.get(`${target.subjectSlug}:${target.topicSlug}`) : null;

  if (!topicId) {
    invalid.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      reason: `missing_topic:${row['Topic Slug']}`,
    });
    continue;
  }

  if (!row.Question || choices.length < 4 || !choices.some((choice) => choice.id === correct)) {
    invalid.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      reason: 'missing_question_choices_or_answer',
    });
    continue;
  }

  const normalizedChoices = choices.map((choice) => normalizeText(choice.text));
  if (new Set(normalizedChoices).size !== normalizedChoices.length) {
    invalid.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      reason: 'duplicate_choice_text',
    });
    continue;
  }

  const sourceKey = sourceKeyFromParts(row, topicSlug);
  const existingBySource = existingBySourceKey.get(sourceKey);
  const contentKey = candidateContentKey(row, topicId);
  if (existingBySource) {
    updates.push({ id: existingBySource.id, sourceKey, row, topicId, topicSlug });
    plannedByContent.set(contentKey, existingBySource);
    continue;
  }

  const existingByContent = plannedByContent.get(contentKey);
  if (existingByContent) {
    duplicates.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      topic_slug: topicSlug,
      reason: 'duplicate_existing_content',
      existing_id: existingByContent.id,
    });
    continue;
  }

  inserts.push({ sourceKey, row, topicId, topicSlug });
  plannedByContent.set(contentKey, { id: null });
}

const insertedIds = [];
const updatedIds = [];
if (!dryRun) {
  const batchSize = 250;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize).map((insert) =>
      payload(insert.row, insert.topicId, insert.topicSlug),
    );
    const { data, error } = await sb.from('questions').insert(batch).select('id');
    if (error) throw error;
    insertedIds.push(...(data ?? []).map((row) => row.id));
  }

  for (const update of updates) {
    const { error } = await sb
      .from('questions')
      .update({
        ...payload(update.row, update.topicId, update.topicSlug),
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id);
    if (error) throw error;
    updatedIds.push(update.id);
  }
}

const report = {
  source_file: sourceFile,
  source_token: sourceToken,
  dry_run: dryRun,
  rows_total: rows.length,
  ready_rows: readyRows.length,
  skipped_nonready: skipped.length,
  planned_inserts: inserts.length,
  planned_updates: updates.length,
  duplicates: duplicates.length,
  invalid: invalid.length,
  inserted: insertedIds.length,
  updated: updatedIds.length,
  ready_by_topic: readyRows.reduce((acc, row) => {
    acc[row['Topic Slug']] = (acc[row['Topic Slug']] ?? 0) + 1;
    return acc;
  }, {}),
  inserted_ids: insertedIds,
  updated_ids: updatedIds,
  duplicate_samples: duplicates.slice(0, 50),
  invalid_samples: invalid.slice(0, 50),
  skipped_samples: skipped.slice(0, 50),
  generated_at: new Date().toISOString(),
};

writeFileSync(resolve(root, reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
