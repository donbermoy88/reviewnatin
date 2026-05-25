#!/usr/bin/env node
/**
 * Restore Phase 1 exam categories + exam types (minimal catalog fix).
 * For full catalog (subjects, topics, SKUs): npm run db:seed-catalog
 *   or paste supabase/sql/catalog_seed.sql in SQL Editor.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i), l.slice(i + 1)];
        })
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env') };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key fallback).');
  process.exit(1);
}

const sb = createClient(url, key);

const categories = [
  { id: 'a0000001-0001-4000-8000-000000000001', slug: 'civil-service', name: 'Civil Service', sort_order: 1, is_active: true },
  { id: 'a0000001-0001-4000-8000-000000000002', slug: 'prc', name: 'PRC Board Exams', sort_order: 2, is_active: true },
];

const examTypes = [
  {
    id: 'b0000001-0001-4000-8000-000000000001',
    category_id: 'a0000001-0001-4000-8000-000000000001',
    slug: 'cse-professional',
    name: 'CSE Professional',
    description: 'Career Service Examination — Professional Level',
    official_registration_url: 'https://www.csc.gov.ph',
    is_active: true,
    phase: 1,
  },
  {
    id: 'b0000001-0001-4000-8000-000000000002',
    category_id: 'a0000001-0001-4000-8000-000000000001',
    slug: 'cse-subprofessional',
    name: 'CSE Subprofessional',
    description: 'Career Service Examination — Subprofessional Level',
    official_registration_url: 'https://www.csc.gov.ph',
    is_active: true,
    phase: 1,
  },
  {
    id: 'b0000001-0001-4000-8000-000000000005',
    category_id: 'a0000001-0001-4000-8000-000000000002',
    slug: 'pnle',
    name: 'PNLE (Nursing)',
    description: 'Philippine Nurse Licensure Examination',
    official_registration_url: 'https://www.prc.gov.ph',
    is_active: true,
    phase: 1,
  },
  {
    id: 'b0000001-0001-4000-8000-000000000003',
    category_id: 'a0000001-0001-4000-8000-000000000002',
    slug: 'let-elementary',
    name: 'LET Elementary',
    description: 'Licensure Examination for Teachers — Elementary',
    official_registration_url: 'https://online.prc.gov.ph',
    is_active: true,
    phase: 1,
  },
  {
    id: 'b0000001-0001-4000-8000-000000000004',
    category_id: 'a0000001-0001-4000-8000-000000000002',
    slug: 'let-secondary',
    name: 'LET Secondary',
    description: 'Licensure Examination for Teachers — Secondary',
    official_registration_url: 'https://online.prc.gov.ph',
    is_active: true,
    phase: 1,
  },
];

for (const row of categories) {
  const { error } = await sb.from('exam_categories').upsert(row, { onConflict: 'slug' });
  if (error) {
    console.error('category', row.slug, error.message);
    process.exit(1);
  }
  console.log('✓ category', row.slug);
}

for (const row of examTypes) {
  const { error } = await sb.from('exam_types').upsert(row, { onConflict: 'slug' });
  if (error) {
    console.error('exam_type', row.slug, error.message);
    process.exit(1);
  }
  console.log('✓ exam_type', row.slug);
}

const { data, error } = await sb.from('exam_types').select('slug,name').eq('is_active', true).order('name');
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log('\nActive exam types in Supabase:');
for (const row of data ?? []) {
  console.log(' -', row.slug, '→', row.name);
}
