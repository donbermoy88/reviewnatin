#!/usr/bin/env node
/**
 * Disable demo IAP entitlements on linked Supabase (production safety).
 * Clears the Postgres GUC read by grant_demo_entitlement() and user_has_content_access().
 *
 * Usage: npm run db:disable-demo-iap
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const path = join(ROOT, '.env.supabase');
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.log(`
Disable demo entitlements (required for production / beta hosted DB).

Option A — linked Supabase CLI:
  supabase db execute --sql "ALTER DATABASE postgres RESET app.demo_entitlements_enabled;"

Option B — set SUPABASE_DB_URL in .env.supabase and re-run:
  npm run db:disable-demo-iap

Verify: npm run beta:security:verify
`);
  process.exit(0);
}

execSync(
  `psql "${dbUrl}" -c "ALTER DATABASE postgres RESET app.demo_entitlements_enabled;"`,
  { stdio: 'inherit' }
);
console.log('\nDemo entitlements disabled for this database.');
console.log('Run: npm run beta:security:verify');
