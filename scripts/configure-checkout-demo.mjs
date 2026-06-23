#!/usr/bin/env node
/**
 * Enable instant demo fulfillment for web checkout (beta QA only).
 *
 * Sets Supabase Edge secret CHECKOUT_DEMO_MODE=true on web-checkout-submit.
 * When enabled, checkout confirm with confirm_demo:true auto-grants Plus.
 *
 * Usage:
 *   npm run checkout:demo:on
 *   npm run checkout:demo:off
 */
import { execSync } from 'node:child_process';
import { getSupabaseEnv, REPO_ROOT } from './lib/supabase-env.mjs';

const on = !process.argv.includes('--off');
const env = getSupabaseEnv();
const ref = env.SUPABASE_PROJECT_ID;

if (!ref) {
  console.error('Need SUPABASE_PROJECT_ID in .env.supabase');
  process.exit(1);
}

const value = on ? 'true' : 'false';
console.log(`${on ? 'Enabling' : 'Disabling'} CHECKOUT_DEMO_MODE on project ${ref}…`);

try {
  execSync(`supabase secrets set CHECKOUT_DEMO_MODE=${value} --project-ref ${ref}`, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
} catch {
  console.error('\nFailed. Ensure `supabase login` and Supabase CLI are installed.');
  process.exit(1);
}

console.log(`\n✓ CHECKOUT_DEMO_MODE=${value}`);
if (on) {
  console.log(`
Next:
1. Marketing: set NEXT_PUBLIC_CHECKOUT_DEMO=true on reviewnatinph.com (or use in-app beta confirm on build 37+).
2. Optional EAS: EXPO_PUBLIC_CHECKOUT_DEMO=true on preview profile.
3. Run premium checkout test — see docs/premium-web-checkout-test-runbook.md
`);
} else {
  console.log('Demo checkout disabled. Live GCash/Maya + admin fulfill still work.');
}
