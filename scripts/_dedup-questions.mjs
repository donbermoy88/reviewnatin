/**
 * Step 4: Deduplicate questions by (stem, topic_id).
 * Keeps the row with the earliest created_at; deletes extras.
 * Paginates to handle >1000 rows.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Step 1: Get total count
const { count: totalCount } = await sb
  .from('questions')
  .select('*', { count: 'exact', head: true });
console.log(`Total questions in DB: ${totalCount}`);

// Step 2: Fetch all questions with pagination (1000 per page)
console.log('Fetching all questions (paginated)...');
const PAGE = 1000;
const allQ = [];
for (let offset = 0; offset < totalCount; offset += PAGE) {
  const { data, error } = await sb
    .from('questions')
    .select('id, stem, topic_id, created_at')
    .order('created_at', { ascending: true })
    .range(offset, offset + PAGE - 1);
  if (error) { console.error(`Page error at offset ${offset}:`, error.message); process.exit(1); }
  allQ.push(...data);
  process.stdout.write(`  Fetched ${allQ.length}/${totalCount}\r`);
}
console.log(`\nFetched ${allQ.length} questions total.`);

// Step 3: Build map of (stem+topic_id) → earliest id (already sorted by created_at asc)
const seen = new Map();
for (const q of allQ) {
  const key = `${q.topic_id}::${q.stem}`;
  if (!seen.has(key)) {
    seen.set(key, { keepId: q.id, dupeIds: [] });
  } else {
    seen.get(key).dupeIds.push(q.id);
  }
}

// Collect all duplicate IDs
const dupeIds = [];
let dupeCount = 0;
for (const [, { dupeIds: dIds }] of seen.entries()) {
  if (dIds.length > 0) {
    dupeCount++;
    dupeIds.push(...dIds);
  }
}

console.log(`\nUnique (stem, topic_id) pairs: ${seen.size}`);
console.log(`Duplicate question groups: ${dupeCount}`);
console.log(`Total rows to delete: ${dupeIds.length}`);

if (dupeIds.length === 0) {
  console.log('\n✅ No duplicates found. DB is clean.');
  process.exit(0);
}

// Show 5 example duplicates
const examples = [...seen.entries()].filter(([, v]) => v.dupeIds.length > 0).slice(0, 5);
console.log('\nExample duplicates:');
for (const [key, { keepId, dupeIds: dIds }] of examples) {
  const stemPreview = key.split('::')[1]?.slice(0, 70) ?? key.slice(0, 70);
  console.log(`  "${stemPreview}..." → keep ${keepId}, delete ${dIds.length} dupe(s)`);
}

// Step 4: Delete duplicates in batches of 200
console.log('\nDeleting duplicates in batches...');
let deleted = 0;
const BATCH = 200;
for (let i = 0; i < dupeIds.length; i += BATCH) {
  const batch = dupeIds.slice(i, i + BATCH);
  const { error: delErr } = await sb.from('questions').delete().in('id', batch);
  if (delErr) {
    console.error(`Batch ${Math.floor(i/BATCH)+1} error:`, delErr.message);
  } else {
    deleted += batch.length;
    process.stdout.write(`  Deleted ${deleted}/${dupeIds.length}\r`);
  }
}

console.log(`\n✅ Deleted ${deleted} duplicate rows.`);

// Final count
const { count: finalCount } = await sb.from('questions').select('*', { count: 'exact', head: true });
console.log(`Final question count: ${finalCount}`);
