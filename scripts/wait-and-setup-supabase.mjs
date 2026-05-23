#!/usr/bin/env node
/**
 * Waits for Supabase access token, then runs full setup automatically.
 * Run: npm run supabase:setup
 *
 * Token sources (any one):
 * - File .env.supabase with SUPABASE_ACCESS_TOKEN=sbp_...
 * - ~/.supabase/access-token (after: supabase login --token sbp_...)
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_FILE = join(process.env.HOME, '.supabase', 'access-token');
const ENV_FILE = join(ROOT, '.env.supabase');
const ENV_EXAMPLE = join(ROOT, '.env.supabase.example');

function getToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  if (existsSync(ENV_FILE)) {
    const m = readFileSync(ENV_FILE, 'utf8').match(/^\s*SUPABASE_ACCESS_TOKEN\s*=\s*(\S+)/m);
    if (m && m[1] && !m[1].includes('paste')) return m[1].trim();
  }
  if (existsSync(TOKEN_FILE)) return readFileSync(TOKEN_FILE, 'utf8').trim();
  return null;
}

function openUrls() {
  const urls = [
    'https://supabase.com/dashboard/sign-in',
    'https://supabase.com/dashboard/account/tokens',
  ];
  for (const url of urls) {
    try {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } catch {
      console.log(`Open: ${url}`);
    }
  }
}

function ensureEnvTemplate() {
  if (!existsSync(ENV_FILE) && existsSync(ENV_EXAMPLE)) {
    copyFileSync(ENV_EXAMPLE, ENV_FILE);
    console.log(`Created ${ENV_FILE} — paste your token there and save the file.\n`);
  }
}

function storeCliToken(token) {
  if (existsSync(TOKEN_FILE)) return;
  const r = spawnSync('supabase', ['login', '--token', token], {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
  });
  if (r.status !== 0 && r.stderr) {
    console.warn('Note: supabase login --token:', r.stderr.trim());
  }
}

async function waitForToken(maxMs = 900000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const t = getToken();
    if (t) {
      console.log('\nAccess token detected.\n');
      return t;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function main() {
  let token = getToken();
  if (!token) {
    ensureEnvTemplate();
    console.log(`
--- Supabase sign-in (one time, ~2 minutes) ---

1. Browser: sign in at supabase.com (tab may already be open).
2. Go to Account → Access Tokens → **Generate new token**.
3. Open this file in Cursor and paste the token, then **Save**:

   ${ENV_FILE}

   SUPABASE_ACCESS_TOKEN=sbp_your_token_here

4. This script will continue automatically when the file is saved.

(Or run in your Mac Terminal:  supabase login  then  npm run supabase:setup)

`);
    openUrls();
    console.log('Waiting for token (up to 15 minutes)...\n');
    token = await waitForToken();
  }

  if (!token) {
    console.error(`
No token yet.

Paste your token into ${ENV_FILE} and run:

  npm run supabase:setup

Get a token: https://supabase.com/dashboard/account/tokens
`);
    process.exit(1);
  }

  storeCliToken(token);
  process.env.SUPABASE_ACCESS_TOKEN = token;
  execSync('node scripts/setup-supabase.mjs', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  });
}

main();
