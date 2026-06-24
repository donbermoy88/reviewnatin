#!/usr/bin/env node
import crypto from 'crypto';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourceFile = 'output/pdf/bsed_caed_sept2026_extracted_questions.json';
const reportFile = 'output/pdf/bsed_caed_sept2026_upload_report.json';
const dryRun = process.argv.includes('--dry-run');

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

function sourceKeyFromParts(sourcePdf, originalNo) {
  return `${sourcePdf}#${originalNo}`;
}

function sourceKeyFromNote(note) {
  const sourcePdf = String(note ?? '').match(/(BSED CAEd P\d+\.pdf)/)?.[1];
  const originalNo = String(note ?? '').match(/original no\.?\s*(\d+)/i)?.[1];
  return sourcePdf && originalNo ? sourceKeyFromParts(sourcePdf, originalNo) : '';
}

function existingContentKey(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const choiceKey = choices
    .map((choice) => `${choice.id ?? ''}:${normalizeText(choice.text)}`)
    .join('|');
  return `${normalizeText(question.stem)}::${choiceKey}::${question.correct_choice_id ?? ''}`;
}

function candidateContentKey(row) {
  const choiceKey = ['A', 'B', 'C', 'D', 'E']
    .map((letter) => ({ letter, text: row[`Choice ${letter}`] }))
    .filter((choice) => normalizeText(choice.text))
    .map((choice) => `${choice.letter.toLowerCase()}:${normalizeText(choice.text)}`)
    .join('|');
  return `${normalizeText(row.Question)}::${choiceKey}::${String(row['Correct Answer']).toLowerCase()}`;
}

function buildChoices(row) {
  return ['A', 'B', 'C', 'D', 'E']
    .map((letter) => ({ id: letter.toLowerCase(), text: row[`Choice ${letter}`]?.trim() ?? '' }))
    .filter((choice) => choice.text);
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function questionPayload(row, topicId) {
  const detailSlug = slugify(row.Topic || 'culture-and-arts-education');
  return {
    topic_id: topicId,
    stem: row.Question,
    choices: buildChoices(row),
    correct_choice_id: String(row['Correct Answer']).toLowerCase(),
    explanation_en:
      row.Explanation?.trim() ||
      `Answer key from extracted BSED Culture and Arts Education PDF: ${row['Correct Answer']}.`,
    explanation_fil: null,
    difficulty: Number(row.Difficulty) || 3,
    status: 'published',
    image_url: null,
    source: 'pdf_extraction',
    source_note: [
      `bsed_caed_sept2026 row ${row['No.']}`,
      `page ${row.Page}`,
      row['Source PDF'],
      `original no. ${row['Original No.']}`,
      row.Notes,
    ].filter(Boolean).join('; ').slice(0, 1000),
    is_verified: true,
    tags: [
      'let',
      'pdf-extraction',
      'sept2026',
      'let-secondary',
      'major:culture-and-arts-education',
      'culture-and-arts-education',
      'bsed-caed',
      `topic:${detailSlug}`,
    ],
    major: 'Culture and Arts Education',
    major_slug: 'culture-and-arts-education',
    sub_tag: row.Topic || 'Culture and Arts Education',
    sub_tag_slug: detailSlug,
    exam_level: 'LET Secondary',
    exam_area: 'Area of Specialization',
    taxonomy_version: 'LET_SECONDARY_MAJOR_TAXONOMY_2026',
    needs_review: false,
    review_reason: null,
  };
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

async function ensureCultureAndArtsTopic() {
  const { data: subjectArea, error: subjectAreaError } = await sb
    .from('subject_areas')
    .select('id, exam_types!inner(slug)')
    .eq('slug', 'major')
    .eq('exam_types.slug', 'let-secondary')
    .maybeSingle();
  if (subjectAreaError) throw subjectAreaError;
  if (!subjectArea?.id) throw new Error('Missing LET Secondary major subject area');

  const { data: existing, error: existingError } = await sb
    .from('topics')
    .select('id')
    .eq('subject_area_id', subjectArea.id)
    .eq('slug', 'culture-and-arts-education')
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) {
    const { error: updateError } = await sb
      .from('topics')
      .update({ name: 'Culture and Arts Education', sort_order: 6 })
      .eq('id', existing.id);
    if (updateError) throw updateError;
    await shiftFollowingMajorSortOrders(subjectArea.id);
    return existing;
  }

  const { data: inserted, error: insertError } = await sb
    .from('topics')
    .insert({
      subject_area_id: subjectArea.id,
      slug: 'culture-and-arts-education',
      name: 'Culture and Arts Education',
      sort_order: 6,
    })
    .select('id')
    .single();
  if (insertError) throw insertError;
  await shiftFollowingMajorSortOrders(subjectArea.id);
  return inserted;
}

async function shiftFollowingMajorSortOrders(subjectAreaId) {
  const nextOrders = new Map([
    ['biological-science', 7],
    ['physical-science', 8],
    ['values-education', 9],
    ['mapeh', 10],
    ['tle', 11],
  ]);
  for (const [slug, sortOrder] of nextOrders.entries()) {
    const { error } = await sb
      .from('topics')
      .update({ sort_order: sortOrder })
      .eq('subject_area_id', subjectAreaId)
      .eq('slug', slug);
    if (error) throw error;
  }
}

const topic = await ensureCultureAndArtsTopic();
if (!topic?.id) throw new Error('Missing LET Secondary major/culture-and-arts-education topic');

async function fetchExistingQuestions() {
  const all = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('questions')
      .select('id, topic_id, stem, choices, correct_choice_id, source_note')
      .eq('topic_id', topic.id)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

const existing = await fetchExistingQuestions();
const existingBySourceKey = new Map();
const existingByContentKey = new Map();
for (const question of existing) {
  const sourceKey = sourceKeyFromNote(question.source_note);
  if (sourceKey) existingBySourceKey.set(sourceKey, question);
  existingByContentKey.set(existingContentKey(question), question);
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
    duplicate_of: row['Duplicate Of'] || '',
    notes: row.Notes || '',
  }));

