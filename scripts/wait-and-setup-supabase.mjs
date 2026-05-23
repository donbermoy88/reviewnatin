#!/usr/bin/env node
/**
 * Waits for Supabase login token, then runs full setup automatically.
 * Run: npm run supabase:setup
 */

import { spawn, execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_FILE = join(process.env.HOME, '.supabase', 'access-token');
const ENV_FILE = join(ROOT, '.env.supabase');

function getToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  if (existsSync(ENV_FILE)) {
    const m = readFileSync(ENV_FILE, 'utf8').match(/SUPABASE_ACCESS_TOKEN=(.+)/);
    if (m) return m[1].trim();
  }
  if (existsSync(TOKEN_FILE)) return readFileSync(TOKEN_FILE, 'utf8').trim();
  return null;
}

function openLogin() {
  console.log('\n--- Step 1: Sign in to Supabase (one time) ---\n');
  console.log('A browser window should open. Sign in with GitHub or email.\n');
  try {
    execSync('open "https://supabase.com/dashboard/account/tokens"', { stdio: 'inherit' });
  } catch {
    console.log('Open manually: https://supabase.com/dashboard/account/tokens');
  }
  const child = spawn('supabase', ['login'], {
    cwd: ROOT,
    stdio: 'inherit',
    detached: true,
  });
  child.unref();
}

async function waitForToken(maxMs = 300000) {
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
    openLogin();
    console.log('Waiting for login (up to 5 minutes)...');
    token = await waitForToken();
  }
  if (!token) {
    console.error(`
Still no token. Do ONE of these:

A) Run in terminal:  supabase login
    (finish sign-in in browser)

B) Create token at https://supabase.com/dashboard/account/tokens
    Save to ${ENV_FILE}:
    SUPABASE_ACCESS_TOKEN=sbp_xxxx

Then run:  npm run supabase:setup
`);
    process.exit(1);
  }

  process.env.SUPABASE_ACCESS_TOKEN = token;
  execSync('node scripts/setup-supabase.mjs', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  });
}

main();
