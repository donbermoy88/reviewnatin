#!/usr/bin/env node
/**
 * Pre-generate question explanations ONCE and store them in the DB so the app
 * serves them for free forever (ai-explain only calls the model for questions
 * that still lack a stored explanation). This converts a per-user recurring
 * cost into a one-time batch cost.
 *
 * Cost is one-time: ~2,000 questions on Haiku ≈ a few dollars.
 *
 * Usage:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node scripts/pregenerate-explanations.mjs            # all published, missing en, all exams
 *   node scripts/pregenerate-explanations.mjs --limit 5  # test on 5 first (recommended)
 *   node scripts/pregenerate-explanations.mjs --exam cse-professional
 *   node scripts/pregenerate-explanations.mjs --locale fil
 *   node scripts/pregenerate-explanations.mjs --dry      # count only, no API calls/writes
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8').split('\n')
        .filter((l) => l && !l.trim().startsWith('#') && l.includes('='))
        .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}
const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };

const url = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = env.ANTHROPIC_API_KEY;
const MODEL = env.PREGEN_MODEL || 'claude-haiku-4-5-20251001';

const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dry = args.includes('--dry');
const limit = Number(getArg('--limit')) || Infinity;
const examSlug = getArg('--exam') || null;
const locale = getArg('--locale') === 'fil' ? 'fil' : 'en';
const column = locale === 'fil' ? 'explanation_fil' : 'explanation_en';
const CONCURRENCY = 4;

if (!url || !serviceKey) { console.error('Missing SUPABASE_URL / SERVICE_ROLE_KEY'); process.exit(1); }
if (!dry && !anthropicKey) { console.error('Set ANTHROPIC_API_KEY (or run with --dry to just count).'); process.exit(1); }

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

async function fetchMissing() {
  // questions: id, stem, choices, status, topic -> subject -> exam
  let q = sb.from('questions')
    .select(`id, stem, choices, ${column}, topics!inner(subject_areas!inner(exam_types!inner(slug)))`)
    .eq('status', 'published')
    .or(`${column}.is.null,${column}.eq.`);
  if (examSlug) q = q.eq('topics.subject_areas.exam_types.slug', examSlug);
  const { data, error } = await q.limit(Number.isFinite(limit) ? limit : 5000);
  if (error) throw error;
  return data ?? [];
}

const lang = locale === 'fil' ? 'Filipino (Taglish OK)' : 'English';
async function generate(stem, choices) {
  const lines = (choices ?? []).map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text}`).join('\n');
  const correct = (choices ?? []).find((c) => c.is_correct)?.text ?? 'unknown';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 400,
      messages: [{ role: 'user', content: `You are a friendly Philippine licensure exam tutor. Explain in ${lang} (2-4 short paragraphs, bullet points OK).\n\nQuestion: ${stem}\n\nChoices:\n${lines}\n\nCorrect answer: ${correct}\n\nExplain WHY the correct answer is right and briefly why common wrong choices fail. Be concise and exam-focused.` }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  return data.content?.find((b) => b.type === 'text')?.text?.trim() || null;
}

const rows = await fetchMissing();
console.log(`Questions missing ${column}${examSlug ? ` for ${examSlug}` : ''}: ${rows.length}${dry ? ' (dry run — no API calls)' : ''}`);
if (dry || rows.length === 0) process.exit(0);

let done = 0, failed = 0;
for (let i = 0; i < rows.length; i += CONCURRENCY) {
  const batch = rows.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(async (row) => {
    try {
      const text = await generate(row.stem, row.choices);
      if (!text) { failed++; return; }
      const { error } = await sb.from('questions').update({ [column]: text }).eq('id', row.id);
      if (error) { failed++; return; }
      done++;
    } catch (e) { failed++; console.error(`  ! ${row.id}: ${e.message}`); }
  }));
  console.log(`  ${done + failed}/${rows.length} processed (ok=${done}, failed=${failed})`);
}
console.log(`\nDone. Stored ${done} explanations, ${failed} failed.`);
