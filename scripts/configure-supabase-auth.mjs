#!/usr/bin/env node
/**
 * Configure Supabase Auth for ReviewNatin.
 *
 * Dev (default): email auth + auto-confirm (no inbox needed).
 * Production:    email confirmations ON, auto-confirm OFF (OTP required).
 *
 * Run:
 *   npm run supabase:auth          # dev-friendly
 *   npm run supabase:auth -- --prod # production / beta with OTP (+ SMTP if configured)
 */

import { getSupabaseEnv } from './lib/supabase-env.mjs';
import { getAuthConfig, patchAuthConfig } from './lib/supabase-management-api.mjs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.argv.includes('--prod');
const skipSmtp = process.argv.includes('--skip-smtp');

const env = getSupabaseEnv();
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const REF = env.SUPABASE_PROJECT_ID;

if (!TOKEN || !REF) {
  console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.supabase');
  process.exit(1);
}

async function main() {
  const before = await getAuthConfig(REF, TOKEN);

  const patch = isProd
    ? {
        disable_signup: false,
        external_email_enabled: true,
        mailer_autoconfirm: false,
        mailer_secure_email_change_enabled: true,
        password_min_length: 8,
      }
    : {
        disable_signup: false,
        external_email_enabled: true,
        mailer_autoconfirm: true,
      };

  const after = await patchAuthConfig(REF, TOKEN, patch);

  if (isProd && after.mailer_autoconfirm !== false) {
    console.error(
      '\n✗ Production verification failed: mailer_autoconfirm is still ON.',
      'Users would skip email OTP. Re-run after fixing Management API access or patch manually in Supabase Dashboard → Auth → Email.',
    );
    process.exit(1);
  }

  console.log(`Supabase auth configured for ReviewNatin (${isProd ? 'PRODUCTION' : 'DEV'}):\n`);
  console.log(`  Project:      ${REF}`);
  console.log(`  Email auth:   ${after.external_email_enabled ? 'ON' : 'OFF'}`);
  console.log(`  Auto-confirm: ${after.mailer_autoconfirm ? 'ON (no inbox needed)' : 'OFF (OTP required)'}`);
  console.log(`  Min password: ${after.password_min_length ?? 'default'}`);
  console.log(`  Sign-ups:     ${after.disable_signup ? 'disabled' : 'enabled'}`);

  if (isProd) {
    console.log('\n✓ Verified: mailer_autoconfirm OFF — OTP required before access.');
    console.log('Production mode: users must verify email via 6-digit OTP before access.');
    try {
      const hibp = await patchAuthConfig(REF, TOKEN, { password_hibp_enabled: true });
      if (hibp.password_hibp_enabled) {
        console.log('✓ Leaked-password protection ON.');
      }
    } catch (e) {
      console.warn(
        '\nLeaked-password protection was not enabled:',
        e instanceof Error ? e.message : e,
      );
      console.warn('Supabase requires a Pro plan or higher for password_hibp_enabled.');
    }
    if (!skipSmtp) {
      try {
        execSync('node scripts/configure-supabase-smtp.mjs', {
          cwd: ROOT,
          stdio: 'inherit',
          env: process.env,
        });
      } catch {
        try {
          execSync('node scripts/configure-supabase-smtp.mjs --otp-only', {
            cwd: ROOT,
            stdio: 'inherit',
            env: process.env,
          });
          console.warn('\nSMTP not configured — run: npm run supabase:resend:setup');
        } catch (e) {
          console.warn('\nSMTP/OTP patch failed:', e.message ?? e);
        }
      }
    }
  } else if (before.external_email_enabled && before.mailer_autoconfirm) {
    console.log('\nNo changes needed — already configured for dev.');
  } else {
    console.log('\nUpdated successfully. Users can sign up without inbox verification.');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
