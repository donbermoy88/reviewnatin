#!/usr/bin/env node
/**
 * Enable Email auth + auto-confirm (dev-friendly) via Supabase Management API.
 * Run: npm run supabase:auth
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.supabase');

function loadEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const out = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const REF = env.SUPABASE_PROJECT_ID;

if (!TOKEN || !REF) {
  console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.supabase');
  process.exit(1);
}

const API = 'https://api.supabase.com/v1';

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`API ${path} (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const before = await api(`/projects/${REF}/config/auth`);

  const patch = {
    disable_signup: false,
    external_email_enabled: true,
    mailer_autoconfirm: true,
  };

  const after = await api(`/projects/${REF}/config/auth`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

  console.log('Supabase auth configured for ReviewNatin:\n');
  console.log(`  Project:     ${REF}`);
  console.log(`  Email auth:  ${after.external_email_enabled ? 'ON' : 'OFF'}`);
  console.log(`  Auto-confirm: ${after.mailer_autoconfirm ? 'ON (no inbox needed for dev)' : 'OFF'}`);
  console.log(`  Sign-ups:    ${after.disable_signup ? 'disabled' : 'enabled'}`);

  if (before.external_email_enabled && before.mailer_autoconfirm) {
    console.log('\nNo changes needed — already configured.');
  } else {
    console.log('\nUpdated successfully. Users can sign up in the app immediately.');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
