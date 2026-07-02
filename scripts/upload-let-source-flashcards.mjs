#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const sourceFile =
  process.argv.find((arg) => arg.startsWith('--source-file='))?.slice('--source-file='.length) ||
  'output/pdf/let_gened_source_materials_flashcards.json';
const reportFile =
  process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length) ||
  sourceFile.replace(/\.json$/, '_upload_report.json');
const dryRun = process.argv.includes('--dry-run');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(process.cwd(), file), 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')];
        }),
    );
  } catch {
    return {};
  }
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalize(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, ' ');
}

async function fetchAll(sb, table, select, apply) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = sb.from(table).select(select).range(from, from + pageSize - 1);
    if (apply) query = apply(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

if (!existsSync(resolve(process.cwd(), sourceFile))) {
  throw new Error(`Missing source file: ${sourceFile}`);
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
}

const rows = JSON.parse(readFileSync(resolve(process.cwd(), sourceFile), 'utf8'));
const sb = createClient(url, key, { auth: { persistSession: false } });

const catalog = await fetchAll(
  sb,
  'exam_types',
  'slug, subject_areas(slug, topics(id, slug))',
  (query) => query.in('slug', ['let-elementary', 'let-secondary']),
);

const topicByKey = new Map();
for (const exam of catalog) {
  const examKind = exam.slug === 'let-elementary' ? 'elementary' : 'secondary';
  for (const subject of exam.subject_areas ?? []) {
    for (const topic of subject.topics ?? []) {
      topicByKey.set(`${examKind}:${subject.slug}:${topic.slug}`, topic.id);
    }
  }
}

const topicIds = [...new Set([...topicByKey.values()])];
const existing = topicIds.length
  ? await fetchAll(sb, 'flashcards', 'topic_id, front', (query) => query.in('topic_id', topicIds))
  : [];
const existingKeys = new Set(existing.map((row) => `${row.topic_id}:${normalize(row.front)}`));

const inserts = [];
const skipped = [];

for (const row of rows) {
  const exams =
    row.exam_scope === 'secondary'
      ? ['secondary']
      : row.exam_scope === 'elementary'
        ? ['elementary']
        : ['elementary', 'secondary'];

  for (const examKind of exams) {
    const topicId = topicByKey.get(`${examKind}:${row.subject_slug}:${row.topic_slug}`);
    const front = cleanText(row.front);
    const back = cleanText(row.back);
    if (!topicId) {
      skipped.push({ source_file: row.source_file, exam: examKind, reason: 'topic_not_found', target: `${row.subject_slug}/${row.topic_slug}` });
      continue;
    }
    if (front.length < 4 || back.length < 8) {
      skipped.push({ source_file: row.source_file, exam: examKind, reason: 'thin_flashcard' });
      continue;
    }
    const key = `${topicId}:${normalize(front)}`;
    if (existingKeys.has(key)) {
      skipped.push({ source_file: row.source_file, exam: examKind, reason: 'duplicate_front' });
      continue;
    }
    inserts.push({
      topic_id: topicId,
      front,
      back,
      is_premium: Boolean(row.is_premium),
    });
    existingKeys.add(key);
  }
}

let inserted = 0;
if (!dryRun && inserts.length) {
  const batchSize = 500;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const { data, error } = await sb.from('flashcards').insert(inserts.slice(i, i + batchSize)).select('id');
    if (error) throw error;
    inserted += data?.length ?? 0;
  }
}

const report = {
  dry_run: dryRun,
  source: sourceFile,
  source_rows: rows.length,
  insertable_flashcards: inserts.length,
  inserted,
  skipped: skipped.length,
  skipped_by_reason: skipped.reduce((acc, row) => ({ ...acc, [row.reason]: (acc[row.reason] ?? 0) + 1 }), {}),
  skipped_samples: skipped.slice(0, 50),
};

writeFileSync(resolve(process.cwd(), reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(process.cwd(), reportFile) }, null, 2));
