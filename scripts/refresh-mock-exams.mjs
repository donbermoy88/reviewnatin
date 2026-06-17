#!/usr/bin/env node
/**
 * Refresh mock exams after seeding/importing questions.
 * - Updates Mini Mock (5 Q) per exam
 * - Creates CSE Professional Practice Mock (20 Q) when enough questions exist
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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
          return [l.slice(0, i), l.slice(i + 1)];
        })
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env') };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const sb = createClient(url, key);
const focusSlug = process.argv[2] ?? 'cse-professional';

async function publishedQuestionIds(examTypeId, limit) {
  const { data: subjects, error: subErr } = await sb
    .from('subject_areas')
    .select('id')
    .eq('exam_type_id', examTypeId);

  if (subErr) throw subErr;
  const subjectIds = (subjects ?? []).map((s) => s.id);
  if (!subjectIds.length) return [];

  const { data: topics, error: topErr } = await sb
    .from('topics')
    .select('id')
    .in('subject_area_id', subjectIds);

  if (topErr) throw topErr;
  const topicIds = (topics ?? []).map((t) => t.id);
  if (!topicIds.length) return [];

  const { data: questions, error: qErr } = await sb
    .from('questions')
    .select('id')
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (qErr) throw qErr;
  return (questions ?? []).map((q) => q.id);
}

async function replaceMockQuestions(mockExamId, questionIds) {
  await sb.from('mock_exam_questions').delete().eq('mock_exam_id', mockExamId);
  if (!questionIds.length) return;

  const rows = questionIds.map((questionId, i) => ({
    mock_exam_id: mockExamId,
    question_id: questionId,
    sort_order: i + 1,
  }));

  const { error } = await sb.from('mock_exam_questions').insert(rows);
  if (error) throw error;
}

async function ensureMockExam(examTypeId, title, itemCount, durationSeconds) {
  const { data: existing } = await sb
    .from('mock_exams')
    .select('id, item_count')
    .eq('exam_type_id', examTypeId)
    .eq('title', title)
    .maybeSingle();

  if (existing?.id) {
    if (existing.item_count !== itemCount) {
      await sb.from('mock_exams').update({ item_count: itemCount, duration_seconds: durationSeconds }).eq('id', existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await sb
    .from('mock_exams')
    .insert({
      exam_type_id: examTypeId,
      title,
      item_count: itemCount,
      duration_seconds: durationSeconds,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

const { data: exams, error: examsErr } = await sb
  .from('exam_types')
  .select('id, slug, name')
  .eq('is_active', true)
  .order('name');

if (examsErr) throw examsErr;

for (const exam of exams ?? []) {
  if (focusSlug !== 'all' && exam.slug !== focusSlug) continue;

  const miniCount = 5;
  const miniIds = await publishedQuestionIds(exam.id, miniCount);
  const miniTitle = `${exam.name} — Mini Mock`;
  const miniMockId = await ensureMockExam(exam.id, miniTitle, Math.min(miniCount, miniIds.length), 600);
  await replaceMockQuestions(miniMockId, miniIds.slice(0, miniCount));
  console.log(`✓ ${exam.slug} mini mock: ${Math.min(miniCount, miniIds.length)} questions`);

  if (exam.slug === 'cse-professional') {
    const practiceCount = 20;
    const practiceIds = await publishedQuestionIds(exam.id, practiceCount);
    if (practiceIds.length >= 10) {
      const count = Math.min(practiceCount, practiceIds.length);
      const practiceTitle = 'CSE Professional — Practice Mock';
      const practiceMockId = await ensureMockExam(exam.id, practiceTitle, count, 2400);
      await replaceMockQuestions(practiceMockId, practiceIds.slice(0, count));
      console.log(`✓ ${exam.slug} practice mock: ${count} questions`);
    } else {
      console.log(`  (skip practice mock — need at least 10 published questions, have ${practiceIds.length})`);
    }
  }

  // Full Length Mock — populate existing full-length rows that were created with
  // item_count set but never linked to questions. Without this, premium users
  // who start the full mock hit an empty "Wala pang tanong dito" screen.
  const fullTitle = `${exam.name} — Full Length Mock`;
  const { data: fullMock } = await sb
    .from('mock_exams')
    .select('id, item_count')
    .eq('exam_type_id', exam.id)
    .eq('title', fullTitle)
    .maybeSingle();
  if (fullMock?.id) {
    const fullIds = await publishedQuestionIds(exam.id, fullMock.item_count);
    if (fullIds.length >= 10) {
      await replaceMockQuestions(fullMock.id, fullIds);
      // Keep item_count truthful to how many we could actually link.
      if (fullIds.length !== fullMock.item_count) {
        await sb.from('mock_exams').update({ item_count: fullIds.length }).eq('id', fullMock.id);
      }
      console.log(`✓ ${exam.slug} full mock: ${fullIds.length} questions`);
    } else {
      console.log(`  (skip full mock — only ${fullIds.length} published questions)`);
    }
  }
}

console.log('\nMock exams refreshed.');
