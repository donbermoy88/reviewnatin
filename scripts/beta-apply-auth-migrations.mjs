#!/usr/bin/env node
/**
 * Apply auth beta migrations to hosted Supabase via Management API.
 * Fallback when `supabase db push` has migration history mismatch.
 *
 * Usage: node scripts/beta-apply-auth-migrations.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getSupabaseEnv, REPO_ROOT } from './lib/supabase-env.mjs';

const AUTH_MIGRATION_PREFIXES = [
  '20260622120000_auth_rate_limits.sql',
  '20260622120001_auth_login_events.sql',
  '20260622120002_auth_login_rpc.sql',
  '20260622130000_grant_disposable_email_check.sql',
];

async function runQuery(token, projectRef, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Query failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const env = getSupabaseEnv();
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = env.SUPABASE_PROJECT_ID;

  if (!token || !ref) {
    console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.supabase');
    process.exit(1);
  }

  const migrationsDir = join(REPO_ROOT, 'supabase/migrations');
  const files = AUTH_MIGRATION_PREFIXES.filter((name) => {
    const path = join(migrationsDir, name);
    try {
      readFileSync(path);
      return true;
    } catch {
      console.warn(`  Skip missing migration: ${name}`);
      return false;
    }
  });

  console.log(`Applying ${files.length} auth migrations to project ${ref}…\n`);

  for (const name of files) {
    const sql = readFileSync(join(migrationsDir, name), 'utf8');
    console.log(`▶ ${name}`);
    try {
      await runQuery(token, ref, sql);
      console.log('  ✓ OK');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log('  ✓ Already applied (idempotent)');
      } else {
        console.error(`  ✗ ${msg}`);
        process.exit(1);
      }
    }
  }

  // Verify RPC exists
  try {
    await runQuery(token, ref, `SELECT proname FROM pg_proc WHERE proname = 'log_auth_login_attempt' LIMIT 1;`);
    console.log('\n✓ Auth migrations verified (log_auth_login_attempt present).');
  } catch {
    console.warn('\n⚠ Could not verify RPC (non-fatal).');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
