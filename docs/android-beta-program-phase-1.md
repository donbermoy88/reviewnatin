# Phase 1 — P0 Blockers & Auth Hardening

**Sprint:** Week 1, Days 4–7  
**Status:** Code complete — cloud config (SMTP, Turnstile, hosted auth) requires manual apply  
**Current ship candidate:** [Build 28](./beta-distribution-build-28.md)

Parent program: [android-beta-program.md](./android-beta-program.md)

---

## Goal

Ship a production-grade auth path for APK beta: **6-digit email OTP**, login lockout, disposable-email block, web checkout for Plus (no Play Billing), and automated verification gates before each beta release.

---

## Deliverables checklist

### 1.1 Supabase native email OTP signup

| Item | Status | Location / command |
|------|--------|-------------------|
| Prod auth: auto-confirm OFF, OTP required | ✅ Script | `npm run supabase:auth:prod` |
| Password min length = 8 (matches app validation) | ✅ Script | `scripts/configure-supabase-auth.mjs --prod` |
| SMTP for OTP delivery (Resend) | ⏳ Manual | `npm run supabase:resend:setup` → `npm run supabase:smtp` |
| Turnstile CAPTCHA on signup | ⏳ Manual | `TURNSTILE_SECRET_KEY` in `.env.supabase` → `npm run supabase:captcha` |
| Auth rate-limit RPCs (`otp_send`, `otp_verify`, `login_attempt`) | ✅ Migration | `supabase/migrations/20260622120000_auth_rate_limits.sql` |
| Verify-email screen (6-digit OTP, resend cooldown) | ✅ | `apps/mobile/app/(auth)/verify-email.tsx` |
| Auth provider OTP methods | ✅ | `apps/mobile/providers/auth-provider.tsx` |
| Email verification gate | ✅ | `apps/mobile/providers/email-verification-gate.tsx` |
| OTP error mapping | ✅ | `apps/mobile/lib/auth/errors.ts` |

### 1.2 Login security

| Item | Status | Location |
|------|--------|----------|
| Client lockout (5 fails / 15 min) | ✅ | `apps/mobile/lib/auth/login-lockout.ts` |
| Login activity logging RPC | ✅ | `supabase/migrations/20260622120001_auth_login_events.sql` |
| Secure sign-out | ✅ | `apps/mobile/lib/auth/sign-out.ts` |
| Password strength meter (min 8, upper, number) | ✅ | `apps/mobile/lib/auth/password-strength.ts` |
| Disposable email blocklist | ✅ | `apps/mobile/lib/auth/disposable-email.ts` + DB RPC |
| Demo entitlements OFF in prod | ⏳ Verify | `npm run beta:security:verify` |

### 1.3 Beta monetization (APK sideload)

| Item | Status | Notes |
|------|--------|-------|
| Web checkout prominent on subscribe | ✅ | Android APK builds hide Play Billing |
| Document "Plus via web only" in release notes | ✅ | [android-beta-program.md](./android-beta-program.md) |

---

## Commands

### Local verification (required before ship)

```bash
# Full Phase 1 deliverable + test gate
npm run beta:phase1:verify
```

Writes `dist/beta/phase1-verify.json`. APK missing is a **warning only** (not a failure).

### Hosted Supabase (one-time + after auth changes)

Requires `.env.supabase` with `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`.

```bash
# OTP on, auto-confirm off, password min 8
npm run supabase:auth:prod

# Resend SMTP (one-time setup + re-apply)
npm run supabase:resend:setup   # RESEND_API_KEY + DNS
npm run supabase:smtp

# Auth migrations (rate limits, login events, disposable email)
npm run beta:migrations

# Turnstile CAPTCHA (after keys in .env.supabase)
npm run supabase:captcha
```

### Cloud security audit

```bash
npm run beta:security:verify
```

Checks hosted project: `mailer_autoconfirm`, `password_min_length`, demo entitlements flag, auth RPCs. Writes `dist/beta/phase1-security-verify.json`.

### Env vars

| Variable | Where | Purpose |
|----------|-------|---------|
| `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | EAS `preview` / production | Client CAPTCHA widget |
| `TURNSTILE_SECRET_KEY` | `.env.supabase` | Server — `npm run supabase:captcha` |
| `RESEND_API_KEY` | `.env.supabase` | OTP email delivery |

See `apps/mobile/.env.example` and `.env.supabase.example`.

---

## Acceptance criteria

Phase 1 is **accepted** when all of the following pass:

1. **`npm run beta:phase1:verify`** — all file checks + `mobile:test` + `mobile:typecheck` green
2. **Free cohort smoke** — signup → 6-digit OTP email → verify → onboarding (manual or Maestro)
3. **Login lockout** — 5 bad passwords → 15 min lockout message (client + server rate limit)
4. **Disposable email** — signup with `mailinator.com` (or blocklisted domain) rejected
5. **Premium cohort** — subscribe screen shows web checkout; Play Billing hidden on APK
6. **`npm run beta:security:verify`** — hosted Supabase: OTP on, demo entitlements off, RPCs present
7. **Build 28** distributed to testers with SHA-256 in release notes — [beta-distribution-build-28.md](./beta-distribution-build-28.md)

---

## Known manual follow-ups

| Step | Owner | Notes |
|------|-------|-------|
| Resend domain verified | Ops | `reviewnatinph.com` must show verified in Resend dashboard |
| Turnstile keys | Ops | Create site at [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile); add site key to EAS, secret to `.env.supabase` |
| Hosted auth apply | Eng | Run `supabase:auth:prod`, `beta:migrations`, `supabase:captcha` against prod project |
| Verify-email cold deeplink | Eng | Flaky on emulator — manual OTP path OK for beta; tracked in build 28 notes |

---

## Related docs

- [Release readiness checklist](./release-readiness-checklist.md)
- [Beta testers roster](./beta-testers.md)
- [Beta audit matrix](./beta-audit-matrix.md)
- [Security audit](../audit/security-audit.md)
