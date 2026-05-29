import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await sb
  .from('exam_types')
  .select('id, slug, name')
  .in('slug', ['cse-professional', 'cse-subprofessional']);

if (error) { console.error(error.message); process.exit(1); }
console.log('Exam type IDs:');
data.forEach(e => console.log(`  ${e.slug}: ${e.id}  (name: ${e.name})`));
