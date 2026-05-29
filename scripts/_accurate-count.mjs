/**
 * Accurate paginated question count by exam type.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Total count
const { count: total } = await sb.from('questions').select('*', { count: 'exact', head: true });
console.log(`\nTotal questions in DB: ${total}`);

// 2. Fetch all topics with exam type info
const { data: topics } = await sb
  .from('topics')
  .select('id, slug, subject_areas!inner(slug, exam_types!inner(slug, name))');

const topicToExam = new Map();
for (const t of topics) {
  topicToExam.set(t.id, {
    exam: t.subject_areas?.exam_types?.slug,
    examName: t.subject_areas?.exam_types?.name,
    subject: t.subject_areas?.slug,
    topic: t.slug,
  });
}

// 3. Paginate all questions
const PAGE = 1000;
const allQ = [];
for (let offset = 0; offset < total; offset += PAGE) {
  const { data } = await sb
    .from('questions')
    .select('id, topic_id, status')
    .range(offset, offset + PAGE - 1);
  allQ.push(...data);
}
console.log(`Fetched ${allQ.length} questions (paginated)\n`);

// 4. Count by exam type and status
const examCounts = {};
const statusCounts = {};
for (const q of allQ) {
  const info = topicToExam.get(q.topic_id);
  const exam = info?.exam ?? 'unknown';
  if (!examCounts[exam]) examCounts[exam] = { published: 0, other: 0, total: 0 };
  examCounts[exam].total++;
  if (q.status === 'published') examCounts[exam].published++;
  else examCounts[exam].other++;
  statusCounts[q.status || 'null'] = (statusCounts[q.status || 'null'] || 0) + 1;
}

console.log('Status breakdown:');
for (const [s, c] of Object.entries(statusCounts)) console.log(`  ${s}: ${c}`);

console.log('\nQuestion counts by exam type:');
const order = ['cse-professional','cse-subprofessional','let-elementary','let-secondary','pnle','unknown'];
for (const exam of order) {
  if (examCounts[exam]) {
    const { published, other, total: t } = examCounts[exam];
    const gap500 = Math.max(0, 500 - published);
    console.log(`  ${exam.padEnd(25)}: ${published} published / ${t} total${other > 0 ? ` (${other} non-published)` : ''}${gap500 > 0 ? ` — needs ${gap500} more for 500 minimum` : ' ✅ ≥500'}`);
  }
}

// 5. Per-topic breakdown for CSE
console.log('\nCSE Per-topic breakdown:');
const topicCounts = {};
for (const q of allQ) {
  const info = topicToExam.get(q.topic_id);
  if (!info?.exam?.startsWith('cse')) continue;
  const key = `${info.exam}::${info.subject}::${info.topic}`;
  if (!topicCounts[key]) topicCounts[key] = 0;
  if (q.status === 'published') topicCounts[key]++;
}
for (const [key, count] of Object.entries(topicCounts).sort()) {
  const parts = key.split('::');
  console.log(`  ${parts[0].padEnd(22)} | ${parts[1].padEnd(12)} | ${parts[2].padEnd(25)} | ${count}`);
}
