#!/usr/bin/env node
import crypto from 'crypto';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourceFile = 'output/pdf/cse_abstract_reasoning_2026_extracted_questions.json';
const reportFile = 'output/pdf/cse_abstract_reasoning_2026_upload_report.json';
const dryRun = process.argv.includes('--dry-run');

const sourceToken = 'cse_abstract_reasoning_2026';
const examSlugs = ['cse-professional', 'cse-subprofessional'];
const subjectSlug = 'abstract';
const bucketName = 'question-images';

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

function sourceKeyFromParts(examSlug, sourcePdf, originalNo) {
  return `${examSlug}|${sourcePdf}|${originalNo}`;
}

function sourceKeyFromNote(note) {
  const match = String(note ?? '').match(/source_key:([^;]+)/);
  return match?.[1]?.trim() ?? '';
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
      const text = row[`Choice ${letter}`] || (letter === 'E' ? row['Choice E if there is'] : '');
      return { id: letter.toLowerCase(), text: String(text ?? '').trim() };
    })
    .filter((choice) => choice.text);
}

function existingContentKey(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const choiceKey = choices
    .map((choice) => `${choice.id ?? ''}:${normalizeText(choice.text)}`)
    .join('|');
  return `${question.topic_id}::${normalizeText(question.stem)}::${choiceKey}::${question.correct_choice_id ?? ''}`;
}

function candidateContentKey(row, topicId) {
  const choiceKey = buildChoices(row)
    .map((choice) => `${choice.id}:${normalizeText(choice.text)}`)
    .join('|');
  return `${topicId}::${normalizeText(row.Question)}::${choiceKey}::${String(row['Correct Answer']).toLowerCase()}`;
}

function contentTypeForPath(path) {
  if (path.toLowerCase().endsWith('.png')) return 'image/png';
  if (path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function sourceNote(row, examSlug) {
  const key = sourceKeyFromParts(examSlug, row['Source PDF'], row['Original No.']);
  return [
    'CSE Abstract Reasoning 2026',
    `source_token:${sourceToken}`,
    `source_key:${key}`,
    `exam:${examSlug}`,
    `page ${row.Page}`,
    row['Source PDF'],
    `original no. ${row['Original No.']}`,
    row.Notes,
  ].filter(Boolean).join('; ').slice(0, 1000);
}

function questionPayload(row, topicId, examSlug, imageUrl) {
  const topicSlug = row['Topic Slug'];
  return {
    topic_id: topicId,
    stem: row.Question,
    choices: buildChoices(row),
    correct_choice_id: String(row['Correct Answer']).toLowerCase(),
    explanation_en:
      String(row.Explanation ?? '').trim() ||
      `Answer key from extracted CSE Abstract Reasoning 2026 PDF: ${row['Correct Answer']}.`,
    explanation_fil: null,
    difficulty: Number(row.Difficulty) || 2,
    status: 'published',
    image_url: imageUrl,
    source: 'pdf_extraction',
    source_note: sourceNote(row, examSlug),
    is_verified: true,
    tags: [
      'cse',
      'pdf-extraction',
      'abstract-reasoning',
      'cse-abstract-reasoning-2026',
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
      .select('id, topic_id, stem, choices, correct_choice_id, source_note, image_url')
      .in('topic_id', topicIds)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

async function uploadImage(sb, row) {
  const imagePath = row['Image Path'];
  if (!imagePath || !existsSync(imagePath)) {
    throw new Error(`Missing image for row ${row['No.']}: ${imagePath || '(blank)'}`);
  }

  const remotePath = `${sourceToken}/${row['Image Reference'] || `${slugify(row['Source PDF'])}-${row['Original No.']}.png`}`;
  const buffer = readFileSync(imagePath);
  const { error } = await sb.storage
    .from(bucketName)
    .upload(remotePath, buffer, { contentType: contentTypeForPath(imagePath), upsert: true });
  if (error) throw new Error(`Storage upload failed for ${remotePath}: ${error.message}`);

  const { data } = sb.storage.from(bucketName).getPublicUrl(remotePath);
  return data.publicUrl;
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
  const areaSlug = topic.subject_areas?.slug;
  if (!examSlugs.includes(examSlug) || areaSlug !== subjectSlug) continue;
  topicMap.set(`${examSlug}:${topic.slug}`, topic.id);
}

for (const examSlug of examSlugs) {
  for (const topicSlug of ['series-completion', 'analogies', 'odd-one-out', 'pattern-completion']) {
    if (!topicMap.has(`${examSlug}:${topicSlug}`)) {
      throw new Error(`Missing CSE topic: ${examSlug}/${subjectSlug}/${topicSlug}`);
    }
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
    notes: row.Notes || '',
  }));

const topicIds = [...new Set(topicMap.values())];
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
const imageUrlByRef = new Map();

for (const row of readyRows) {
  const choices = buildChoices(row);
  const correct = String(row['Correct Answer'] ?? '').toLowerCase();
  if (!row.Question || choices.length < 4 || !choices.some((choice) => choice.id === correct)) {
    invalid.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      reason: 'missing_question_choices_or_answer',
    });
    continue;
  }
  if (row['Has Image'] !== 'Yes' || !row['Image Path'] || !existsSync(row['Image Path'])) {
    invalid.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      reason: 'missing_question_image',
    });
    continue;
  }

  for (const examSlug of examSlugs) {
    const topicId = topicMap.get(`${examSlug}:${row['Topic Slug']}`);
    if (!topicId) {
      invalid.push({
        row: row['No.'],
        source_pdf: row['Source PDF'],
        original_no: row['Original No.'],
        reason: `missing_topic:${examSlug}:${row['Topic Slug']}`,
      });
      continue;
    }

    const sourceKey = sourceKeyFromParts(examSlug, row['Source PDF'], row['Original No.']);
    const existingBySource = existingBySourceKey.get(sourceKey);
    const contentKey = candidateContentKey(row, topicId);

    if (existingBySource) {
      updates.push({ id: existingBySource.id, sourceKey, row, topicId, examSlug });
      plannedByContent.set(contentKey, existingBySource);
      continue;
    }

    const existingByContent = plannedByContent.get(contentKey);
    if (existingByContent) {
      duplicates.push({
        row: row['No.'],
        source_pdf: row['Source PDF'],
        original_no: row['Original No.'],
        exam_slug: examSlug,
        reason: 'duplicate_existing_content',
        existing_id: existingByContent.id,
      });
      continue;
    }

    inserts.push({ sourceKey, row, topicId, examSlug });
    plannedByContent.set(contentKey, { id: null });
  }
}

