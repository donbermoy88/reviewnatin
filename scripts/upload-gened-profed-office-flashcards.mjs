#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const dryRun = process.argv.includes('--dry-run');
const sourceToken = 'gened_profed_office_sept2026';
const reportPath = 'output/pdf/gened_profed_office_flashcards_upload_report.json';

function loadEnv(file) {
  return Object.fromEntries(
    readFileSync(resolve(process.cwd(), file), 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return cleanText(value).toLowerCase();
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

const env = { ...loadEnv('.env.supabase'), ...process.env };
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const questions = await fetchAll(
  sb,
  'questions',
  'id, topic_id, stem, choices, correct_choice_id, explanation_en, source_note',
  (query) => query.ilike('source_note', `%${sourceToken}%`),
);

const topicIds = [...new Set(questions.map((question) => question.topic_id).filter(Boolean))];
const existingFlashcards = topicIds.length
  ? await fetchAll(sb, 'flashcards', 'topic_id, front', (query) => query.in('topic_id', topicIds))
  : [];

const existingFronts = new Set(existingFlashcards.map((card) => `${card.topic_id}:${normalize(card.front)}`));
const candidates = [];
const skipped = [];

for (const question of questions) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const correctId = cleanText(question.correct_choice_id);
  const correctChoice = choices.find((choice) => cleanText(choice.id) === correctId);
  const stem = cleanText(question.stem);
  const answerText = cleanText(correctChoice?.text);
  if (!question.topic_id || stem.length < 12 || !correctId || !answerText) {
    skipped.push({ question_id: question.id, reason: 'missing_topic_stem_or_answer' });
    continue;
  }

  const front = `LET reviewer question: ${stem}`;
  const back = cleanText(
    `Correct answer: ${correctId.toUpperCase()}. ${answerText}. Source: ${question.source_note ?? sourceToken}`,
  );
  if (back.length < 20) {
    skipped.push({ question_id: question.id, reason: 'thin_back' });
    continue;
  }

  const key = `${question.topic_id}:${normalize(front)}`;
  if (existingFronts.has(key)) {
    skipped.push({ question_id: question.id, reason: 'duplicate_flashcard_front' });
    continue;
  }

  candidates.push({
    topic_id: question.topic_id,
    front,
    back,
    is_premium: false,
  });
  existingFronts.add(key);
}

let inserted = 0;
if (!dryRun && candidates.length) {
  const batchSize = 500;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const { error, data } = await sb.from('flashcards').insert(candidates.slice(i, i + batchSize)).select('id');
    if (error) throw error;
    inserted += data?.length ?? 0;
  }
}

const report = {
  dry_run: dryRun,
  source_token: sourceToken,
  source_questions: questions.length,
  insertable_flashcards: candidates.length,
  inserted,
  skipped: skipped.length,
  skipped_by_reason: skipped.reduce((acc, row) => ({ ...acc, [row.reason]: (acc[row.reason] ?? 0) + 1 }), {}),
  skipped_samples: skipped.slice(0, 50),
};
writeFileSync(resolve(process.cwd(), reportPath), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(process.cwd(), reportPath) }, null, 2));
