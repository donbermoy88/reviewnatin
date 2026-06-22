#!/usr/bin/env node
/**
 * Push Resend domain DNS records to Cloudflare and trigger verification.
 *
 * Requires in .env.supabase:
 *   RESEND_API_KEY
 *   CLOUDFLARE_API_TOKEN
 *   CLOUDFLARE_ZONE_ID   (reviewnatinph.com zone)
 *
 * Optional:
 *   CLOUDFLARE_ACCOUNT_ID
 *
 * Run: npm run supabase:resend:dns
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.supabase');
const DOMAIN = 'reviewnatinph.com';

function loadEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const out = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return { ...out, ...process.env };
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
  if (!res.ok) {
    throw new Error(`Resend ${path} (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function cloudflareFetch(token, path, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!data.success) {
    throw new Error(`Cloudflare ${path}: ${JSON.stringify(data.errors ?? data)}`);
  }
  return data;
}

function recordNameForCloudflare(resendName) {
  if (resendName === DOMAIN) return DOMAIN;
  if (resendName.endsWith(`.${DOMAIN}`)) {
    return resendName.slice(0, -(DOMAIN.length + 1));
  }
  return resendName;
}

async function upsertDnsRecord(token, zoneId, rec) {
  const name = recordNameForCloudflare(rec.name);
  const content = rec.value;
  const q = new URLSearchParams({ type: rec.type, name });
  const list = await cloudflareFetch(token, `/zones/${zoneId}/dns_records?${q}`);

  const payload = {
    type: rec.type,
    name,
    content,
    ttl: 3600,
    proxied: false,
  };
  if (rec.type === 'MX' && rec.priority != null) {
    payload.priority = Number(rec.priority);
  }

  const existing = list.result?.[0];
  if (existing) {
    await cloudflareFetch(token, `/zones/${zoneId}/dns_records/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    console.log(`  updated ${rec.type} ${name}.${DOMAIN}`);
  } else {
    await cloudflareFetch(token, `/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`  created ${rec.type} ${name}.${DOMAIN}`);
  }
}

async function waitForResendVerified(apiKey, domainId, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const domain = await resendFetch(apiKey, `/domains/${domainId}`);
    console.log(`  Resend status: ${domain.status}`);
    if (domain.status === 'verified') return domain;
    if (i < maxAttempts - 1) {
      console.log('  Waiting 15s for DNS propagation…');
      await new Promise((r) => setTimeout(r, 15000));
      await resendFetch(apiKey, `/domains/${domainId}/verify`, { method: 'POST' }).catch(() => null);
    }
  }
  return resendFetch(apiKey, `/domains/${domainId}`);
}

async function main() {
  const env = loadEnv();
  const resendKey = env.RESEND_API_KEY?.trim();
  const cfToken = env.CLOUDFLARE_API_TOKEN?.trim();
  const zoneId = env.CLOUDFLARE_ZONE_ID?.trim();

  if (!resendKey) {
    console.error('Missing RESEND_API_KEY in .env.supabase');
    process.exit(1);
  }
  if (!cfToken) {
    console.error(`
Missing CLOUDFLARE_API_TOKEN in .env.supabase.

Create one: https://dash.cloudflare.com/profile/api-tokens
  → Create Token → Edit zone DNS → Zone: reviewnatinph.com

Add to .env.supabase:
  CLOUDFLARE_API_TOKEN=your_token
  CLOUDFLARE_ZONE_ID=19b1fa4b57943ba9c9cf89cc3455a0d8
  CLOUDFLARE_ACCOUNT_ID=4abfad3171c3b37a370f4d0ebd5f7ddc
`);
    process.exit(1);
  }
  if (!zoneId) {
    console.error('Missing CLOUDFLARE_ZONE_ID in .env.supabase');
    process.exit(1);
  }

  upsertEnv({
    CLOUDFLARE_ZONE_ID: zoneId,
    ...(env.CLOUDFLARE_ACCOUNT_ID ? {} : { CLOUDFLARE_ACCOUNT_ID: '4abfad3171c3b37a370f4d0ebd5f7ddc' }),
  });

  console.log(`\nResend + Cloudflare DNS for ${DOMAIN}`);
  console.log(`  Zone ID: ${zoneId}`);

async function getResendDomain(apiKey) {
  const list = await resendFetch(apiKey, '/domains');
  const match = (list.data ?? []).find((d) => d.name === DOMAIN);
  if (!match?.id) {
    const created = await resendFetch(apiKey, '/domains', {
      method: 'POST',
      body: JSON.stringify({ name: DOMAIN }),
    });
    return resendFetch(apiKey, `/domains/${created.id}`);
  }
  return resendFetch(apiKey, `/domains/${match.id}`);
}

  const domain = await getResendDomain(resendKey);
  const domainId = domain.id;

  const records = domain.records ?? [];
  if (!records.length) {
    throw new Error('No DNS records returned from Resend for ' + DOMAIN);
  }

  console.log(`\nPushing ${records.length} DNS record(s) to Cloudflare…`);
  for (const rec of records) {
    await upsertDnsRecord(cfToken, zoneId, rec);
  }

  console.log('\nTriggering Resend domain verification…');
  await resendFetch(resendKey, `/domains/${domainId}/verify`, { method: 'POST' });

  console.log('\nPolling verification status…');
  const verified = await waitForResendVerified(resendKey, domainId);

  if (verified.status === 'verified') {
    console.log('\n✅ reviewnatinph.com verified in Resend.');
    console.log('Applying Supabase SMTP…');
    execSync('node scripts/configure-supabase-smtp.mjs', { cwd: ROOT, stdio: 'inherit' });
    console.log('\nOTP emails from beta@reviewnatinph.com should work.');
  } else {
    console.warn(`\n⚠️  Domain not verified yet (status: ${verified.status}).`);
    console.warn('DNS can take up to 30 minutes. Re-run: npm run supabase:resend:dns');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
