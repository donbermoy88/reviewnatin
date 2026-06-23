#!/usr/bin/env node
/**
 * Mark a web checkout session as paid (Premium beta testing).
 *
 * Use after tester taps "I sent payment" on reviewnatinph.com/checkout,
 * or to unblock a stuck submitted session during P1–P4 QA.
 *
 * Usage:
 *   npm run beta:premium:fulfill -- RN-XXXXXXXX
 *   npm run beta:premium:fulfill -- --list
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './lib/supabase-env.mjs';

function usage() {
  console.log(`Usage:
  npm run beta:premium:fulfill -- RN-XXXXXXXX
  npm run beta:premium:fulfill -- --list`);
}

async function main() {
  const arg = process.argv[2];
  const env = getSupabaseEnv();
  const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
    process.exit(1);
  }

  const admin = createClient(url, key);

  if (arg === '--list') {
    const { data, error } = await admin
      .from('web_checkout_sessions')
      .select('reference_code, status, provider, amount_php, submitted_at, users(email)')
      .in('status', ['pending', 'submitted'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    if (!data?.length) {
      console.log('No pending/submitted checkout sessions.');
      return;
    }
    for (const row of data) {
      const email = Array.isArray(row.users) ? row.users[0]?.email : row.users?.email;
      console.log(`${row.reference_code} · ${row.status} · ₱${row.amount_php} · ${row.provider} · ${email ?? '—'}`);
    }
    return;
  }

  if (!arg?.trim()) {
    usage();
    process.exit(1);
  }

  const ref = arg.trim();
  const { data, error } = await admin.rpc('fulfill_web_checkout', {
    p_reference_code: ref,
    p_auto_demo: false,
  });

  if (error) {
    console.error(`Fulfill failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`✓ Fulfilled ${ref}`);
  console.log(JSON.stringify(data, null, 2));
  console.log('\nTester: return to ReviewNatin app → Subscribe → tap "Payment pending" to refresh.');
}

main();
