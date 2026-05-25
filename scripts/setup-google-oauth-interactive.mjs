#!/usr/bin/env node
/**
 * Opens Google Cloud + Supabase in your default browser, then waits for OAuth
 * credentials and configures everything automatically.
 *
 * Run: npm run supabase:google:setup
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.supabase');
const MOBILE_ENV = join(ROOT, 'apps/mobile/.env');
const REF = 'yohewfdafdmwntsbzgxx';
const GCP_PROJECT = 'pshs-crc-cid';

const REDIRECTS = [
  'reviewnatin://auth/callback',
  'reviewnatin://**',
  'exp://127.0.0.1:8081/--/auth/callback',
  'exp://127.0.0.1:8081/--/**',
  'exp://localhost:8081/--/auth/callback',
  `https://${REF}.supabase.co/auth/v1/callback`,
];

function loadEnv(path) {
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

function upsertEnvLines(path, entries) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8').split('\n') : [];
  const keys = new Set(Object.keys(entries));
  const kept = existing.filter((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return true;
    const i = t.indexOf('=');
    return i <= 0 || !keys.has(t.slice(0, i).trim());
  });
  writeFileSync(path, [...kept.filter(Boolean), ...Object.entries(entries).map(([k, v]) => `${k}=${v}`)].join('\n') + '\n');
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function configureSupabase(token, webClientId, webClientSecret, iosClientId) {
  const API = 'https://api.supabase.com/v1';
  const before = await fetch(`${API}/projects/${REF}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const existing = (before.uri_allow_list || '').split(',').map((s) => s.trim()).filter(Boolean);
  const uri_allow_list = [...new Set([...existing, ...REDIRECTS])].join(',');

  const patch = {
    uri_allow_list,
    external_google_enabled: true,
    external_google_client_id:
      iosClientId && iosClientId !== webClientId ? `${webClientId},${iosClientId}` : webClientId,
    external_google_secret: webClientSecret,
    external_google_skip_nonce_check: true,
  };

  const res = await fetch(`${API}/projects/${REF}/config/auth`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  console.log('\n🔐 ReviewNatin — Google Sign-In setup\n');
  console.log('Opening Google Cloud + Supabase in your browser…');
  console.log('Sign in if prompted, then follow the steps in each tab.\n');

  openUrl(`https://console.cloud.google.com/auth/overview/create?project=${GCP_PROJECT}`);
  openUrl(`https://console.cloud.google.com/auth/clients/create?project=${GCP_PROJECT}`);
  openUrl(`https://supabase.com/dashboard/project/${REF}/auth/providers?provider=Google`);

  console.log('── Google Cloud (browser tab 1 & 2) ──');
  console.log('1. OAuth consent → External → App name: ReviewNatin');
  console.log('2. Create Web client → add these redirect URIs:');
  for (const u of REDIRECTS) console.log(`   • ${u}`);
  console.log('3. Create iOS client → bundle ID: ph.reviewnatin.app (dev/App Store build — NOT Expo Go)');
  console.log('   Old host.exp.Exponent client will cause Google Error 400 on iOS.');
  console.log('4. Copy the Web Client ID + Client Secret\n');

  const webClientId = await ask('Paste Web Client ID (.apps.googleusercontent.com): ');
  const webClientSecret = await ask('Paste Web Client Secret (GOCSPX-...): ');
  const iosClientId = await ask('Paste iOS Client ID (Enter to reuse Web Client ID): ');

  if (!webClientId.includes('.apps.googleusercontent.com') || !webClientSecret.startsWith('GOCSPX-')) {
    console.error('\nInvalid Client ID or Secret format. Try again.');
    process.exit(1);
  }

  const env = loadEnv(ENV_FILE);
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('Missing SUPABASE_ACCESS_TOKEN in .env.supabase');
    process.exit(1);
  }

  console.log('\nConfiguring Supabase…');
  await configureSupabase(token, webClientId, webClientSecret, iosClientId || webClientId);

  upsertEnvLines(ENV_FILE, {
    GOOGLE_OAUTH_CLIENT_ID: webClientId,
    GOOGLE_OAUTH_CLIENT_SECRET: webClientSecret,
    GOOGLE_OAUTH_IOS_CLIENT_ID: iosClientId || webClientId,
  });
  upsertEnvLines(MOBILE_ENV, {
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: webClientId,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: iosClientId || webClientId,
  });

  console.log('\n✅ Done!');
  console.log('   • Google enabled on Supabase');
  console.log('   • apps/mobile/.env updated');
  console.log('   • Build iOS dev client: cd apps/mobile && npx expo run:ios');
  console.log('   • Then: npm run mobile:ios:dev');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
