import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('/Users/lyndon/reviewnatin/.env.supabase','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()]}));
const ref = readFileSync('/Users/lyndon/reviewnatin/supabase/.temp/project-ref','utf8').trim();
const token = env.SUPABASE_ACCESS_TOKEN;
const sql = readFileSync('/Users/lyndon/reviewnatin/supabase/migrations/20260617120000_ai_tutor_usage_cooldown.sql','utf8');
async function q(query, label) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body: JSON.stringify({ query }) });
  console.log(`[${label}] HTTP ${res.status}: ${JSON.stringify(await res.json().catch(()=>null)).slice(0,160)}`);
}
await q(sql, 'apply-migration');
await q(`INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260617120000','ai_tutor_usage_cooldown') ON CONFLICT (version) DO NOTHING;`, 'record');
await q(`SELECT column_name FROM information_schema.columns WHERE table_name='ai_tutor_usage' ORDER BY column_name;`, 'verify-columns');
