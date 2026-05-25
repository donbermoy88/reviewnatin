#!/usr/bin/env node
/**
 * Seed full CSE Professional topic tree (all subject areas).
 * Idempotent — safe to re-run.
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sqlPath = resolve(root, 'supabase/sql/cse_professional_topics.sql');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const dbUrl = env.DATABASE_URL ?? env.SUPABASE_DB_URL;
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const CSE_TOPICS = [
  { subject: 'verbal', slug: 'grammar', name: 'Grammar and Correct Usage', sort: 1 },
  { subject: 'verbal', slug: 'vocabulary', name: 'Vocabulary', sort: 2 },
  { subject: 'verbal', slug: 'paragraph-org', name: 'Paragraph Organization', sort: 3 },
  { subject: 'verbal', slug: 'reading-comp', name: 'Reading Comprehension', sort: 4 },
  { subject: 'verbal', slug: 'verbal-comprehension', name: 'Verbal Comprehension', sort: 5 },
  { subject: 'analytical', slug: 'word-association', name: 'Word Association', sort: 1 },
  { subject: 'analytical', slug: 'assumptions-conclusions', name: 'Identifying Assumptions and Conclusions', sort: 2 },
  { subject: 'analytical', slug: 'logic', name: 'Logic and Reasoning', sort: 3 },
  { subject: 'analytical', slug: 'data-interpretation', name: 'Data Interpretation', sort: 4 },
  { subject: 'numerical', slug: 'basic-operations', name: 'Basic Operations', sort: 1 },
  { subject: 'numerical', slug: 'number-series', name: 'Number Series', sort: 2 },
  { subject: 'numerical', slug: 'word-problems', name: 'Word Problems', sort: 3 },
  { subject: 'general-info', slug: 'constitution', name: 'Philippine Constitution', sort: 1 },
  { subject: 'general-info', slug: 'ra-6713', name: 'RA 6713 — Code of Conduct', sort: 2 },
  { subject: 'general-info', slug: 'peace-human-rights', name: 'Peace and Human Rights', sort: 3 },
  { subject: 'general-info', slug: 'environment', name: 'Environment Management', sort: 4 },
];

async function seedViaSupabase() {
  if (!url || !key) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }

  const sb = createClient(url, key);
  const { data: exam, error: examErr } = await sb
    .from('exam_types')
    .select('id')
    .eq('slug', 'cse-professional')
    .single();

  if (examErr || !exam) {
    console.error('CSE Professional exam type not found. Run catalog seed first.');
    process.exit(1);
  }

  const { data: subjects, error: subErr } = await sb
    .from('subject_areas')
    .select('id, slug')
    .eq('exam_type_id', exam.id);

  if (subErr || !subjects?.length) {
    console.error('Subject areas not found for CSE Professional.');
    process.exit(1);
  }

  const subjectBySlug = Object.fromEntries(subjects.map((s) => [s.slug, s.id]));
  let inserted = 0;

  for (const topic of CSE_TOPICS) {
    const subjectId = subjectBySlug[topic.subject];
    if (!subjectId) {
      console.warn(`Skip topic ${topic.slug}: subject ${topic.subject} missing`);
      continue;
    }

    const { data: existing } = await sb
      .from('topics')
      .select('id')
      .eq('subject_area_id', subjectId)
      .eq('slug', topic.slug)
      .maybeSingle();

    if (existing?.id) continue;

    const { error } = await sb.from('topics').insert({
      subject_area_id: subjectId,
      slug: topic.slug,
      name: topic.name,
      sort_order: topic.sort,
    });

    if (error) throw error;
    inserted += 1;
  }

  const { count } = await sb
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .in(
      'subject_area_id',
      subjects.map((s) => s.id)
    );

  console.log(`✓ CSE Professional topics: ${inserted} new, ${count ?? 0} total`);
}

if (dbUrl) {
  try {
    execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f "${sqlPath}"`, { stdio: 'inherit' });
    console.log('\n✓ CSE Professional topics applied via psql');
  } catch {
    console.warn('psql failed — falling back to Supabase API');
    await seedViaSupabase();
  }
} else {
  await seedViaSupabase();
}
