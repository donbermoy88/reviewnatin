import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  parseQuestionImportCsv,
  validateQuestionImportRows,
  buildImportErrorCsv,
} from './lib/question-import.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

const args = process.argv.slice(2);
const publish = args.includes('--publish');
const csvPath = args.find((a) => !a.startsWith('--')) ?? resolve(root, 'templates/questions_import_v1.csv');

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
  process.exit(1);
}

const sb = createClient(url, key);

const csvText = readFileSync(csvPath, 'utf8');
let rows;
try {
  rows = parseQuestionImportCsv(csvText);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

if (!rows.length) {
  console.error('No data rows in CSV.');
  process.exit(1);
}

const { data: catalogRows, error: catalogErr } = await sb
  .from('exam_types')
  .select(`
    slug,
    is_active,
    subject_areas (
      slug,
      topics ( id, slug )
    )
  `)
  .eq('is_active', true);

if (catalogErr) throw catalogErr;

const catalog = new Map();
for (const exam of catalogRows ?? []) {
  const subjectMap = new Map();
  for (const subject of exam.subject_areas ?? []) {
    const topicMap = new Map();
    for (const topic of subject.topics ?? []) {
      topicMap.set(topic.slug, { topicId: topic.id, examActive: exam.is_active });
    }
    subjectMap.set(subject.slug, topicMap);
  }
  catalog.set(exam.slug, subjectMap);
}

const topicIds = [...catalog.values()]
  .flatMap((s) => [...s.values()].flatMap((t) => [...t.values()].map((v) => v.topicId)));

const { data: existingQuestions, error: existingErr } = await sb
  .from('questions')
  .select('topic_id, stem')
  .in('topic_id', topicIds.length ? topicIds : ['00000000-0000-0000-0000-000000000000']);

if (existingErr) throw existingErr;

const existingStemKeysByTopic = new Map();
for (const q of existingQuestions ?? []) {
  const key = q.stem.toLowerCase().replace(/\s+/g, ' ').trim();
  const set = existingStemKeysByTopic.get(q.topic_id) ?? new Set();
  set.add(key);
  existingStemKeysByTopic.set(q.topic_id, set);
}

const { valid, errors } = validateQuestionImportRows(rows, catalog, existingStemKeysByTopic);

if (errors.length) {
  const reportPath = csvPath.replace(/\.csv$/i, '.errors.csv');
  const report = buildImportErrorCsv(errors);
  console.error(`Validation failed: ${errors.length} error(s)`);
  for (const err of errors.slice(0, 20)) {
    console.error(`  row ${err.rowNumber}${err.field ? ` (${err.field})` : ''}: ${err.message}`);
  }
  if (errors.length > 20) console.error(`  … and ${errors.length - 20} more`);
  try {
    const { writeFileSync } = await import('fs');
    writeFileSync(reportPath, report);
    console.error(`\nFull error report: ${reportPath}`);
  } catch {
    /* ignore */
  }
  process.exit(1);
}

const inserts = valid.map((row) => ({
  topic_id: row.topicId,
  stem: row.stem,
  choices: [
    { id: 'a', text: row.choice_a },
    { id: 'b', text: row.choice_b },
    { id: 'c', text: row.choice_c },
    { id: 'd', text: row.choice_d },
  ],
  correct_choice_id: row.correct_choice.toLowerCase(),
  explanation_en: row.explanation_en,
  explanation_fil: row.explanation_fil || null,
  difficulty: row.difficultyNum,
  status: publish ? 'published' : 'draft',
  source: 'csv_import',
  source_note: row.source_note || 'CSV import — ReviewNatin',
  is_verified: publish,
  tags: row.tagsList,
}));

const { data: inserted, error: insertErr } = await sb.from('questions').insert(inserts).select('id');
if (insertErr) throw insertErr;

const batchId = crypto.randomUUID();
const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
if (adminUser?.id) {
  const { error: logErr } = await sb.from('admin_logs').insert({
    admin_id: adminUser.id,
    action: 'csv_import',
    entity_type: 'questions',
    metadata: {
      batch_id: batchId,
      row_count: inserted?.length ?? 0,
      file: csvPath,
      status: publish ? 'published' : 'draft',
    },
  });
  if (logErr) console.warn('admin_logs:', logErr.message);
}

console.log(`✓ Imported ${inserted?.length ?? 0} question(s) as ${publish ? 'published' : 'draft'}`);
console.log(`  Batch ID: ${batchId}`);
