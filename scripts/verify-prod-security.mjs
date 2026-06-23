#!/usr/bin/env node
/**
 * Verify Phase 1 production security settings on hosted Supabase.
 *
 * Checks:
 * - mailer_autoconfirm OFF (OTP required)
 * - demo entitlements flag OFF (or unset)
 * - auth RPCs present (log_auth_login_attempt, is_email_domain_blocked)
 *
 * Run: npm run beta:security:verify
 */
import { getSupabaseEnv, REPO_ROOT } from './lib/supabase-env.mjs';
import { getAuthConfig } from './lib/supabase-management-api.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function runQuery(token, projectRef, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Query failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const env = getSupabaseEnv();
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = env.SUPABASE_PROJECT_ID;

  if (!token || !ref) {
    console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.supabase');
    process.exit(1);
  }

  const checks = [];
  const ok = (name, detail = '') => {
    checks.push({ name, status: 'ok', detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const warn = (name, detail = '') => {
    checks.push({ name, status: 'warn', detail });
    console.warn(`⚠ ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const fail = (name, detail = '') => {
    checks.push({ name, status: 'fail', detail });
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  };

  console.log(`Verifying production security for ${ref}…\n`);

  try {
    const auth = await getAuthConfig(ref, token);
    if (auth.mailer_autoconfirm === false) {
      ok('mailer_autoconfirm', 'OFF — OTP required');
    } else {
      fail('mailer_autoconfirm', `expected false, got ${auth.mailer_autoconfirm}`);
    }

    if (auth.external_email_enabled !== false) {
      ok('external_email_enabled', 'ON');
    } else {
      fail('external_email_enabled', 'email auth disabled');
    }

    const minLen = auth.password_min_length ?? 6;
    if (minLen >= 8) {
      ok('password_min_length', String(minLen));
    } else {
      warn('password_min_length', `${minLen} — recommend 8 (run npm run supabase:auth:prod)`);
    }

    if (auth.security_captcha_enabled) {
      ok('security_captcha', auth.security_captcha_provider ?? 'enabled');
    } else if (env.TURNSTILE_SECRET_KEY) {
      warn('security_captcha', 'TURNSTILE_SECRET_KEY set but captcha disabled — run npm run supabase:captcha');
    } else {
      warn('security_captcha', 'disabled — optional until TURNSTILE_SECRET_KEY configured');
    }
  } catch (e) {
    fail('auth_config', e instanceof Error ? e.message : String(e));
  }

  try {
    const demoRows = await runQuery(
      token,
      ref,
      `SELECT current_setting('app.demo_entitlements_enabled', true) AS demo_flag;`,
    );
    const flag = demoRows?.[0]?.demo_flag ?? null;
    if (!flag || flag === 'false' || flag === '') {
      ok('demo_entitlements_enabled', flag || 'unset');
    } else {
      fail('demo_entitlements_enabled', `CRITICAL: flag is "${flag}" — disable in prod DB`);
    }
  } catch (e) {
    warn('demo_entitlements_enabled', e instanceof Error ? e.message : String(e));
  }

  try {
    await runQuery(
      token,
      ref,
      `SELECT proname FROM pg_proc WHERE proname = 'log_auth_login_attempt' LIMIT 1;`,
    );
    ok('log_auth_login_attempt RPC');
  } catch (e) {
    fail('log_auth_login_attempt RPC', 'run npm run beta:migrations');
  }

  try {
    await runQuery(
      token,
      ref,
      `SELECT proname FROM pg_proc WHERE proname = 'is_email_domain_blocked' LIMIT 1;`,
    );
    ok('is_email_domain_blocked RPC');
  } catch (e) {
    fail('is_email_domain_blocked RPC', 'run npm run beta:migrations');
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    checkedAt: new Date().toISOString(),
    project: ref,
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase1-security-verify.json'), JSON.stringify(report, null, 2));

  console.log(`\nReport: dist/beta/phase1-security-verify.json`);
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll security checks passed.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
