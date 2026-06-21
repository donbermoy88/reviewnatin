#!/usr/bin/env node
/**
 * Enable Google Sign-In on Supabase + write mobile env vars.
 *
 * Prerequisites (one-time in Google Cloud Console):
 * 1. https://console.cloud.google.com/apis/credentials
 * 2. OAuth consent screen → External → add test users if in Testing mode
 * 3. Create OAuth client IDs:
 *    - Web application (for Supabase + token exchange)
 *    - iOS (bundle: ph.reviewnatin.app for dev/production builds — NOT Expo Go)
 *    - Android (package: ph.reviewnatin.app, SHA-1 from npm run supabase:android)
 *
 * Add to .env.supabase:
 *   GOOGLE_OAUTH_CLIENT_ID=....apps.googleusercontent.com
 *   GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
 *   GOOGLE_OAUTH_IOS_CLIENT_ID=....apps.googleusercontent.com   (optional)
 *   GOOGLE_OAUTH_ANDROID_CLIENT_ID=....apps.googleusercontent.com   (required for Android)
 *
 * Authorized redirect URIs (Web client):
 *   reviewnatin://auth/callback
 *   exp://127.0.0.1:8081/--/auth/callback
 *   exp://localhost:8081/--/auth/callback
 *   https://yohewfdafdmwntsbzgxx.supabase.co/auth/v1/callback
 *
 * Run: npm run supabase:google
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.supabase');
const MOBILE_ENV = join(ROOT, 'apps/mobile/.env');

const MOBILE_REDIRECTS = [
  'reviewnatin://auth/callback',
  'reviewnatin://**',
  'exp://**',
  'exp://127.0.0.1:8081/--/auth/callback',
  'exp://127.0.0.1:8081/--/**',
  'exp://localhost:8081/--/auth/callback',
  'exp://localhost:8081/--/**',
];

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

function upsertEnvLines(path, entries) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8').split('\n') : [];
  const map = new Map();
  for (const line of existing) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) map.set(t.slice(0, i).trim(), line);
  }
  for (const [key, value] of Object.entries(entries)) {
    map.set(key, `${key}=${value}`);
  }
  const kept = existing.filter((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return true;
    const i = t.indexOf('=');
    if (i <= 0) return true;
    return !Object.prototype.hasOwnProperty.call(entries, t.slice(0, i).trim());
  });
  const merged = [...kept.filter((l) => l.trim() !== ''), ...Object.keys(entries).map((k) => map.get(k))];
  writeFileSync(path, merged.join('\n') + '\n');
}

const env = { ...loadEnvFile(ENV_FILE), ...process.env };
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const REF = env.SUPABASE_PROJECT_ID || 'yohewfdafdmwntsbzgxx';
const WEB_CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const WEB_CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
const IOS_CLIENT_ID = env.GOOGLE_OAUTH_IOS_CLIENT_ID || WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = env.GOOGLE_OAUTH_ANDROID_CLIENT_ID;

if (!TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN in .env.supabase');
  console.error('Get one at https://supabase.com/dashboard/account/tokens');
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

function mergeRedirectAllowList(current) {
  const existing = (current || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const supabaseCallback = `https://${REF}.supabase.co/auth/v1/callback`;
  const all = [...new Set([...existing, ...MOBILE_REDIRECTS, supabaseCallback])];
  return all.join(',');
}

async function main() {
  const before = await api(`/projects/${REF}/config/auth`);

  const patch = {
    uri_allow_list: mergeRedirectAllowList(before.uri_allow_list),
    // HTTPS fallback only — custom schemes here break Safari after OAuth
    site_url: `https://${REF}.supabase.co`,
  };

  if (WEB_CLIENT_ID && WEB_CLIENT_SECRET) {
    patch.external_google_enabled = true;
    // Comma-separated = allowed ID-token audiences (Web first, then native app client IDs).
    // Do NOT use signInWithOAuth on mobile.
    patch.external_google_client_id = [
      WEB_CLIENT_ID,
      IOS_CLIENT_ID,
      ANDROID_CLIENT_ID,
    ]
      .filter(Boolean)
      .filter((id, index, ids) => ids.indexOf(id) === index)
      .join(',');
    patch.external_google_secret = WEB_CLIENT_SECRET;
    patch.external_google_skip_nonce_check = true;
  }

  const after = await api(`/projects/${REF}/config/auth`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

  console.log('Supabase Google auth configuration:\n');
  console.log(`  Project:          ${REF}`);
  console.log(`  Redirect URLs:    updated (${MOBILE_REDIRECTS.length + 1} mobile + Supabase callback)`);
  console.log(`  Google provider:  ${after.external_google_enabled ? 'ON' : 'OFF (add GOOGLE_OAUTH_* to .env.supabase)'}`);

  if (WEB_CLIENT_ID && WEB_CLIENT_SECRET) {
    upsertEnvLines(MOBILE_ENV, {
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: WEB_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: IOS_CLIENT_ID,
      ...(ANDROID_CLIENT_ID
        ? { EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: ANDROID_CLIENT_ID }
        : {}),
    });
    console.log(`  Mobile .env:      EXPO_PUBLIC_GOOGLE_* written`);
    console.log('\nGoogle Sign-In ready.');
    console.log('  iOS: create OAuth client with bundle ph.reviewnatin.app in Google Cloud, then:');
    console.log('       npm run supabase:google && cd apps/mobile && npx expo prebuild --platform ios --clean && npm run ios:run');
    console.log('  Android: create OAuth client with package ph.reviewnatin.app + SHA-1, then:');
    console.log('       npm run supabase:android && npm run supabase:google && cd apps/mobile && npm run android');
  } else {
    console.log('\nNext steps — add to .env.supabase:');
    console.log('  GOOGLE_OAUTH_CLIENT_ID=your-web-client-id.apps.googleusercontent.com');
    console.log('  GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...');
    console.log('  GOOGLE_OAUTH_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com  # optional');
    console.log('  GOOGLE_OAUTH_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com');
    console.log('\nGoogle Cloud → Credentials → Web client → Authorized redirect URIs:');
    for (const uri of [...MOBILE_REDIRECTS, `https://${REF}.supabase.co/auth/v1/callback`]) {
      console.log(`  • ${uri}`);
    }
    console.log('\nThen run: npm run supabase:google');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
