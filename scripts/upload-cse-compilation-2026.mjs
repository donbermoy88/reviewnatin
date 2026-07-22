#!/usr/bin/env node
import crypto from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = process.argv.find((arg) => arg.startsWith('--source-file='))?.slice('--source-file='.length)
  || 'output/pdf/cse_compilation_2026_extracted_questions.json';
const reportFile = process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length)
  || 'output/pdf/cse_compilation_2026_upload_report.json';
const dryRun = process.argv.includes('--dry-run');
const sourceToken = 'cse_compilation_2026';

function loadEnv(file) {
  try {
    return Object.fromEntries(readFileSync(resolve(root, file), 'utf8').split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
  } catch { return {}; }
}

function clean(value) { return String(value ?? '').replace(/\u0000/g, '').replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/[ \t]{2,}/g, ' ').trim(); }
function normalize(value) { return clean(value).toLowerCase().replace(/\s+/g, ' '); }
function choicesFor(row) {
  return ['A', 'B', 'C', 'D', 'E'].map((letter) => ({ id: letter.toLowerCase(), text: clean(row[`Choice ${letter}`]) })).filter((choice) => choice.text);
}
function choiceKey(choices) { return choices.map((choice) => `${choice.id}:${normalize(choice.text)}`).join('|'); }
function sourceKey(row, examSlug, topicSlug) {
  const raw = `${sourceToken}|${examSlug}|${topicSlug}|${row['Source Path']}|${row['Original No.']}|${row.Page}|${normalize(row.Question)}`;
  return `${sourceToken}:${crypto.createHash('sha256').update(raw).digest('hex')}`;
}
function sourceKeyFromNote(note) { return String(note ?? '').match(/source_key:([^;]+)/)?.[1]?.trim() ?? ''; }

const PRO = 'cse-professional';
const SUB = 'cse-subprofessional';
const sharedVerbal = new Set(['grammar', 'vocabulary', 'paragraph-org', 'reading-comp', 'vocabulary-fil', 'grammar-fil', 'reading-comp-fil', 'paragraph-org-fil']);
const sharedAbstract = new Set(['pattern-completion', 'series-completion', 'analogies', 'odd-one-out']);
const proOnly = new Set(['verbal-comprehension', 'word-association', 'assumptions-conclusions', 'logic', 'data-interpretation', 'constitution', 'ra-6713', 'peace-human-rights', 'environment']);
const subOnly = new Set(['filing-coding', 'data-checking', 'spelling', 'phil-government']);

function mappedTopic(baseTopic, examSlug) {
  if (sharedVerbal.has(baseTopic) || sharedAbstract.has(baseTopic)) return baseTopic;
  if (examSlug === PRO) {
    if (baseTopic === 'basic-operations' || baseTopic === 'number-series' || baseTopic === 'word-problems') return baseTopic;
    if (baseTopic === 'phil-government') return 'constitution';
    if (proOnly.has(baseTopic)) return baseTopic;
    return '';
  }
  if (baseTopic === 'basic-operations') return 'basic-operations-sub';
  if (baseTopic === 'number-series') return 'number-series-sub';
  if (baseTopic === 'word-problems') return 'word-problems-sub';
  if (['ra-6713', 'peace-human-rights', 'environment'].includes(baseTopic)) return 'laws-ethics-sub';
  if (baseTopic === 'constitution') return 'phil-government';
  if (subOnly.has(baseTopic)) return baseTopic;
  return '';
}

function targetsFor(row) {
  const scope = clean(row['CSE Exam Type']).toLowerCase();
  const exams = scope === 'professional' ? [PRO] : scope === 'subprofessional' ? [SUB] : [PRO, SUB];
  return exams.map((examSlug) => ({ examSlug, topicSlug: mappedTopic(clean(row.Topic), examSlug) })).filter((target) => target.topicSlug);
}

