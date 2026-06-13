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
const qaEmails = (process.env.QA_PLUS_EMAILS ?? process.env.QA_PLUS_EMAIL ?? env.QA_PLUS_EMAILS ?? env.QA_PLUS_EMAIL ?? 'qa.plus@reviewnatin.test')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
  .join(',');
const allowAll = (process.env.DEMO_ENTITLEMENTS_ALLOW_ALL ?? env.DEMO_ENTITLEMENTS_ALLOW_ALL) === 'true';

if (!dbUrl) {
  console.log(`
Enable demo entitlements for grant_demo_entitlement() RPC.

Recommended — set SUPABASE_DB_URL in .env.supabase and run:
  QA_PLUS_EMAIL=qa.plus@reviewnatin.test npm run db:enable-demo-iap

Manual SQL:
  ALTER DATABASE postgres SET app.demo_entitlements_enabled = 'true';
  ALTER DATABASE postgres SET app.demo_entitlements_allow_all = 'false';
  ALTER DATABASE postgres SET app.demo_entitlement_emails = 'qa.plus@reviewnatin.test';

Local-only broad mode, not for shared/staging/prod databases:
  DEMO_ENTITLEMENTS_ALLOW_ALL=true npm run db:enable-demo-iap
`);
  process.exit(0);
}

const statements = [
  "ALTER DATABASE postgres SET app.demo_entitlements_enabled = 'true';",
  `ALTER DATABASE postgres SET app.demo_entitlements_allow_all = '${allowAll ? 'true' : 'false'}';`,
  `ALTER DATABASE postgres SET app.demo_entitlement_emails = '${qaEmails.replace(/'/g, "''")}';`,
];

for (const statement of statements) {
  execSync(`psql "${dbUrl}" -c "${statement}"`, { stdio: 'inherit' });
}

console.log(
  allowAll
    ? '\nDemo entitlements enabled for all authenticated users on this database. Use only for isolated local development.'
    : `\nDemo entitlements enabled for QA emails: ${qaEmails}`
);
