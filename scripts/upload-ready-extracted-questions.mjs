#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split('\n')
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values, index) => {
    const record = { __rowNumber: index + 2 };
    header.forEach((key, i) => {
      record[key] = (values[i] ?? '').trim();
    });
    return record;
  });
}

function normalizeStem(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function correctLetter(value) {
  const match = String(value ?? '').match(/^\s*([A-E])(?:\s*[\.)]|\s*$)/i);
  return match?.[1]?.toLowerCase() ?? '';
}

function difficultyValue(value) {
  const num = Number(value);
  if (Number.isInteger(num) && num >= 1 && num <= 5) return num;
  return 3;
}

function sourceSlug(file) {
  return file
    .replace(/^output\/pdf\//, '')
    .replace(/_extracted_questions_answered\.csv$/, '')
    .replace(/_extracted_questions\.csv$/, '');
}

const SOURCES = [
  'output/pdf/cse_reviewer_subpro_v1_extracted_questions_answered.csv',
  'output/pdf/cse_reviewer_professional_v1_extracted_questions_answered.csv',
  'output/pdf/cse_prof_subpro_practice_test_extracted_questions.csv',
  'output/pdf/cse_math_reviewer_extracted_questions.csv',
];

const force = process.argv.includes('--force');

const SUBJECT_TOPIC = {
  professional: {
    Vocabulary: ['verbal', 'vocabulary'],
    'English Grammar and Correct Usage': ['verbal', 'grammar'],
    'Paragraph Organization': ['verbal', 'paragraph-org'],
    'Reading Comprehension': ['verbal', 'reading-comp'],
    'Verbal Ability': ['verbal', 'verbal-comprehension'],
    'Analytical Ability': ['analytical', 'logic'],
    'Logic and Critical Thinking': ['analytical', 'logic'],
    'Data Interpretation': ['analytical', 'data-interpretation'],
    'Word Problems': ['numerical', 'word-problems'],
    'Numerical Ability': ['numerical', 'basic-operations'],
    'Philippine Constitution': ['general-info', 'constitution'],
    'Code of Conduct and Ethical Standards': ['general-info', 'ra-6713'],
    'Peace and Human Rights': ['general-info', 'peace-human-rights'],
    'Environment Management and Protection': ['general-info', 'environment'],
  },
  subprofessional: {
    Vocabulary: ['verbal', 'vocabulary'],
    'English Grammar and Correct Usage': ['verbal', 'grammar'],
    'Paragraph Organization': ['verbal', 'paragraph-org'],
    'Reading Comprehension': ['verbal', 'reading-comp'],
    'Verbal Ability': ['verbal', 'grammar'],
    Alphabetizing: ['clerical', 'filing-coding'],
    Filing: ['clerical', 'filing-coding'],
    Spelling: ['clerical', 'spelling'],
    'Clerical Ability': ['clerical', 'data-checking'],
    'Word Problems': ['numerical', 'word-problems-sub'],
    'Numerical Ability': ['numerical', 'basic-operations-sub'],
    'Philippine Constitution': ['general-info', 'phil-government'],
    'Code of Conduct and Ethical Standards': ['general-info', 'laws-ethics-sub'],
    'General Information': ['general-info', 'phil-government'],
  },
};

function sectionAwareTopic(row, examKind) {
  const notes = row.Notes ?? '';
  const subject = row['Subject Category'] ?? '';
  if (subject === 'Analytical Ability') {
    if (force && examKind === 'subprofessional') {
      if (/Data Sufficiency/i.test(notes)) return ['numerical', 'word-problems-sub'];
      if (/Single-Word Analogy|Double-Word Analogy/i.test(notes)) return ['verbal', 'vocabulary'];
      if (/Inductive Reasoning/i.test(notes)) return ['abstract', 'series-completion'];
      return ['abstract', 'pattern-completion'];
    }
    if (/Data Sufficiency/i.test(notes)) return ['analytical', 'data-interpretation'];
    if (/Single-Word Analogy|Double-Word Analogy/i.test(notes)) return ['analytical', 'word-association'];
    return ['analytical', 'logic'];
  }
  if (force && subject === 'Alphabetizing' && examKind === 'professional') {
    return ['verbal', 'verbal-comprehension'];
  }
  if (subject === 'General Information' && examKind === 'professional') {
    if (/conduct|ethical|RA\s*6713/i.test(`${notes} ${row.Question ?? ''}`)) return ['general-info', 'ra-6713'];
    if (/constitution/i.test(`${notes} ${row.Question ?? ''}`)) return ['general-info', 'constitution'];
    if (force) return ['general-info', 'constitution'];
  }
  return SUBJECT_TOPIC[examKind]?.[subject] ?? null;
}

function targetExams(row) {
  const type = (row['Exam Type'] ?? '').toLowerCase();
  if (type === 'professional') return ['professional'];
  if (type === 'subprofessional') return ['subprofessional'];
  if (type === 'both') return ['professional', 'subprofessional'];
  if (force && type === 'cannot determine') return ['professional', 'subprofessional'];
  return [];
}

function buildChoices(row) {
  const choices = [];
  for (const [letter, field] of [
    ['a', 'Choice A'],
    ['b', 'Choice B'],
    ['c', 'Choice C'],
    ['d', 'Choice D'],
    ['e', 'Choice E if there is'],
  ]) {
    const text = row[field]?.trim();
    if (text) choices.push({ id: letter, text });
  }
  return choices;
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
  process.exit(1);
}

const sb = createClient(url, key);

const { data: catalogRows, error: catalogErr } = await sb
  .from('exam_types')
  .select('slug, subject_areas(slug, topics(id, slug))')
  .in('slug', ['cse-professional', 'cse-subprofessional']);
if (catalogErr) throw catalogErr;

const topicByKey = new Map();
const topicIds = [];
for (const exam of catalogRows ?? []) {
  const examKind = exam.slug === 'cse-professional' ? 'professional' : 'subprofessional';
  for (const subject of exam.subject_areas ?? []) {
    for (const topic of subject.topics ?? []) {
      topicByKey.set(`${examKind}:${subject.slug}:${topic.slug}`, topic.id);
      topicIds.push(topic.id);
    }
  }
}

async function fetchAllExistingQuestions() {
  const all = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('questions')
      .select('topic_id, stem')
      .in('topic_id', topicIds.length ? topicIds : ['00000000-0000-0000-0000-000000000000'])
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

const existing = await fetchAllExistingQuestions();

const existingByTopic = new Map();
for (const question of existing ?? []) {
  const set = existingByTopic.get(question.topic_id) ?? new Set();
  set.add(normalizeStem(question.stem));
  existingByTopic.set(question.topic_id, set);
}

const candidates = [];
const skipped = [];
const sourceStats = {};

for (const file of SOURCES) {
  if (!existsSync(resolve(root, file))) {
    skipped.push({ source: file, reason: 'file_missing' });
    continue;
  }
  const rows = parseCsv(readFileSync(resolve(root, file), 'utf8'));
  sourceStats[file] = { readyRows: 0, candidateTargets: 0, skipped: 0 };
  for (const row of rows) {
    if (row.Status !== 'Ready for Upload') continue;
    sourceStats[file].readyRows += 1;
    const exams = targetExams(row);
    if (!exams.length) {
      skipped.push({ source: file, row: row['No.'], page: row.Page, reason: 'exam_type_cannot_determine' });
      sourceStats[file].skipped += 1;
      continue;
    }
    const letter = correctLetter(row['Correct Answer']);
    const choices = buildChoices(row);
    if (!letter || !choices.some((choice) => choice.id === letter)) {
      skipped.push({ source: file, row: row['No.'], page: row.Page, reason: 'invalid_correct_answer_or_choice' });
      sourceStats[file].skipped += 1;
      continue;
    }
    if ((row.Question ?? '').trim().length < (force ? 1 : 10)) {
      skipped.push({ source: file, row: row['No.'], page: row.Page, reason: 'question_too_short' });
      sourceStats[file].skipped += 1;
      continue;
    }
    for (const examKind of exams) {
      const mapped = sectionAwareTopic(row, examKind);
      if (!mapped) {
        skipped.push({
          source: file,
          row: row['No.'],
          page: row.Page,
          exam: examKind,
          subject: row['Subject Category'],
          reason: 'topic_mapping_missing',
        });
        sourceStats[file].skipped += 1;
        continue;
      }
      const [subjectSlug, topicSlug] = mapped;
      const topicId = topicByKey.get(`${examKind}:${subjectSlug}:${topicSlug}`);
      if (!topicId) {
        skipped.push({
          source: file,
          row: row['No.'],
          page: row.Page,
          exam: examKind,
          subject: row['Subject Category'],
          target: `${subjectSlug}/${topicSlug}`,
          reason: 'topic_not_in_catalog',
        });
        sourceStats[file].skipped += 1;
        continue;
      }
      candidates.push({ file, row, examKind, topicId, subjectSlug, topicSlug, choices, letter });
      sourceStats[file].candidateTargets += 1;
    }
  }
}

const inserts = [];
const duplicates = [];
for (const candidate of candidates) {
  const keyStem = normalizeStem(candidate.row.Question);
  const set = existingByTopic.get(candidate.topicId) ?? new Set();
  if (set.has(keyStem)) {
    duplicates.push({
      source: candidate.file,
      row: candidate.row['No.'],
      page: candidate.row.Page,
      exam: candidate.examKind,
      topic: `${candidate.subjectSlug}/${candidate.topicSlug}`,
      reason: 'duplicate_existing_stem',
    });
    continue;
  }
  set.add(keyStem);
  existingByTopic.set(candidate.topicId, set);
  inserts.push({
    topic_id: candidate.topicId,
    stem: candidate.row.Question,
    choices: candidate.choices,
    correct_choice_id: candidate.letter,
    explanation_en:
      candidate.row.Explanation?.trim() ||
      `Answer key from extracted PDF: ${candidate.row['Correct Answer']}.`,
    explanation_fil: null,
    difficulty: difficultyValue(candidate.row.Difficulty),
    status: 'published',
    source: 'pdf_extraction',
    source_note: `${sourceSlug(candidate.file)} page ${candidate.row.Page}; ${candidate.row.Notes ?? ''}`.slice(0, 1000),
    is_verified: true,
    tags: [
      'cse',
      'pdf-extraction',
      sourceSlug(candidate.file),
      candidate.row['Subject Category']?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ].filter(Boolean),
  });
}

const insertedIds = [];
const batchSize = 250;
for (let i = 0; i < inserts.length; i += batchSize) {
  const batch = inserts.slice(i, i + batchSize);
  const { data, error } = await sb.from('questions').insert(batch).select('id');
  if (error) throw error;
  insertedIds.push(...(data ?? []).map((row) => row.id));
}

const batchId = crypto.randomUUID();
const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
if (adminUser?.id && insertedIds.length) {
  await sb.from('admin_logs').insert({
    admin_id: adminUser.id,
    action: 'ready_pdf_import',
    entity_type: 'questions',
    metadata: {
      batch_id: batchId,
      inserted: insertedIds.length,
      skipped: skipped.length,
      duplicates: duplicates.length,
      sources: sourceStats,
    },
  });
}

const report = {
  batch_id: batchId,
  force,
  inserted: insertedIds.length,
  candidate_targets: candidates.length,
  skipped: skipped.length,
  duplicates: duplicates.length,
  source_stats: sourceStats,
  skipped_samples: skipped.slice(0, 50),
  duplicate_samples: duplicates.slice(0, 50),
};

const reportPath = resolve(root, force ? 'output/pdf/ready_questions_force_upload_report.json' : 'output/pdf/ready_questions_upload_report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ ...report, report_path: reportPath }, null, 2));
