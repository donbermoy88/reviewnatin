#!/usr/bin/env node
/**
 * Apply canonical catalog seed to a Postgres database.
 * Usage:
 *   DATABASE_URL=postgresql://... npm run db:seed-catalog
 * Or paste supabase/sql/catalog_seed.sql in Supabase SQL Editor.
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sqlPath = resolve(root, 'supabase/sql/catalog_seed.sql');

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

const env = { ...loadEnv('.env.supabase'), ...process.env };
const dbUrl = env.DATABASE_URL ?? env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('Missing DATABASE_URL (direct Postgres connection string).');
  console.error(`Paste the contents of ${sqlPath} in Supabase → SQL Editor instead.`);
  process.exit(1);
}

try {
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f "${sqlPath}"`, { stdio: 'inherit' });
  console.log('\n✓ Catalog seed applied from supabase/sql/catalog_seed.sql');
} catch {
  process.exit(1);
}