const insertedIds = [];
const updatedIds = [];
if (!dryRun) {
  const ensureImageUrl = async (row) => {
    const ref = row['Image Reference'];
    if (!imageUrlByRef.has(ref)) imageUrlByRef.set(ref, await uploadImage(sb, row));
    return imageUrlByRef.get(ref);
  };

  const batchSize = 100;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = [];
    for (const insert of inserts.slice(i, i + batchSize)) {
      const imageUrl = await ensureImageUrl(insert.row);
      batch.push(questionPayload(insert.row, insert.topicId, insert.examSlug, imageUrl));
    }
    const { data, error } = await sb.from('questions').insert(batch).select('id');
    if (error) throw error;
    insertedIds.push(...(data ?? []).map((row) => row.id));
  }

  for (const update of updates) {
    const imageUrl = await ensureImageUrl(update.row);
    const payload = questionPayload(update.row, update.topicId, update.examSlug, imageUrl);
    const { error } = await sb
      .from('questions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', update.id);
    if (error) throw error;
    updatedIds.push(update.id);
  }

  const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (adminUser?.id && (insertedIds.length || updatedIds.length)) {
    await sb.from('admin_logs').insert({
      admin_id: adminUser.id,
      action: 'cse_abstract_reasoning_2026_import',
      entity_type: 'questions',
      metadata: {
        inserted: insertedIds.length,
        updated: updatedIds.length,
        skipped: skipped.length,
        duplicates: duplicates.length,
        invalid: invalid.length,
        images_uploaded: imageUrlByRef.size,
        batch_id: crypto.randomUUID(),
      },
    });
  }
}

const byExam = {};
for (const item of inserts) byExam[item.examSlug] = (byExam[item.examSlug] ?? 0) + 1;

const byTopic = {};
for (const item of inserts) {
  const topicSlug = item.row['Topic Slug'];
  byTopic[topicSlug] = (byTopic[topicSlug] ?? 0) + 1;
}

const report = {
  dry_run: dryRun,
  source: sourceFile,
  extracted_rows: rows.length,
  ready_rows: readyRows.length,
  skipped_non_ready: skipped.length,
  invalid_ready_rows: invalid.length,
  existing_abstract_questions_before: existing.length,
  insertable: inserts.length,
  updatable_by_source_key: updates.length,
  duplicate_existing_content: duplicates.length,
  inserted: insertedIds.length,
  updated: updatedIds.length,
  images_uploaded: dryRun ? 0 : imageUrlByRef.size,
  insertable_by_exam: byExam,
  insertable_by_topic: byTopic,
  skipped_samples: skipped.slice(0, 50),
  invalid_samples: invalid.slice(0, 50),
  duplicate_samples: duplicates.slice(0, 50),
  update_samples: updates.slice(0, 25).map((update) => ({
    id: update.id,
    source_key: update.sourceKey,
    stem: update.row.Question,
  })),
};

writeFileSync(resolve(root, reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(root, reportFile) }, null, 2));
