#!/usr/bin/env node
/**
 * One-time Resend + domain setup for Supabase OTP email.
 * Opens Resend in browser, collects API key, provisions reviewnatinph.com,
 * optionally pushes DNS records to Cloudflare, then runs supabase:smtp.
 *
 * Run: npm run supabase:resend:setup
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.supabase');
const DOMAIN = 'reviewnatinph.com';
const FROM_EMAIL = 'beta@reviewnatinph.com';

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

function upsertEnv(entries) {
  const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split('\n') : [];
  const keys = new Set(Object.keys(entries));
  const kept = existing.filter((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return true;
    const i = t.indexOf('=');
    return i <= 0 || !keys.has(t.slice(0, i).trim());
  });
  writeFileSync(
    ENV_FILE,
    [...kept.filter(Boolean), ...Object.entries(entries).map(([k, v]) => `${k}=${v}`)].join('\n') + '\n',
  );
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

async function resendFetch(key, path, options = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${path} (${res.status}): ${JSON.stringify(data)}`);
  return data;
}

async function ensureResendDomain(apiKey) {
  const list = await resendFetch(apiKey, '/domains');
  const existing = (list.data ?? []).find((d) => d.name === DOMAIN);
  if (existing) {
    console.log(`Resend domain ${DOMAIN}: ${existing.status}`);
    return existing;
  }
  console.log(`Adding ${DOMAIN} to Resend…`);
  const created = await resendFetch(apiKey, '/domains', {
    method: 'POST',
    body: JSON.stringify({ name: DOMAIN }),
  });
  return created;
}

async function getCloudflareZoneId(token) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  if (!data.success || !data.result?.[0]?.id) {
    throw new Error('Cloudflare zone not found for ' + DOMAIN);
  }
  return data.result[0].id;
}

async function upsertCloudflareRecord(token, zoneId, record) {
  const q = new URLSearchParams({ type: record.type, name: record.name, content: record.content });
  const list = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?${q}`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());

  const payload = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl ?? 3600,
    proxied: record.proxied ?? false,
    priority: record.priority,
  };

  const existing = list.result?.[0];
  const url = existing
    ? `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`
    : `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
  const res = await fetch(url, {
    method: existing ? 'PUT' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Cloudflare DNS ${record.type} ${record.name}: ${JSON.stringify(data.errors)}`);
  }
  console.log(`  DNS ${record.type} ${record.name} → ${record.content}`);
}

async function pushDnsToCloudflare(apiKey, cfToken) {
  const domain = await resendFetch(apiKey, `/domains/${DOMAIN}`);
  const records = domain.records ?? [];
  if (!records.length) {
    console.log('No DNS records from Resend yet — check Resend dashboard.');
    return;
  }
  const zoneId = await getCloudflareZoneId(cfToken);
  console.log(`Pushing ${records.length} DNS record(s) to Cloudflare…`);
  for (const rec of records) {
    const name = rec.name === DOMAIN ? DOMAIN : rec.name.replace(`.${DOMAIN}`, '');
    await upsertCloudflareRecord(cfToken, zoneId, {
      type: rec.type,
      name,
      content: rec.value,
      priority: rec.priority ? Number(rec.priority) : undefined,
    });
  }
  console.log('Verifying domain in Resend…');
  await resendFetch(apiKey, `/domains/${DOMAIN}/verify`, { method: 'POST' });
}

async function main() {
  const env = loadEnv();
  let apiKey = env.RESEND_API_KEY?.trim();

  console.log('\nReviewNatin — Resend SMTP setup\n');
  openUrl('https://resend.com/api-keys');
  openUrl('https://resend.com/domains');

  if (!apiKey) {
    apiKey = await ask(
      '\nPaste your Resend API key (re_… from https://resend.com/api-keys): ',
    );
  }
  if (!apiKey?.startsWith('re_')) {
    console.error('Invalid Resend API key.');
    process.exit(1);
  }

  upsertEnv({
    RESEND_API_KEY: apiKey,
    SMTP_ADMIN_EMAIL: FROM_EMAIL,
    RESEND_FROM_EMAIL: FROM_EMAIL,
  });
  console.log('Saved RESEND_API_KEY + from address to .env.supabase');

  await ensureResendDomain(apiKey);

  const cfToken = env.CLOUDFLARE_API_TOKEN?.trim();
  if (cfToken) {
    try {
      await pushDnsToCloudflare(apiKey, cfToken);
    } catch (e) {
      console.warn('Cloudflare DNS auto-setup failed:', e.message);
      console.warn('Add DNS records manually in Cloudflare, then re-run this script.');
    }
  } else {
    const domain = await resendFetch(apiKey, `/domains/${DOMAIN}`).catch(() => null);
    if (domain?.records?.length) {
      console.log('\nAdd these DNS records in Cloudflare (reviewnatinph.com):');
      for (const rec of domain.records) {
        console.log(`  ${rec.type}  ${rec.name}  →  ${rec.value}`);
      }
      console.log('\nOptional: add CLOUDFLARE_API_TOKEN to .env.supabase to automate DNS.');
    }
  }

  console.log('\nApplying Supabase SMTP config…');
  execSync('node scripts/configure-supabase-smtp.mjs', { cwd: ROOT, stdio: 'inherit' });
  console.log('\nDone. Free/Premium beta signup OTP emails should deliver.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
