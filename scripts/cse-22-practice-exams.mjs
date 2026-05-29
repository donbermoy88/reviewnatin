/**
 * CSE-22: Create Full-Length Practice Mock Exams
 * Inserts mock_exam records for:
 *   - CSE Professional Full Mock: 170 items / 3 hours
 *   - CSE Subprofessional Full Mock: 165 items / 2.5 hours
 *
 * The app's quiz engine randomly selects `item_count` questions
 * from all published questions linked to that exam_type.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const EXAM_TYPE_PRO = 'b0000001-0001-4000-8000-000000000001';  // CSE Professional
const EXAM_TYPE_SUB = 'b0000001-0001-4000-8000-000000000002';  // CSE Subprofessional

const MOCKS_TO_INSERT = [
  {
    exam_type_id: EXAM_TYPE_PRO,
    title: 'CSE Professional — Full Length Mock',
    item_count: 170,
    duration_seconds: 10800,  // 3 hours
    is_active: true,
  },
  {
    exam_type_id: EXAM_TYPE_SUB,
    title: 'CSE Subprofessional — Full Length Mock',
    item_count: 165,
    duration_seconds: 9000,   // 2 hours 30 minutes
    is_active: true,
  },
];

async function main() {
  console.log('🎯 Creating Full-Length CSE Practice Mock Exams\n');

  // Show current mock exams
  const { data: existing } = await sb
    .from('mock_exams')
    .select('id, title, item_count, duration_seconds, exam_type_id')
    .order('item_count', { ascending: false });

  console.log('Existing mock exams:');
  existing.forEach(e => {
    const mins = Math.round(e.duration_seconds / 60);
    console.log(`  [${e.id.slice(0,8)}] ${e.title} — ${e.item_count} items / ${mins} min`);
  });

  // Check if full mocks already exist to avoid duplicates
  const fullProExists = existing.some(e =>
    e.exam_type_id === EXAM_TYPE_PRO && e.item_count >= 150
  );
  const fullSubExists = existing.some(e =>
    e.exam_type_id === EXAM_TYPE_SUB && e.item_count >= 150
  );

  const toInsert = MOCKS_TO_INSERT.filter((m, i) => {
    if (i === 0 && fullProExists) {
      console.log('\n  ⚠️  Pro full mock already exists, skipping.');
      return false;
    }
    if (i === 1 && fullSubExists) {
      console.log('\n  ⚠️  Sub full mock already exists, skipping.');
      return false;
    }
    return true;
  });

  if (!toInsert.length) {
    console.log('\n✅ All full-length mocks already exist. Nothing to insert.');
    return;
  }

  console.log(`\n📝 Inserting ${toInsert.length} mock exam(s)...\n`);

  const { data, error } = await sb
    .from('mock_exams')
    .insert(toInsert)
    .select('id, title, item_count, duration_seconds');

  if (error) throw error;

  data.forEach(m => {
    const hours = Math.floor(m.duration_seconds / 3600);
    const mins = Math.floor((m.duration_seconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    console.log(`  ✅ Created: "${m.title}" — ${m.item_count} items / ${timeStr}`);
    console.log(`     ID: ${m.id}`);
  });

  console.log('\n📊 Verifying question pool size...');

  for (const examTypeId of [EXAM_TYPE_PRO, EXAM_TYPE_SUB]) {
    // Count published questions linked to this exam type via topics → subject_areas
    const { count } = await sb
      .from('questions')
      .select('*, topics!inner(subject_areas!inner(exam_type_id))', { count: 'exact', head: true })
      .eq('topics.subject_areas.exam_type_id', examTypeId)
      .eq('status', 'published');

    const label = examTypeId === EXAM_TYPE_PRO ? 'Professional' : 'Subprofessional';
    const needed = examTypeId === EXAM_TYPE_PRO ? 170 : 165;
    const ok = count >= needed ? '✅' : '⚠️ ';
    console.log(`  ${ok} CSE ${label}: ${count} questions available (need ${needed} for full mock)`);
  }

  console.log('\n✅ Done! Full-length practice mocks are now live.');
  console.log('   Users will see them in the Mock Exam section of the Study tab.');
}

main().catch(e => { console.error(e); process.exit(1); });
