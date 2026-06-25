#!/usr/bin/env node
import crypto from 'crypto';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourceFile = 'output/pdf/cse_exams_reviewer_2026_extracted_questions.json';
const reportFile = 'output/pdf/cse_exams_reviewer_2026_upload_report.json';
const dryRun = process.argv.includes('--dry-run');
const sourceToken = 'cse_exams_reviewer_2026';

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

function subTopicFromNotes(notes) {
  const match = String(notes ?? '').match(/\bsub_topic:([a-z0-9-]+)/);
  return match?.[1] ?? '';
}

function sourceKeyFromParts(row, examSlug, topicSlug) {
  return `${sourceToken}|${examSlug}|${topicSlug}|${row['Source PDF']}|${row['Subject Category']}|${row['Topic Slug']}|${row['Original No.']}|${row.Page}`;
}

function sourceKeyFromNote(note) {
  return String(note ?? '').match(/source_key:([^;]+)/)?.[1]?.trim() ?? '';
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

function targetTopics(row) {
  const targets = [];
  const proTopic = row['Topic Slug'];
  const subTopic = subTopicFromNotes(row.Notes);
  if (proTopic && row['Subject Category'] !== 'Clerical Operations') {
    targets.push({ examSlug: 'cse-professional', topicSlug: proTopic });
  }
  if (subTopic) targets.push({ examSlug: 'cse-subprofessional', topicSlug: subTopic });
  return targets;
}

function sourceNote(row, examSlug, topicSlug) {
  return [
    'CSE Exams and Reviewer 2026',
    `source_token:${sourceToken}`,
    `source_key:${sourceKeyFromParts(row, examSlug, topicSlug)}`,
    `exam:${examSlug}`,
    `topic:${topicSlug}`,
    `page ${row.Page}`,
    row['Source PDF'],
    `original no. ${row['Original No.']}`,
    row.Notes,
  ].filter(Boolean).join('; ').slice(0, 1000);
}

function explanation(row) {
  return String(row.Explanation ?? '').trim() || `Correct answer from extracted CSE reviewer PDF: ${row['Correct Answer']}.`;
}

function payload(row, topicId, examSlug, topicSlug) {
  return {
    topic_id: topicId,
    stem: row.Question,
    choices: buildChoices(row),
    correct_choice_id: String(row['Correct Answer']).toLowerCase(),
    explanation_en: explanation(row),
    explanation_fil: null,
    difficulty: Number(row.Difficulty) || 2,
    status: 'published',
    image_url: null,
    source: 'pdf_extraction',
    source_note: sourceNote(row, examSlug, topicSlug),
    is_verified: true,
    tags: [
      'cse',
      'pdf-extraction',
      'cse-exams-reviewer-2026',
      examSlug,
      `topic:${topicSlug}`,
      `section:${slugify(row.Notes?.split('.')[0] || row['Subject Category'])}`,
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
  const examSlug = topic.subject_areas?.exam_types?.slug;
  if (!['cse-professional', 'cse-subprofessional'].includes(examSlug)) continue;
  topicMap.set(`${examSlug}:${topic.slug}`, topic.id);
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

const targetTopicIds = [...new Set(readyRows.flatMap((row) =>
  targetTopics(row).map((target) => topicMap.get(`${target.examSlug}:${target.topicSlug}`)).filter(Boolean),
))];
const existing = await fetchExistingQuestions(sb, targetTopicIds);
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
const missingTargets = [];

for (const row of readyRows) {
  const choices = buildChoices(row);
  const correct = String(row['Correct Answer'] ?? '').toLowerCase();
  if (!row.Question || choices.length < 4 || !choices.some((choice) => choice.id === correct)) {
    invalid.push({ row: row['No.'], reason: 'missing_question_choices_or_answer' });
    continue;
  }
  const normalizedChoices = choices.map((choice) => normalizeText(choice.text));
  if (new Set(normalizedChoices).size !== normalizedChoices.length) {
    invalid.push({ row: row['No.'], reason: 'duplicate_choice_text' });
    continue;
  }

  for (const target of targetTopics(row)) {
    const topicId = topicMap.get(`${target.examSlug}:${target.topicSlug}`);
    if (!topicId) {
      missingTargets.push({
        row: row['No.'],
        exam_slug: target.examSlug,
        topic_slug: target.topicSlug,
        source_topic: row['Topic Slug'],
      });
      continue;
    }

    const sourceKey = sourceKeyFromParts(row, target.examSlug, target.topicSlug);
    const existingBySource = existingBySourceKey.get(sourceKey);
    const contentKey = candidateContentKey(row, topicId);
    if (existingBySource) {
      updates.push({ id: existingBySource.id, sourceKey, row, topicId, ...target });
      plannedByContent.set(contentKey, existingBySource);
      continue;
    }

    const existingByContent = plannedByContent.get(contentKey);
    if (existingByContent) {
      duplicates.push({
        row: row['No.'],
        exam_slug: target.examSlug,
        topic_slug: target.topicSlug,
        reason: 'duplicate_existing_content',
        existing_id: existingByContent.id,
      });
      continue;
    }

    inserts.push({ sourceKey, row, topicId, ...target });
    plannedByContent.set(contentKey, { id: null });
  }
}

const insertedIds = [];
const updatedIds = [];
if (!dryRun) {
  const batchSize = 250;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize).map((insert) =>
      payload(insert.row, insert.topicId, insert.examSlug, insert.topicSlug),
    );
    const { data, error } = await sb.from('questions').insert(batch).select('id');
    if (error) throw error;
    insertedIds.push(...(data ?? []).map((row) => row.id));
  }

  for (const update of updates) {
    const { error } = await sb
      .from('questions')
      .update({
        ...payload(update.row, update.topicId, update.examSlug, update.topicSlug),
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id);
    if (error) throw error;
    updatedIds.push(update.id);
  }

  const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (adminUser?.id && (insertedIds.length || updatedIds.length)) {
    await sb.from('admin_logs').insert({
      admin_id: adminUser.id,
      action: 'cse_exams_reviewer_2026_import',
      entity_type: 'questions',
      metadata: {
        inserted: insertedIds.length,
        updated: updatedIds.length,
        duplicates: duplicates.length,
        skipped: skipped.length,
        invalid: invalid.length,
        missing_targets: missingTargets.length,
        batch_id: crypto.randomUUID(),
      },
    });
  }
}

const byExam = {};
const byTopic = {};
for (const item of inserts) {
  byExam[item.examSlug] = (byExam[item.examSlug] ?? 0) + 1;
  byTopic[`${item.examSlug}:${item.topicSlug}`] = (byTopic[`${item.examSlug}:${item.topicSlug}`] ?? 0) + 1;
}

const report = {
  dry_run: dryRun,
  source: sourceFile,
  extracted_rows: rows.length,
  ready_rows: readyRows.length,
  skipped_non_ready: skipped.length,
  invalid_ready_rows: invalid.length,
  missing_targets: missingTargets.length,
  existing_questions_before: existing.length,
  insertable: inserts.length,
  updatable_by_source_key: updates.length,
  duplicate_existing_content: duplicates.length,
  inserted: insertedIds.length,
  updated: updatedIds.length,
  insertable_by_exam: byExam,
  insertable_by_topic: byTopic,
  skipped_samples: skipped.slice(0, 50),
  invalid_samples: invalid.slice(0, 50),
  missing_target_samples: missingTargets.slice(0, 50),
  duplicate_samples: duplicates.slice(0, 50),
  update_samples: updates.slice(0, 25).map((update) => ({
    id: update.id,
    source_key: update.sourceKey,
    stem: update.row.Question,
  })),
};

writeFileSync(resolve(root, reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(root, reportFile) }, null, 2));
