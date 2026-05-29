/**
 * Pre-import database state check for CSE content import.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Get all topics for CSE exams with question counts
console.log('\n=== CSE Topics with Question Counts ===\n');
const { data: topics, error: topicsErr } = await sb
  .from('topics')
  .select(`
    id,
    slug,
    name,
    sort_order,
    subject_areas!inner(
      slug,
      exam_types!inner(slug)
    )
  `)
  .in('subject_areas.exam_types.slug', ['cse-professional', 'cse-subprofessional'])
  .order('sort_order');

if (topicsErr) { console.error('Topics error:', topicsErr.message); process.exit(1); }

// 2. Get question counts per topic
const topicIds = topics.map(t => t.id);
const { data: qCounts, error: qErr } = await sb
  .from('questions')
  .select('topic_id, status')
  .in('topic_id', topicIds);

if (qErr) { console.error('Questions error:', qErr.message); process.exit(1); }

const countMap = {};
for (const q of qCounts) {
  if (!countMap[q.topic_id]) countMap[q.topic_id] = { published: 0, total: 0 };
  countMap[q.topic_id].total++;
  if (q.status === 'published') countMap[q.topic_id].published++;
}

// 3. Print table
const rows = [];
for (const t of topics) {
  const exam = t.subject_areas?.exam_types?.slug;
  const subject = t.subject_areas?.slug;
  const counts = countMap[t.id] || { published: 0, total: 0 };
  rows.push({ exam, subject, topic: t.slug, topic_id: t.id, published_q: counts.published, total_q: counts.total });
}

rows.sort((a, b) => `${a.exam}${a.subject}` < `${b.exam}${b.subject}` ? -1 : 1);

console.log('exam_type              | subject     | topic                  | topic_id                             | pub | total');
console.log('-'.repeat(120));
for (const r of rows) {
  console.log(
    `${r.exam?.padEnd(22)} | ${r.subject?.padEnd(11)} | ${r.topic?.padEnd(22)} | ${r.topic_id} | ${String(r.published_q).padStart(3)} | ${String(r.total_q).padStart(5)}`
  );
}

// 4. Overall question counts by status
console.log('\n=== Overall Question Counts by Status ===\n');
const { data: allQ, error: allErr } = await sb.from('questions').select('status');
if (allErr) { console.error(allErr.message); } else {
  const statusMap = {};
  for (const q of allQ) {
    statusMap[q.status] = (statusMap[q.status] || 0) + 1;
  }
  for (const [status, count] of Object.entries(statusMap)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`  TOTAL: ${allQ.length}`);
}

// 5. Summary per exam
console.log('\n=== CSE Published Questions per Exam Type ===\n');
for (const exam of ['cse-professional', 'cse-subprofessional']) {
  const examRows = rows.filter(r => r.exam === exam);
  const pub = examRows.reduce((s, r) => s + r.published_q, 0);
  const total = examRows.reduce((s, r) => s + r.total_q, 0);
  console.log(`  ${exam}: ${pub} published / ${total} total (${examRows.length} topics)`);
}
console.log('');
