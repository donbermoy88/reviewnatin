#!/usr/bin/env node
/**
 * One-time Vercel setup for ReviewNatin monorepo.
 * Requires: `npx vercel login` first, or VERCEL_TOKEN env var.
 *
 * Creates two projects (root directories set in Vercel):
 *   reviewnatin-marketing  → apps/marketing  (reviewnatinph.com)
 *   reviewnatin-admin      → apps/admin      (admin.reviewnatinph.com)
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function run(cmd, opts = {}) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

function vercel(args) {
  const r = spawnSync('npx', ['vercel', ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function addEnv(project, key, value) {
  const escaped = value.replace(/'/g, "'\\''");
  for (const target of ['production', 'development']) {
    run(
      `npx vercel link --yes --project ${project} && npx vercel env add ${key} ${target} --value '${escaped}' --yes --force`,
    );
  }
}

const marketingEnv = loadEnvFile(join(root, 'apps/marketing/.env.local'));
const adminEnv = loadEnvFile(join(root, 'apps/admin/.env.local'));

const sharedPublic = {
  NEXT_PUBLIC_SUPABASE_URL: marketingEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: marketingEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

if (!sharedPublic.NEXT_PUBLIC_SUPABASE_URL || !sharedPublic.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing apps/marketing/.env.local Supabase vars.');
  process.exit(1);
}

console.log('ReviewNatin Vercel setup\n');

function ensureProject(name) {
  const check = spawnSync('npx', ['vercel', 'project', 'inspect', name], {
    cwd: root,
    stdio: 'pipe',
    env: process.env,
  });
  if (check.status !== 0) {
    console.log(`Creating project ${name}...`);
    vercel(['project', 'add', name]);
  }
}

ensureProject('reviewnatin-marketing');
ensureProject('reviewnatin-admin');

console.log('=== Marketing (reviewnatinph.com) ===');
for (const [key, value] of Object.entries({
  ...sharedPublic,
  NEXT_PUBLIC_SITE_URL: marketingEnv.NEXT_PUBLIC_SITE_URL ?? 'https://reviewnatinph.com',
})) {
  if (value) addEnv('reviewnatin-marketing', key, value);
}

vercel(['link', '--yes', '--project', 'reviewnatin-marketing']);
vercel(['deploy', '--prod', '--yes', '--archive=tgz']);

console.log('\n=== Admin (admin.reviewnatinph.com) ===');
for (const [key, value] of Object.entries({
  ...sharedPublic,
  SUPABASE_SERVICE_ROLE_KEY: adminEnv.SUPABASE_SERVICE_ROLE_KEY,
})) {
  if (value) addEnv('reviewnatin-admin', key, value);
}

vercel(['link', '--yes', '--project', 'reviewnatin-admin']);
vercel(['deploy', '--prod', '--yes', '--archive=tgz']);

console.log('\nDone. Connect GitHub in Vercel → Account Settings → Login Connections.');
console.log('Then link donbermoy88/reviewnatin to both projects for auto-deploy on push.');
console.log('Domains: reviewnatinph.com, www.reviewnatinph.com, admin.reviewnatinph.com');
