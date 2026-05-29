/**
 * Generic DB query helper for content import verification.
 * Usage: node scripts/_db-query.mjs "SELECT ..."
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const sql = process.argv[2];
if (!sql) { console.error('Usage: node _db-query.mjs "SQL"'); process.exit(1); }

const { data, error } = await sb.rpc('exec_sql', { sql }).catch(() => ({ data: null, error: { message: 'rpc not available' } }));
if (error) {
  // Fallback: use PostgREST direct queries via from() for simple selects
  console.error('RPC exec_sql not available. Use specific queries via Supabase client.');
  process.exit(1);
}
console.log(JSON.stringify(data, null, 2));
