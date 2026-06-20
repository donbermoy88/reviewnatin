import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('/Users/lyndon/reviewnatin/.env.supabase','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()]}));
const ref = readFileSync('/Users/lyndon/reviewnatin/supabase/.temp/project-ref','utf8').trim();
const token = env.SUPABASE_ACCESS_TOKEN;
async function q(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body: JSON.stringify({ query }) });
  return res.json().catch(()=>null);
}
// reset QA usage for today so device testing isn't blocked
await q(`DELETE FROM ai_tutor_usage WHERE user_id='0680552f-2ca9-413c-b647-4a409eea8289';`);
console.log('QA tutor usage reset.');
// existence check for all code-referenced tables
const expected = ['bookmarks','content_reports','exam_types','flashcards','mock_exams','mock_exam_questions','quiz_answers','quiz_sessions','subject_areas','subscription_products','topics','user_entitlements','user_exam_goals','user_notes','user_preferences','user_push_tokens','users','ai_tutor_usage'];
const rows = await q(`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`);
const present = new Set((rows ?? []).map(r => r.table_name));
const missing = expected.filter(t => !present.has(t));
console.log('Tables present:', present.size);
console.log('MISSING (code references but not in prod):', missing.length ? missing.join(', ') : 'NONE ✅');
