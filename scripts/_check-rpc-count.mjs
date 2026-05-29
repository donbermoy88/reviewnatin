/**
 * Check what get_practice_questions returns vs raw question count.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. What does get_practice_questions return?
console.log('Calling get_practice_questions for cse-professional (limit 500)...');
const { data: rpcData, error: rpcErr } = await sb.rpc('get_practice_questions', {
  p_exam_slug: 'cse-professional',
  p_limit: 500,
  p_topic_slug: null,
});

if (rpcErr) {
  console.error('RPC error:', rpcErr.message);
} else {
  console.log(`RPC returned: ${rpcData?.length ?? 0} questions`);
  if (rpcData?.length > 0) {
    console.log('Sample question:', JSON.stringify(rpcData[0]).slice(0, 200));
  }
}

// 2. Direct DB count
const { count: directCount } = await sb
  .from('questions')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');
console.log(`\nDirect DB count (published): ${directCount}`);

// 3. Count for just CSE Pro topics
const { data: cseProTopics } = await sb
  .from('topics')
  .select('id, subject_areas!inner(exam_types!inner(slug))')
  .eq('subject_areas.exam_types.slug', 'cse-professional');

const topicIds = cseProTopics?.map(t => t.id) ?? [];
const { count: cseProCount } = await sb
  .from('questions')
  .select('*', { count: 'exact', head: true })
  .in('topic_id', topicIds)
  .eq('status', 'published');
console.log(`CSE Professional questions in DB: ${cseProCount}`);

// 4. Check if RPC has any filtering on is_verified or other columns
const { data: sample } = await sb
  .from('questions')
  .select('id, status, is_verified, source_note, created_at')
  .in('topic_id', topicIds)
  .limit(5);
console.log('\nSample questions:');
sample?.forEach(q => console.log(`  ${q.id} | status:${q.status} | verified:${q.is_verified} | source:${q.source_note?.slice(0,40)}`));
