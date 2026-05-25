#!/usr/bin/env node
/**
 * One-command setup: migrations (via supabase CLI) + catalog + content + mocks.
 * Usage: npm run db:apply-all
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
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
          return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

function step(label, fn) {
  console.log(`\n▶ ${label}`);
  fn();
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
  process.exit(1);
}

step('Push migrations', () => {
  execSync('npm run db:push', { cwd: root, stdio: 'inherit' });
});

step('Seed CSE Professional topics', () => {
  execSync('node scripts/seed-cse-topics.mjs', { cwd: root, stdio: 'inherit' });
});

step('Seed demo questions', () => {
  execSync('node scripts/seed-demo-questions.mjs', { cwd: root, stdio: 'inherit' });
});

step('Refresh mock exams', () => {
  execSync('node scripts/refresh-mock-exams.mjs', { cwd: root, stdio: 'inherit' });
});

const csvPath = resolve(root, 'templates/questions_import_v1.csv');
try {
  step('Import CSV template (draft)', () => {
    execSync(`node scripts/import-questions.mjs "${csvPath}"`, { cwd: root, stdio: 'inherit' });
  });
} catch {
  console.warn('  (CSV import skipped — duplicates or validation errors are OK on re-run)');
}

const adminEnvPath = resolve(root, 'apps/admin/.env.local');
const adminEnv = [
  `NEXT_PUBLIC_SUPABASE_URL=${url}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${env.SUPABASE_ANON_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
  `SUPABASE_SERVICE_ROLE_KEY=${key}`,
  '',
].join('\n');
try {
  const { writeFileSync } = await import('fs');
  writeFileSync(adminEnvPath, adminEnv);
  console.log('\n▶ Wrote apps/admin/.env.local');
} catch (err) {
  console.warn('Could not write admin .env.local:', err.message);
}

const sb = createClient(url, key);

const { count: published } = await sb
  .from('questions')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');

const { count: topics } = await sb
  .from('topics')
  .select('*', { count: 'exact', head: true });

const { count: mocks } = await sb
  .from('mock_exams')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true);

const { data: rpcCheck } = await sb.rpc('has_completed_diagnostic', { p_exam_slug: 'cse-professional' });

console.log('\n✓ Apply-all complete');
console.log(`  Published questions: ${published ?? 0}`);
console.log(`  Topics: ${topics ?? 0}`);
console.log(`  Active mock exams: ${mocks ?? 0}`);
console.log(`  RPC has_completed_diagnostic: ${rpcCheck === false ? 'ok (returns false for service role)' : 'deployed'}`);
