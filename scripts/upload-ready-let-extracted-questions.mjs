#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SOURCES = [
  'output/pdf/let_elementary_secondary_extracted_questions.csv',
  'output/pdf/let_reviewer_2026_batch2_extracted_questions.csv',
];

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
    .replace(/_extracted_questions\.csv$/, '');
}

function targetExams(row) {
  const type = (row['Exam Type'] ?? '').toLowerCase();
  if (type === 'both') return ['elementary', 'secondary'];
  if (type === 'let elementary') return ['elementary'];
  if (type === 'let secondary') return ['secondary'];
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

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function generalEducationTopic(row) {
  const text = `${row.Question ?? ''} ${row['Choice A'] ?? ''} ${row['Choice B'] ?? ''} ${row['Choice C'] ?? ''} ${row['Choice D'] ?? ''}`.toLowerCase();

  if (hasAny(text, [
    /\b(ano|alin|sino|ang|mga|salitang|wika|pandiwa|pangungusap|tula|panitikan|balagtas|tagalog|filipino|pilipino)\b/i,
  ])) {
    return ['gen-ed', 'filipino'];
  }
  if (hasAny(text, [
    /\b(computer|cpu|ram|keyboard|internet|email|ctrl|software|hardware|printer|scanner|spreadsheet|graphics|network)\b/i,
  ])) {
    return ['gen-ed', 'ict-current-trends'];
  }
  if (hasAny(text, [
    /\b(ecosystem|organism|cell|atom|electron|chemical|photosynthesis|plant|animal|biology|physics|force|energy|volcano|weather|climate|matter|solid|liquid|gas|element|compound)\b/i,
  ])) {
    return ['gen-ed', 'science'];
  }
  if (hasAny(text, [
    /\b(mean|median|fraction|percent|percentage|ratio|triangle|perimeter|area|interest|rate|kilometer|meter|solve|number|sequence|probability|algebra|equation)\b/i,
    /\d+\s*[%/]/,
  ])) {
    return ['gen-ed', 'mathematics'];
  }
  if (hasAny(text, [
    /\b(constitution|government|president|congress|law|republic act|history|philippine|economy|geography|province|continent|democracy|human rights|rizal|bonifacio|magsaysay)\b/i,
  ])) {
    return ['gen-ed', 'social-science'];
  }
  if (hasAny(text, [
    /\b(value|ethics|moral|art|humanities|artist|cultural|culture|religion|philosophy)\b/i,
  ])) {
    return ['gen-ed', 'values-humanities'];
  }

  return ['gen-ed', 'english'];
}

function professionalEducationTopic(row) {
  const text = `${row.Question ?? ''} ${row['Choice A'] ?? ''} ${row['Choice B'] ?? ''} ${row['Choice C'] ?? ''} ${row['Choice D'] ?? ''}`.toLowerCase();

  if (hasAny(text, [/\b(child|children|adolescent|adolescence|development|growth|maturation|piaget|erikson|erickson|freud|puberty|psychosexual)\b/i])) {
    return ['prof-ed', 'child-development'];
  }
  if (hasAny(text, [/\b(vygotsky|bandura|bruner|learning theory|learning theories|motivation|constructivist|behaviorism|cognitive|intelligence|scaffold|zpd|conditioning)\b/i])) {
    return ['prof-ed', 'facilitating-learning'];
  }
  if (hasAny(text, [/\b(assessment|test|testing|evaluation|validity|reliability|tos|table of specification|scoring|rubric|norm-referenced|criterion|quiz|essay question|item analysis)\b/i])) {
    return ['prof-ed', 'assessment-of-learning'];
  }
  if (hasAny(text, [/\b(curriculum|k-12|k to 12|spiral|lesson objective|learning objective|syllabus|subject matter|tyler|ubd)\b/i])) {
    return ['prof-ed', 'curriculum-development'];
  }
  if (hasAny(text, [/\b(media|technology|instructional material|audiovisual|audio-visual|cone of experience|edgar dale|computer-assisted|educational technology)\b/i])) {
    return ['prof-ed', 'educational-technology'];
  }
  if (hasAny(text, [/\b(classroom management|discipline|punishment|authority|misbehavior|routine|rules|behavior problem)\b/i])) {
    return ['prof-ed', 'classroom-management'];
  }
  if (hasAny(text, [/\b(let passer|licensure|professional oath|teacher profession|code of ethics|ra 7836|board for professional teachers|prc|license)\b/i])) {
    return ['prof-ed', 'teaching-profession'];
  }
  if (hasAny(text, [/\b(social dimension|community|society|social justice|human rights|peace education|multicultural|culture|school-community)\b/i])) {
    return ['prof-ed', 'social-dimensions'];
  }
  if (hasAny(text, [/\b(special education|inclusive|disability|disabled|indigenous|exceptional learner|mainstream)\b/i])) {
    return ['prof-ed', 'inclusive-education'];
  }

  return ['prof-ed', 'principles-of-teaching'];
}

function mappedTopic(row) {
  const category = row['Subject Category'] ?? '';
  const source = `${row['Source PDF'] ?? ''} ${row.source_slug ?? ''}`.toLowerCase();

  if (category === 'Child and Adolescent Development') return ['prof-ed', 'child-development'];
  if (category === 'Facilitating Learning') return ['prof-ed', 'facilitating-learning'];
  if (category === 'Professional Education') return professionalEducationTopic(row);
  if (category === 'Filipino') return ['gen-ed', 'filipino'];
  if (category === 'General Education') return generalEducationTopic(row);
  if (category === 'General/Professional Education') {
    if (/prof|professional|teaching|teacher|curriculum|assessment|learning|classroom/.test(source)) {
      return professionalEducationTopic(row);
    }
    const text = `${row.Question ?? ''}`.toLowerCase();
    if (hasAny(text, [/\b(teacher|student|learner|classroom|curriculum|assessment|learning|instruction|school|lesson)\b/i])) {
      return professionalEducationTopic(row);
    }
    return generalEducationTopic(row);
  }

  return null;
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
  .in('slug', ['let-elementary', 'let-secondary']);
if (catalogErr) throw catalogErr;

const topicByKey = new Map();
const topicIds = [];
for (const exam of catalogRows ?? []) {
  const examKind = exam.slug === 'let-elementary' ? 'elementary' : 'secondary';
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

const existingByTopic = new Map();
for (const question of await fetchAllExistingQuestions()) {
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
      skipped.push({ source: file, row: row['No.'], page: row.Page, reason: 'exam_type_unmapped' });
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
    if ((row.Question ?? '').trim().length < 10) {
      skipped.push({ source: file, row: row['No.'], page: row.Page, reason: 'question_too_short' });
      sourceStats[file].skipped += 1;
      continue;
    }

    const mapped = mappedTopic(row);
    if (!mapped) {
      skipped.push({ source: file, row: row['No.'], page: row.Page, subject: row['Subject Category'], reason: 'topic_mapping_missing' });
      sourceStats[file].skipped += 1;
      continue;
    }

    const [subjectSlug, topicSlug] = mapped;
    for (const examKind of exams) {
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
      `Answer key from extracted LET PDF: ${candidate.row['Correct Answer']}.`,
    explanation_fil: null,
    difficulty: difficultyValue(candidate.row.Difficulty),
    status: 'published',
    source: 'pdf_extraction',
    source_note: `${sourceSlug(candidate.file)} page ${candidate.row.Page}; ${candidate.row['Source PDF'] ?? ''}; ${candidate.row.Notes ?? ''}`.slice(0, 1000),
    is_verified: true,
    tags: [
      'let',
      'pdf-extraction',
      candidate.examKind === 'elementary' ? 'let-elementary' : 'let-secondary',
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
    action: 'ready_let_pdf_import',
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
  inserted: insertedIds.length,
  candidate_targets: candidates.length,
  skipped: skipped.length,
  duplicates: duplicates.length,
  source_stats: sourceStats,
  skipped_samples: skipped.slice(0, 50),
  duplicate_samples: duplicates.slice(0, 50),
};

const reportPath = resolve(root, 'output/pdf/let_ready_questions_upload_report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ ...report, report_path: reportPath }, null, 2));
