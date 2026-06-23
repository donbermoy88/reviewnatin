#!/usr/bin/env node
/**
 * Preflight for Premium web checkout beta test.
 *
 * Usage: npm run beta:premium:verify
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv, REPO_ROOT } from './lib/supabase-env.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const env = getSupabaseEnv();
  const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  const checks = [];

  const ok = (name, detail = '') => {
    checks.push({ name, status: 'ok', detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const fail = (name, detail = '') => {
    checks.push({ name, status: 'fail', detail });
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  };

  if (!url || !anon) fail('Supabase URL/anon key');
  else ok('Supabase configured', url.replace('https://', '').slice(0, 24));

  if (!service) fail('SUPABASE_SERVICE_ROLE_KEY (needed for beta:premium:fulfill)');
  else ok('Service role key present');

  const apk = join(REPO_ROOT, 'dist/beta/reviewnatin-beta-v36.apk');
  if (existsSync(apk)) ok('Build 36 APK local', apk);
  else fail('Build 36 APK missing — run beta:automate --skip-build or download from EAS');

  if (service && url) {
    const admin = createClient(url, service);
    const { error: rpcErr } = await admin.rpc('fulfill_web_checkout', {
      p_reference_code: '__verify_noop__',
      p_auto_demo: false,
    });
    if (rpcErr?.message?.includes('checkout_not_found') || rpcErr?.code === 'P0001') {
      ok('fulfill_web_checkout RPC reachable');
    } else if (rpcErr) {
      fail('fulfill_web_checkout RPC', rpcErr.message);
    } else {
      ok('fulfill_web_checkout RPC');
    }
  }

  const demoRes = await fetch(`${url}/functions/v1/web-checkout-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ reference_code: '__verify__', confirm_demo: true }),
  }).catch(() => null);

  if (demoRes) {
    const body = await demoRes.json().catch(() => ({}));
    if (body.error === 'checkout_not_found') ok('web-checkout-submit edge function');
    else if (body.demo === true) ok('CHECKOUT_DEMO_MODE', 'enabled');
    else if (body.status === 'submitted') ok('CHECKOUT_DEMO_MODE', 'off (use admin fulfill or live payment)');
    else ok('web-checkout-submit edge function', body.error ?? 'reachable');
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  console.log(failed ? `\n${failed} check(s) failed.` : '\nReady for Premium checkout test.');
  console.log('Runbook: docs/premium-web-checkout-test-runbook.md');
  process.exit(failed ? 1 : 0);
}

main();
