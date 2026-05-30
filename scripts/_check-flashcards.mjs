import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { count } = await sb.from('flashcards').select('*', { count: 'exact', head: true });
console.log('Existing flashcards:', count);

// Get actual columns
const { data: sample, error } = await sb.from('flashcards').select('*').limit(1);
if (error) console.error('Error:', error.message);
if (sample?.length) console.log('Columns:', Object.keys(sample[0]).join(', '));
else console.log('Table is empty — columns unknown from data. Trying insert probe...');

// Try a minimal insert to discover required columns
const { data: topics } = await sb
  .from('topics')
  .select('id, slug, subject_areas!inner(slug, exam_types!inner(slug))')
  .eq('slug', 'grammar');

const topicId = topics?.[0]?.id;
console.log('Sample topic id (grammar):', topicId);

if (topicId) {
  const { data: ins, error: insErr } = await sb
    .from('flashcards')
    .insert({ topic_id: topicId, front: 'TEST', back: 'TEST' })
    .select()
    .single();
  if (insErr) {
    console.log('Insert error (reveals schema):', insErr.message);
  } else {
    console.log('Inserted columns:', Object.keys(ins).join(', '));
    console.log('Sample row:', JSON.stringify(ins, null, 2));
    // Clean up
    await sb.from('flashcards').delete().eq('id', ins.id);
    console.log('Probe row deleted.');
  }
}
