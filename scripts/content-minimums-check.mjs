#!/usr/bin/env node
/**
 * Live content-minimums gate (Sprint 6 — release hardening / P0 content).
 *
 * Queries the production Supabase project for the number of PUBLISHED questions
 * and ACTIVE mock exams per exam track, then compares against the canonical
 * CONTENT_MINIMUMS. Exits non-zero if any track is below minimum so it can gate
 * a release in CI.
 *
 * Keep MINIMUMS in sync with packages/shared/src/content-minimums.ts.
 *
 * Usage:
 *   node scripts/content-minimums-check.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Mirror of packages/shared/src/content-minimums.ts (CONTENT_MINIMUMS).
const MINIMUMS = {
  'cse-professional': { questions: 300, mockExams: 2 },
  'cse-subprofessional': { questions: 200, mockExams: 2 },
  'let-elementary': { questions: 150, mockExams: 1 },
  'let-secondary': { questions: 200, mockExams: 1 },
  pnle: { questions: 200, mockExams: 1 },
};

function loadEnv() {
  const candidates = [resolve(ROOT, '.env.supabase'), resolve(ROOT, 'apps/mobile/.env')];
  const env = { ...process.env };
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (env[key]) continue;
      env[key] = line.slice(eq + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.supabase).');
  process.exit(2);
}

const sb = createClient(url, key);

// Map topic_id -> exam slug via topics -> subject_areas -> exam_types.
const { data: topics, error: topicErr } = await sb
  .from('topics')
  .select('id, subject_areas!inner(exam_types!inner(slug))');
if (topicErr) {
  console.error('Failed to load topics:', topicErr.message);
  process.exit(2);
}
const topicToExam = new Map(
  topics.map((t) => [t.id, t.subject_areas?.exam_types?.slug ?? 'unknown'])
);

// Paginate published questions and tally per exam.
const { count: total } = await sb
  .from('questions')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');

const counts = {};
const PAGE = 1000;
for (let offset = 0; offset < (total ?? 0); offset += PAGE) {
  const { data, error } = await sb
    .from('questions')
    .select('topic_id')
    .eq('status', 'published')
    .range(offset, offset + PAGE - 1);
  if (error) {
    console.error('Failed to load questions:', error.message);
    process.exit(2);
  }
  for (const q of data) {
    const exam = topicToExam.get(q.topic_id) ?? 'unknown';
    counts[exam] = (counts[exam] ?? 0) + 1;
  }
}

// Active mock exams per exam track.
const { data: mocks, error: mockErr } = await sb
  .from('mock_exams')
  .select('exam_types!inner(slug)')
  .eq('is_active', true);
if (mockErr) {
  console.error('Failed to load mock exams:', mockErr.message);
  process.exit(2);
}
const mockCounts = {};
for (const m of mocks) {
  const exam = m.exam_types?.slug ?? 'unknown';
  mockCounts[exam] = (mockCounts[exam] ?? 0) + 1;
}

console.log('\n=== Content minimums check ===\n');
let failed = false;
for (const [slug, min] of Object.entries(MINIMUMS)) {
  const q = counts[slug] ?? 0;
  const mk = mockCounts[slug] ?? 0;
  const qOk = q >= min.questions;
  const mkOk = mk >= min.mockExams;
  const ok = qOk && mkOk;
  if (!ok) failed = true;
  const mark = ok ? 'PASS' : 'GAP ';
  const qNote = qOk ? '' : ` (need ${min.questions - q} more)`;
  const mkNote = mkOk ? '' : ` (need ${min.mockExams - mk} more)`;
  console.log(
    `[${mark}] ${slug.padEnd(22)} questions ${q}/${min.questions}${qNote}` +
      `   mocks ${mk}/${min.mockExams}${mkNote}`
  );
}

console.log('');
if (failed) {
  console.error('Content minimums NOT met — backfill or gate the deficient track as "coming soon".');
  process.exit(1);
}
console.log('All exam tracks meet content minimums.');
