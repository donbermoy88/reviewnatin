#!/usr/bin/env node
/**
 * Configure Supabase Auth SMTP + OTP email settings for ReviewNatin beta.
 *
 * Uses Management API (no dashboard clicks). Reads credentials from .env.supabase:
 *   RESEND_API_KEY          → Resend SMTP (smtp.resend.com:465, user resend)
 *   SMTP_HOST / SMTP_*      → any SMTP provider override
 *   GMAIL_USER + GMAIL_APP_PASSWORD → Gmail SMTP fallback
 *
 * Run:
 *   npm run supabase:smtp
 *   npm run supabase:smtp -- --verify lbermoy@example.com
 *   npm run supabase:smtp -- --otp-only   # OTP templates/rate limits without SMTP
 */

import { getSupabaseEnv } from './lib/supabase-env.mjs';
import { getAuthConfig, patchAuthConfig } from './lib/supabase-management-api.mjs';

const args = process.argv.slice(2);
const otpOnly = args.includes('--otp-only');
const verifyEmail = args.includes('--verify') ? args[args.indexOf('--verify') + 1] : null;

const OTP_CONFIRMATION_SUBJECT = 'Your ReviewNatin verification code';
const OTP_CONFIRMATION_TEMPLATE = `<h2>Verify your ReviewNatin account</h2>
<p>Ang iyong 6-digit code:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Valid for 1 hour. Huwag i-share ang code na ito.</p>`;

function resolveSmtpConfig(env) {
  if (env.SMTP_HOST && env.SMTP_PASS) {
    return {
      smtp_host: env.SMTP_HOST,
      smtp_port: Number(env.SMTP_PORT || 587),
      smtp_user: env.SMTP_USER || '',
      smtp_pass: env.SMTP_PASS,
      smtp_admin_email: env.SMTP_ADMIN_EMAIL || env.SMTP_FROM || 'no-reply@reviewnatinph.com',
      smtp_sender_name: env.SMTP_SENDER_NAME || 'ReviewNatin PH',
    };
  }

  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    return {
      smtp_host: 'smtp.gmail.com',
      smtp_port: Number(env.SMTP_PORT || 587),
      smtp_user: env.GMAIL_USER,
      smtp_pass: env.GMAIL_APP_PASSWORD,
      smtp_admin_email: env.SMTP_ADMIN_EMAIL || env.GMAIL_USER,
      smtp_sender_name: env.SMTP_SENDER_NAME || 'ReviewNatin PH',
    };
  }

  const resendKey = env.RESEND_API_KEY?.trim();
  if (resendKey) {
    return {
      smtp_host: 'smtp.resend.com',
      smtp_port: Number(env.SMTP_PORT || 465),
      smtp_user: 'resend',
      smtp_pass: resendKey,
      smtp_admin_email:
        env.SMTP_ADMIN_EMAIL || env.RESEND_FROM_EMAIL || 'beta@reviewnatinph.com',
      smtp_sender_name: env.SMTP_SENDER_NAME || 'ReviewNatin PH',
    };
  }

  return null;
}

function otpPatch(includeRateLimit) {
  const patch = {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    mailer_otp_length: 6,
    mailer_otp_exp: 3600,
    rate_limit_otp: 30,
    mailer_subjects_confirmation: OTP_CONFIRMATION_SUBJECT,
    mailer_templates_confirmation_content: OTP_CONFIRMATION_TEMPLATE,
  };
  if (includeRateLimit) {
    patch.rate_limit_email_sent = Number(process.env.BETA_EMAIL_RATE_LIMIT || 120);
  }
  return patch;
}

async function verifyResendDomain(env, fromEmail) {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, reason: 'no RESEND_API_KEY' };

  const domain = fromEmail.split('@')[1];
  if (!domain || domain === 'resend.dev') {
    return { ok: false, reason: 'using resend.dev test domain' };
  }

  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    return { ok: false, reason: `Resend domains API ${res.status}` };
  }
  const domains = await res.json();
  const list = Array.isArray(domains?.data) ? domains.data : [];
  const match = list.find((d) => d.name === domain);
  if (!match) {
    return { ok: false, reason: `domain ${domain} not in Resend — run npm run supabase:resend:setup` };
  }
  if (match.status !== 'verified') {
    return { ok: false, reason: `domain ${domain} status=${match.status}` };
  }
  return { ok: true, domain: match.name };
}

async function sendResendTest(env, to) {
  const key = env.RESEND_API_KEY?.trim();
  if (!key || !to) return;
  const from =
    env.SMTP_ADMIN_EMAIL || env.RESEND_FROM_EMAIL || 'beta@reviewnatinph.com';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `ReviewNatin PH <${from}>`,
      to: [to],
      subject: 'ReviewNatin SMTP test',
      html: '<p>SMTP automation test — OTP emails should work.</p>',
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`Resend test email failed (${res.status}):`, JSON.stringify(body));
  } else {
    console.log(`Test email queued via Resend → ${to} (id: ${body.id ?? 'ok'})`);
  }
}

async function main() {
  const env = getSupabaseEnv();
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = env.SUPABASE_PROJECT_ID;

  if (!token || !ref) {
    console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.supabase');
    process.exit(1);
  }

  const smtp = resolveSmtpConfig(env);
  if (!otpOnly && !smtp) {
    console.error(`
No SMTP credentials found in .env.supabase.

Add one of:
  RESEND_API_KEY=re_...                    # recommended (Resend SMTP)
  SMTP_HOST=... SMTP_PASS=... SMTP_ADMIN_EMAIL=...
  GMAIL_USER=... GMAIL_APP_PASSWORD=...

Quick setup: npm run supabase:resend:setup

Or apply OTP templates only: npm run supabase:smtp -- --otp-only
`);
    process.exit(1);
  }

  const before = await getAuthConfig(ref, token);
  const patch = otpPatch(!otpOnly && Boolean(smtp));
  if (!otpOnly && smtp) {
    Object.assign(patch, smtp);
  }

  const after = await patchAuthConfig(ref, token, patch);

  console.log('Supabase Auth email configured:\n');
  console.log(`  Project:           ${ref}`);
  console.log(`  SMTP host:         ${after.smtp_host ?? '(unchanged)'}`);
  console.log(`  SMTP from:         ${after.smtp_admin_email ?? '(unchanged)'}`);
  console.log(`  OTP length:        ${after.mailer_otp_length}`);
  console.log(`  Email rate limit:  ${after.rate_limit_email_sent}/hr`);
  console.log(`  Auto-confirm:      ${after.mailer_autoconfirm ? 'ON' : 'OFF'}`);

  if (smtp?.smtp_admin_email && env.RESEND_API_KEY) {
    const domainCheck = await verifyResendDomain(env, smtp.smtp_admin_email);
    if (domainCheck.ok) {
      console.log(`  Resend domain:     verified (${domainCheck.domain})`);
    } else {
      console.warn(`  Resend domain:     ${domainCheck.reason}`);
      console.warn('  Beta testers need a verified domain — run: npm run supabase:resend:setup');
    }
  }

  if (verifyEmail) {
    await sendResendTest(env, verifyEmail);
  }

  if (before.mailer_otp_length !== 6) {
    console.log('\nFixed mailer_otp_length 8 → 6 to match the app OTP UI.');
  }
  if (before.rate_limit_email_sent != null && before.rate_limit_email_sent < 30 && after.rate_limit_email_sent) {
    console.log(`Raised rate_limit_email_sent ${before.rate_limit_email_sent} → ${after.rate_limit_email_sent}.`);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
