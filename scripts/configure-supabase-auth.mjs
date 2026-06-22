#!/usr/bin/env node
/**
 * Configure Supabase Auth for ReviewNatin.
 *
 * Dev (default): email auth + auto-confirm (no inbox needed).
 * Production:    email confirmations ON, auto-confirm OFF (OTP required).
 *
 * Run:
 *   npm run supabase:auth          # dev-friendly
 *   npm run supabase:auth -- --prod # production / beta with OTP
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.supabase');
const isProd = process.argv.includes('--prod');

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

  const patch = isProd
    ? {
        disable_signup: false,
        external_email_enabled: true,
        mailer_autoconfirm: false,
        mailer_secure_email_change_enabled: true,
      }
    : {
        disable_signup: false,
        external_email_enabled: true,
        mailer_autoconfirm: true,
      };

  const after = await api(`/projects/${REF}/config/auth`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

  console.log(`Supabase auth configured for ReviewNatin (${isProd ? 'PRODUCTION' : 'DEV'}):\n`);
  console.log(`  Project:      ${REF}`);
  console.log(`  Email auth:   ${after.external_email_enabled ? 'ON' : 'OFF'}`);
  console.log(`  Auto-confirm: ${after.mailer_autoconfirm ? 'ON (no inbox needed)' : 'OFF (OTP required)'}`);
  console.log(`  Sign-ups:     ${after.disable_signup ? 'disabled' : 'enabled'}`);

  if (isProd) {
    console.log('\nProduction mode: users must verify email via 6-digit OTP before access.');
    console.log('Also configure SMTP in Supabase dashboard for reliable delivery.');
  } else if (before.external_email_enabled && before.mailer_autoconfirm) {
    console.log('\nNo changes needed — already configured for dev.');
  } else {
    console.log('\nUpdated successfully. Users can sign up without inbox verification.');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