const inserts = [];
const updates = [];
const duplicates = [];
const duplicateSourceArchives = [];
const plannedByContent = new Map(existingByContentKey);

for (const row of rows.filter((item) => item.Status === 'Duplicate')) {
  const sourceKey = sourceKeyFromParts(row['Source PDF'], row['Original No.']);
  const existingBySource = existingBySourceKey.get(sourceKey);
  if (existingBySource) {
    duplicateSourceArchives.push({
      id: existingBySource.id,
      sourceKey,
      row,
      duplicateOf: row['Duplicate Of'] || '',
    });
  }
}

for (const row of readyRows) {
  const sourceKey = sourceKeyFromParts(row['Source PDF'], row['Original No.']);
  const payload = questionPayload(row, topic.id);
  const existingBySource = existingBySourceKey.get(sourceKey);
  if (existingBySource) {
    updates.push({ id: existingBySource.id, sourceKey, row, payload });
    plannedByContent.set(candidateContentKey(row), { id: existingBySource.id });
    continue;
  }

  const contentKey = candidateContentKey(row);
  const existingByContent = plannedByContent.get(contentKey);
  if (existingByContent) {
    duplicates.push({
      row: row['No.'],
      source_pdf: row['Source PDF'],
      original_no: row['Original No.'],
      reason: 'duplicate_existing_content',
      existing_id: existingByContent.id,
    });
    continue;
  }

  inserts.push(payload);
  plannedByContent.set(contentKey, { id: null });
}

const insertedIds = [];
const updatedIds = [];
if (!dryRun) {
  const batchSize = 250;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    const { data, error } = await sb.from('questions').insert(batch).select('id');
    if (error) throw error;
    insertedIds.push(...(data ?? []).map((row) => row.id));
  }

  for (const update of updates) {
    const { error } = await sb
      .from('questions')
      .update({ ...update.payload, updated_at: new Date().toISOString() })
      .eq('id', update.id);
    if (error) throw error;
    updatedIds.push(update.id);
  }

  for (const duplicate of duplicateSourceArchives) {
    const { error } = await sb
      .from('questions')
      .update({
        status: 'archived',
        needs_review: true,
        review_reason: `Duplicate of extracted Culture and Arts Education row ${duplicate.duplicateOf || 'unknown'}.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', duplicate.id);
    if (error) throw error;
  }

  const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (adminUser?.id && (insertedIds.length || updatedIds.length)) {
    await sb.from('admin_logs').insert({
      admin_id: adminUser.id,
      action: 'bsed_caed_sept2026_import',
      entity_type: 'questions',
      metadata: {
        inserted: insertedIds.length,
        updated: updatedIds.length,
        archived_duplicate_sources: duplicateSourceArchives.length,
        skipped: skipped.length,
        duplicates: duplicates.length,
        batch_id: crypto.randomUUID(),
      },
    });
  }
}

const report = {
  dry_run: dryRun,
  source: sourceFile,
  extracted_rows: rows.length,
  ready_rows: readyRows.length,
  source_duplicates_or_non_ready_skipped: skipped.length,
  existing_culture_and_arts_education_questions_before: existing.length,
  insertable: inserts.length,
  updatable_by_source_key: updates.length,
  archivable_duplicate_sources: duplicateSourceArchives.length,
  duplicate_existing_content: duplicates.length,
  inserted: insertedIds.length,
  updated: updatedIds.length,
  archived_duplicate_sources: dryRun ? 0 : duplicateSourceArchives.length,
  skipped_samples: skipped.slice(0, 100),
  duplicate_samples: duplicates.slice(0, 50),
  archived_duplicate_samples: duplicateSourceArchives.slice(0, 25).map((duplicate) => ({
    id: duplicate.id,
    source_key: duplicate.sourceKey,
    duplicate_of: duplicate.duplicateOf,
    stem: duplicate.row.Question,
  })),
  update_samples: updates.slice(0, 25).map((update) => ({ id: update.id, source_key: update.sourceKey, stem: update.row.Question })),
};

writeFileSync(resolve(root, reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(root, reportFile) }, null, 2));
