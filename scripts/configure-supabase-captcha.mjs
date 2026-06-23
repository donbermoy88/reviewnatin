#!/usr/bin/env node
/**
 * Enable Cloudflare Turnstile CAPTCHA on hosted Supabase Auth (signup protection).
 *
 * Requires in .env.supabase:
 *   TURNSTILE_SECRET_KEY  — Cloudflare Turnstile secret (server)
 *
 * Mobile app must set EXPO_PUBLIC_TURNSTILE_SITE_KEY in EAS preview/production env.
 *
 * Run: npm run supabase:captcha
 */
import { getSupabaseEnv } from './lib/supabase-env.mjs';
import { getAuthConfig, patchAuthConfig } from './lib/supabase-management-api.mjs';

async function main() {
  const env = getSupabaseEnv();
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = env.SUPABASE_PROJECT_ID;
  const secret = env.TURNSTILE_SECRET_KEY?.trim();

  if (!token || !ref) {
    console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.supabase');
    process.exit(1);
  }

  if (!secret) {
    console.error('Need TURNSTILE_SECRET_KEY in .env.supabase (Cloudflare Turnstile secret key).');
    console.error('Set EXPO_PUBLIC_TURNSTILE_SITE_KEY in EAS for the matching site key.');
    process.exit(1);
  }

  const before = await getAuthConfig(ref, token);
  const after = await patchAuthConfig(ref, token, {
    security_captcha_enabled: true,
    security_captcha_provider: 'turnstile',
    security_captcha_secret: secret,
  });

  console.log('Supabase Auth CAPTCHA configured:\n');
  console.log(`  Project:   ${ref}`);
  console.log(`  Provider:  ${after.security_captcha_provider ?? 'turnstile'}`);
  console.log(`  Enabled:   ${after.security_captcha_enabled ? 'yes' : 'no'}`);
  console.log(`  Was:       ${before.security_captcha_enabled ? 'enabled' : 'disabled'}`);
  console.log('\nNext: set EXPO_PUBLIC_TURNSTILE_SITE_KEY in EAS preview profile and rebuild APK.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
