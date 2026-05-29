import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topics } = await sb
  .from('topics')
  .select('id, slug, subject_areas!inner(slug, exam_types!inner(slug))')
  .not('subject_areas.exam_types.slug', 'in', '(cse-professional,cse-subprofessional)');

console.log('\nNon-CSE topics:');
for (const t of (topics || [])) {
  const exam = t.subject_areas?.exam_types?.slug;
  const subj = t.subject_areas?.slug;
  console.log(`  ${exam?.padEnd(20)} | ${subj?.padEnd(15)} | ${t.slug?.padEnd(30)} | ${t.id}`);
}

// Also check question counts per exam type
const { data: allQ } = await sb.from('questions').select('topic_id, status');
const topicMap = new Map();
for (const t of (topics || [])) topicMap.set(t.id, { exam: t.subject_areas?.exam_types?.slug, count: 0 });

const examCounts = {};
for (const q of (allQ || [])) {
  const t = topicMap.get(q.topic_id);
  if (t) {
    examCounts[t.exam] = (examCounts[t.exam] || 0) + 1;
  }
}
console.log('\nQuestion counts for non-CSE exams:');
for (const [exam, count] of Object.entries(examCounts)) {
  console.log(`  ${exam}: ${count} questions`);
}
