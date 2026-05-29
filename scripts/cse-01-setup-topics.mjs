/**
 * CSE Question Bank — Step 1: Create missing topics for Pro & Sub-Pro
 * Run once before any question-insertion scripts.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function upsertTopic(subjectAreaId, slug, name, sortOrder) {
  const { data, error } = await sb
    .from('topics')
    .upsert({ subject_area_id: subjectAreaId, slug, name, sort_order: sortOrder },
             { onConflict: 'subject_area_id,slug' })
    .select('id, slug')
    .single();
  if (error) { console.error(`  ✗ ${slug}:`, error.message); return null; }
  console.log(`  ✓ ${slug} → ${data.id}`);
  return data.id;
}

async function main() {
  // ── Fetch all subject area IDs ──────────────────────────────────────────
  const { data: sas } = await sb
    .from('subject_areas')
    .select('id, slug, exam_types(slug)');

  const sa = {};
  for (const s of sas) {
    const exam = s.exam_types?.slug;
    sa[`${exam}::${s.slug}`] = s.id;
  }

  const PRO  = 'cse-professional';
  const SUB  = 'cse-subprofessional';

  // ── CSE Professional — missing topics ───────────────────────────────────
  console.log('\n=== CSE Professional ===');

  // Verbal — Filipino language topics
  await upsertTopic(sa[`${PRO}::verbal`], 'vocabulary-fil',    'Filipino Vocabulary (Kasingkahulugan/Kasalungat)', 6);
  await upsertTopic(sa[`${PRO}::verbal`], 'grammar-fil',       'Filipino Grammar (Wastong Gamit/Pagkilala sa Mali)', 7);
  await upsertTopic(sa[`${PRO}::verbal`], 'reading-comp-fil',  'Filipino Reading Comprehension (Pag-unawa sa Binasa)', 8);
  await upsertTopic(sa[`${PRO}::verbal`], 'paragraph-org-fil', 'Filipino Paragraph Development (Pagtatalata)', 9);

  // ── CSE Sub-Professional — missing topics ────────────────────────────────
  console.log('\n=== CSE Sub-Professional ===');

  // Verbal — missing topics
  await upsertTopic(sa[`${SUB}::verbal`], 'grammar',           'Grammar and Correct Usage', 2);
  await upsertTopic(sa[`${SUB}::verbal`], 'reading-comp',      'Reading Comprehension', 3);
  await upsertTopic(sa[`${SUB}::verbal`], 'paragraph-org',     'Paragraph Organization', 4);
  await upsertTopic(sa[`${SUB}::verbal`], 'vocabulary-fil',    'Filipino Vocabulary (Kasingkahulugan/Kasalungat)', 5);
  await upsertTopic(sa[`${SUB}::verbal`], 'grammar-fil',       'Filipino Grammar (Wastong Gamit/Pagkilala sa Mali)', 6);
  await upsertTopic(sa[`${SUB}::verbal`], 'reading-comp-fil',  'Filipino Reading Comprehension (Pag-unawa sa Binasa)', 7);
  await upsertTopic(sa[`${SUB}::verbal`], 'paragraph-org-fil', 'Filipino Paragraph Development (Pagtatalata)', 8);

  // Numerical — missing word-problems
  await upsertTopic(sa[`${SUB}::numerical`], 'word-problems-sub', 'Word Problems', 3);

  // Clerical — spelling (separate from filing/coding)
  await upsertTopic(sa[`${SUB}::clerical`], 'spelling', 'Spelling and Correct Writing', 3);

  console.log('\n✅ Done. All topics created or already exist.\n');
}

main().catch(console.error);
