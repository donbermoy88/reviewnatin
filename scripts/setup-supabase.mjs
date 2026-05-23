#!/usr/bin/env node
/**
 * One-command Supabase setup for ReviewNatin.
 *
 * Prerequisites (one-time):
 * 1. Sign in at https://supabase.com/dashboard
 * 2. Create token: https://supabase.com/dashboard/account/tokens
 * 3. Add to .env.supabase: SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * Run: node scripts/setup-supabase.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = {
  ...loadEnvFile(join(ROOT, '.env.supabase')),
  ...process.env,
};

const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_NAME = env.SUPABASE_PROJECT_NAME || 'reviewnatin';
const REGION = env.SUPABASE_REGION || 'ap-southeast-1';
const DB_PASSWORD = env.SUPABASE_DB_PASSWORD || randomBytes(16).toString('base64url') + 'Aa1!';

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
    throw new Error(`API ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function writeAppEnvs(project) {
  const url = `https://${project.ref}.supabase.co`;
  const anon = project.anon_key ?? project.api_keys?.find?.((k) => k.name === 'anon')?.api_key;
  const service = project.service_role_key ?? project.api_keys?.find?.((k) => k.name === 'service_role')?.api_key;

  if (!anon) {
    console.warn('Could not resolve anon key from API — fetch from dashboard Settings > API');
  }

  const mobileEnv = `EXPO_PUBLIC_SUPABASE_URL=${url}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${anon || 'PASTE_ANON_KEY_FROM_DASHBOARD'}
`;
  const marketingEnv = `NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon || 'PASTE_ANON_KEY_FROM_DASHBOARD'}
NEXT_PUBLIC_SITE_URL=https://reviewnatinph.com
`;

  writeFileSync(join(ROOT, 'apps/mobile/.env'), mobileEnv);
  writeFileSync(join(ROOT, 'apps/marketing/.env.local'), marketingEnv);

  const secrets = join(ROOT, '.env.supabase');
  const existing = existsSync(secrets) ? readFileSync(secrets, 'utf8') : '';
  const lines = [
    `SUPABASE_ACCESS_TOKEN=${TOKEN}`,
    `SUPABASE_PROJECT_ID=${project.ref}`,
    `SUPABASE_DB_PASSWORD=${DB_PASSWORD}`,
    `SUPABASE_URL=${url}`,
    `SUPABASE_ANON_KEY=${anon || ''}`,
    `SUPABASE_SERVICE_ROLE_KEY=${service || ''}`,
  ];
  const merged = `${existing}\n${lines.join('\n')}\n`.replace(/\n{3,}/g, '\n\n');
  writeFileSync(secrets, merged);

  console.log('\nWrote apps/mobile/.env and apps/marketing/.env.local');
  console.log(`Project URL: ${url}`);
}

async function main() {
  if (!TOKEN) {
    console.error(`
Missing SUPABASE_ACCESS_TOKEN.

1. Open https://supabase.com/dashboard/account/tokens
2. Sign in → Generate new token → copy it
3. Create file: ${join(ROOT, '.env.supabase')} with:

   SUPABASE_ACCESS_TOKEN=sbp_your_token_here

4. Run again: npm run supabase:setup
`);
    process.exit(1);
  }

  console.log('Fetching organizations...');
  const orgs = await api('/organizations');
  if (!orgs?.length) throw new Error('No organizations on account');
  const orgId = env.SUPABASE_ORG_ID || orgs[0].id;
  console.log(`Using org: ${orgs[0].name} (${orgId})`);

  let projectRef = env.SUPABASE_PROJECT_ID;

  if (!projectRef) {
    console.log(`Creating project "${PROJECT_NAME}" in ${REGION}...`);
    try {
      const created = await api('/projects', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: orgId,
          name: PROJECT_NAME,
          region: REGION,
          db_pass: DB_PASSWORD,
        }),
      });
      projectRef = created.id;
      console.log(`Created project ref: ${projectRef}`);
      console.log('Waiting for project to provision (90s)...');
      await new Promise((r) => setTimeout(r, 90000));
    } catch (e) {
      if (String(e).includes('already exists') || String(e).includes('409')) {
        const projects = await api('/projects');
        const existing = projects.find((p) => p.name === PROJECT_NAME);
        if (!existing) throw e;
        projectRef = existing.id;
        console.log(`Using existing project: ${projectRef}`);
      } else {
        throw e;
      }
    }
  }

  const projects = await api('/projects');
  const project = projects.find((p) => p.id === projectRef) || { ref: projectRef, id: projectRef };

  let apiKeys = [];
  try {
    apiKeys = await api(`/projects/${projectRef}/api-keys`);
  } catch {
    const detail = await api(`/projects/${projectRef}`);
    apiKeys = detail?.api_keys ?? [];
  }
  project.anon_key =
    apiKeys?.find((k) => k.name === 'anon' || k.type === 'anon' || k.tag === 'anon')?.api_key ??
    apiKeys?.[0]?.api_key;
  project.service_role_key = apiKeys?.find(
    (k) => k.name === 'service_role' || k.type === 'service_role' || k.tag === 'service_role'
  )?.api_key;

  writeAppEnvs({ ref: projectRef, ...project });

  console.log('\nLinking CLI and pushing database schema...');
  run(`npx supabase link --project-ref ${projectRef} -p "${DB_PASSWORD}"`, {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: TOKEN },
  });

  run('npx supabase db push', {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: TOKEN },
  });

  console.log('\nRunning seed SQL...');
  const seedPath = join(ROOT, 'supabase/seed/001_catalog.sql');
  run(`npx supabase db execute --file "${seedPath}" --linked`, {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: TOKEN },
  });

  console.log(`
Done! ReviewNatin Supabase is ready.

Next:
  cd ${ROOT}
  npm run mobile

Enable Email auth: Dashboard → Authentication → Providers → Email (on)
`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