async function fetchAll(sb, table, select, apply) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let query = sb.from(table).select(select).range(from, from + 999);
    if (apply) query = apply(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
if (!existsSync(resolve(root, sourceFile))) throw new Error(`Missing source file: ${sourceFile}`);

const sb = createClient(url, key, { auth: { persistSession: false } });
const rows = JSON.parse(readFileSync(resolve(root, sourceFile), 'utf8'));
const { data: catalog, error: catalogError } = await sb.from('exam_types').select('slug, subject_areas(topics(id,slug))').in('slug', [PRO, SUB]);
if (catalogError) throw catalogError;
const topicMap = new Map();
for (const exam of catalog ?? []) for (const subject of exam.subject_areas ?? []) for (const topic of subject.topics ?? []) topicMap.set(`${exam.slug}:${topic.slug}`, topic.id);
const topicIds = [...new Set(topicMap.values())];

const existingQuestions = await fetchAll(sb, 'questions', 'id,topic_id,stem,choices,correct_choice_id,source_note', (query) => query.in('topic_id', topicIds));
const bySourceKey = new Map();
const questionContent = new Map();
for (const question of existingQuestions) {
  const keyFromNote = sourceKeyFromNote(question.source_note);
  if (keyFromNote) bySourceKey.set(keyFromNote, question);
  questionContent.set(`${question.topic_id}::${normalize(question.stem)}::${choiceKey(Array.isArray(question.choices) ? question.choices : [])}::${question.correct_choice_id}`, question);
}

const readyRows = rows.filter((row) => row.Status === 'Ready for Upload');
const skipped = rows.filter((row) => row.Status !== 'Ready for Upload').map((row) => ({ row: row['No.'], status: row.Status, source: row['Source PDF'] }));
const inserts = [];
const updates = [];
const duplicates = [];
const invalid = [];
const missingTargets = [];
const validatedTargets = [];

for (const row of readyRows) {
  const choices = choicesFor(row);
  const correct = clean(row['Correct Answer']).toLowerCase();
  if (!clean(row.Question) || choices.length < 4 || !choices.some((choice) => choice.id === correct) || new Set(choices.map((choice) => normalize(choice.text))).size !== choices.length) {
    invalid.push({ row: row['No.'], source: row['Source PDF'], reason: 'invalid_question_choices_or_answer' });
    continue;
  }
  const targets = targetsFor(row);
  if (!targets.length) {
    missingTargets.push({ row: row['No.'], source: row['Source PDF'], scope: row['CSE Exam Type'], topic: row.Topic, reason: 'no_compatible_exam_topic' });
    continue;
  }
  for (const target of targets) {
    const topicId = topicMap.get(`${target.examSlug}:${target.topicSlug}`);
    if (!topicId) {
      missingTargets.push({ row: row['No.'], source: row['Source PDF'], ...target, reason: 'topic_not_in_catalog' });
      continue;
    }
    const rowSourceKey = sourceKey(row, target.examSlug, target.topicSlug);
    const existingBySource = bySourceKey.get(rowSourceKey);
    const contentKey = `${topicId}::${normalize(row.Question)}::${choiceKey(choices)}::${correct}`;
    const validatedItem = { row, choices, correct, topicId, rowSourceKey, ...target };
    validatedTargets.push(validatedItem);
    if (existingBySource) {
      updates.push({ ...validatedItem, id: existingBySource.id });
      questionContent.set(contentKey, existingBySource);
    } else if (questionContent.has(contentKey)) {
      duplicates.push({ row: row['No.'], source: row['Source PDF'], ...target, existing_id: questionContent.get(contentKey).id });
    } else {
      inserts.push(validatedItem);
      questionContent.set(contentKey, { id: null });
    }
  }
}

function questionPayload(item) {
  const row = item.row;
  return {
    topic_id: item.topicId,
    stem: clean(row.Question),
    choices: item.choices,
    correct_choice_id: item.correct,
    explanation_en: clean(row.Explanation) || `Correct answer from the source answer key: ${clean(row['Correct Answer'])}.`,
    explanation_fil: null,
    difficulty: Number(row.Difficulty) >= 1 && Number(row.Difficulty) <= 5 ? Number(row.Difficulty) : 3,
    status: 'published',
    image_url: null,
    source: 'mixed_source_extraction',
    source_note: `CSE Reviewers 2026 compilation; source_token:${sourceToken}; source_key:${item.rowSourceKey}; ${clean(row['Source PDF'])}; page ${clean(row.Page)}; original no. ${clean(row['Original No.'])}; ${clean(row.Notes)}`.slice(0, 1000),
    is_verified: true,
    tags: ['cse', 'mixed-source-extraction', 'cse-compilation-2026', item.examSlug, `topic:${item.topicSlug}`],
    needs_review: false,
    review_reason: null,
  };
}

const insertedQuestionIds = [];
const updatedQuestionIds = [];
if (!dryRun) {
  for (let index = 0; index < inserts.length; index += 250) {
    const { data, error } = await sb.from('questions').insert(inserts.slice(index, index + 250).map(questionPayload)).select('id');
    if (error) throw error;
    insertedQuestionIds.push(...(data ?? []).map((row) => row.id));
  }
  for (let index = 0; index < updates.length; index += 100) {
    const batch = updates.slice(index, index + 100);
    for (const item of batch) {
      const { error } = await sb.from('questions').update({ ...questionPayload(item), updated_at: new Date().toISOString() }).eq('id', item.id);
      if (error) throw error;
      updatedQuestionIds.push(item.id);
    }
  }
}

const existingFlashcards = await fetchAll(sb, 'flashcards', 'topic_id,front', (query) => query.in('topic_id', topicIds));
const flashcardKeys = new Set(existingFlashcards.map((card) => `${card.topic_id}:${normalize(card.front)}`));
const flashcardCandidates = [];
for (const item of validatedTargets) {
  const keyValue = `${item.topicId}:${normalize(item.row.Question)}`;
  if (flashcardKeys.has(keyValue)) continue;
  const correctChoice = item.choices.find((choice) => choice.id === item.correct)?.text ?? item.correct.toUpperCase();
  flashcardKeys.add(keyValue);
  flashcardCandidates.push({ topic_id: item.topicId, front: clean(item.row.Question), back: `${correctChoice}${clean(item.row.Explanation) ? `\n\n${clean(item.row.Explanation)}` : ''}\n\nSource: ${clean(item.row['Source PDF'])}`.slice(0, 12000), is_premium: false });
}
const insertedFlashcardIds = [];
if (!dryRun) {
  for (let index = 0; index < flashcardCandidates.length; index += 500) {
    const { data, error } = await sb.from('flashcards').insert(flashcardCandidates.slice(index, index + 500)).select('id');
    if (error) throw error;
    insertedFlashcardIds.push(...(data ?? []).map((row) => row.id));
  }
}

if (!dryRun && (insertedQuestionIds.length || updatedQuestionIds.length || insertedFlashcardIds.length)) {
  const { data: admin } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (admin?.id) await sb.from('admin_logs').insert({ admin_id: admin.id, action: 'cse_compilation_2026_import', entity_type: 'questions', metadata: { batch_id: crypto.randomUUID(), questions_inserted: insertedQuestionIds.length, questions_updated: updatedQuestionIds.length, flashcards_inserted: insertedFlashcardIds.length, duplicates: duplicates.length, skipped: skipped.length } });
}

const countBy = (items, keyFn) => items.reduce((acc, item) => { const keyValue = keyFn(item); acc[keyValue] = (acc[keyValue] ?? 0) + 1; return acc; }, {});
const report = {
  dry_run: dryRun,
  source: sourceFile,
  extracted_rows: rows.length,
  ready_rows: readyRows.length,
  skipped_non_ready: skipped.length,
  invalid_ready_rows: invalid.length,
  missing_targets: missingTargets.length,
  existing_questions_before: existingQuestions.length,
  insertable_questions: inserts.length,
  updatable_questions: updates.length,
  duplicate_existing_content: duplicates.length,
  inserted_questions: insertedQuestionIds.length,
  updated_questions: updatedQuestionIds.length,
  insertable_flashcards: flashcardCandidates.length,
  inserted_flashcards: insertedFlashcardIds.length,
  insertable_by_exam: countBy(inserts, (item) => item.examSlug),
  insertable_by_topic: countBy(inserts, (item) => `${item.examSlug}/${item.topicSlug}`),
  invalid_samples: invalid.slice(0, 50),
  missing_target_samples: missingTargets.slice(0, 50),
  duplicate_samples: duplicates.slice(0, 50),
};
writeFileSync(resolve(root, reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(root, reportFile) }, null, 2));
