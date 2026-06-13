import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const migration = readFileSync('supabase/migrations/20260613102133_restrict_demo_entitlements_to_qa.sql', 'utf8');
const enableScript = readFileSync('scripts/enable-demo-iap.mjs', 'utf8');

test('demo entitlement migration keeps QA allowlist guard', () => {
  assert.match(migration, /app\.demo_entitlements_enabled/);
  assert.match(migration, /app\.demo_entitlement_emails/);
  assert.match(migration, /restricted to QA accounts/);
  assert.match(migration, /app\.demo_entitlements_allow_all/);
});

test('demo entitlement enable script defaults to allowlisted QA emails', () => {
  assert.match(enableScript, /QA_PLUS_EMAILS/);
  assert.match(enableScript, /app\.demo_entitlement_emails/);
  assert.match(enableScript, /DEMO_ENTITLEMENTS_ALLOW_ALL/);
  assert.match(enableScript, /Use only for isolated local development/);
});
