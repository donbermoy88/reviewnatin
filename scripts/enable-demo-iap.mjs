#!/usr/bin/env node
/**
 * Enable demo IAP entitlements on linked Supabase (local/dev only).
 * Sets a Postgres GUC read by grant_demo_entitlement().
 *
 * Usage: npm run db:enable-demo-iap
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
Enable demo entitlements for grant_demo_entitlement() RPC.

Option A — linked Supabase CLI:
  supabase db execute --sql "ALTER DATABASE postgres SET app.demo_entitlements_enabled = 'true';"

Option B — set SUPABASE_DB_URL in .env.supabase and re-run:
  npm run db:enable-demo-iap
`);
  process.exit(0);
}

execSync(
  `psql "${dbUrl}" -c "ALTER DATABASE postgres SET app.demo_entitlements_enabled = 'true';"`,
  { stdio: 'inherit' }
);
console.log('\nDemo entitlements enabled for this database.');
