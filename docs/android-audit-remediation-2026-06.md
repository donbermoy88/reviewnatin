# Android Audit Remediation — June 2026

Baseline: [audit/android-principal-audit-2026-06-16.md](../audit/android-principal-audit-2026-06-16.md) and Initial Audit Findings (2026-06-23 pass).

**Verified locally:** `npm run mobile:test`, `npm run mobile:typecheck` (see Test results below).

**Hosted checks (manual):** `npm run beta:security:verify`, `npm run beta:migrations`, PostHog live project, Supabase Dashboard Auth settings.

---

## Status table

| # | Finding | Priority | Status | Evidence | Notes |
|---|---------|----------|--------|----------|-------|
| 1 | Email auto-confirm enabled in prod | P0 | **Fixed (script + gate)** | `scripts/configure-supabase-auth.mjs` (`--prod` sets `mailer_autoconfirm: false`); exits 1 if verify fails; `npm run beta:security:verify` checks hosted config | Run `npm run supabase:auth:prod` on hosted project; confirm in Dashboard |
| 2 | Demo entitlement bypass (`app.demo_entitlements_enabled=true`) | P0 | **Hardened (deploy verify pending)** | `20260616120000_harden_content_access_gate.sql`; client filters `source=demo` in prod (`entitlements.ts`); `grantDemoEntitlement` throws outside `__DEV__`; `npm run db:disable-demo-iap` | Must run `beta:security:verify` on prod DB — flag must be unset/false |
| 3 | No product analytics (PostHog) | P0 | **Implemented** | `lib/analytics/`, `providers/analytics-provider.tsx`, funnel in `funnel-catalog.ts`; events on signup/OTP/onboarding/practice/subscribe | Set `EXPO_PUBLIC_POSTHOG_API_KEY` in EAS; smoke in PostHog Live Events |
| 4 | IAP non-functional on APK sideload | P0 | **Documented + UI** | `preferWebCheckout()` → Android; `checkout-copy.ts`; guest banner + beta banners on Subscribe; `BUILDING.md` | Expected limitation until Play Console billing |
| 5 | Pricing 3-source drift | P1 | **Improved** | DB SoT via `fetchSubscriptionProducts`; display via `pricing-display.ts` (`resolveMonthlyPlusDisplay`); tests | Play Console prices override at IAP time only; fallback `₱159` is UI-only |
| 6 | No auth rate limiting | P1 | **Implemented (layered)** | Client lockout `login-lockout.ts`; Supabase OTP limits via `configure-supabase-smtp.mjs`; server RPC `check_client_login_rate_limit` + mobile `server-rate-limit.ts`; `iap-verify` rate limit | Apply migration `20260623120000_client_login_rate_limit.sql` to hosted DB |
| 7 | No CAPTCHA on signup | P1 | **Wired (env-gated)** | `configure-supabase-captcha.mjs`, `TurnstileCaptcha`, `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | Run `npm run supabase:captcha` when `TURNSTILE_SECRET_KEY` ready |
| 8 | FCM/push on sideload | P1 | **Documented (no fake impl)** | `BUILDING.md`, `docs/android-beta-program.md`, `lib/device-capabilities.ts` | Local reminders only until Play + `google-services.json` |
| 9 | No automated E2E | P1 | **Maestro suite exists** | `apps/mobile/.maestro/flows/` (6 flows); `npm run beta:maestro`; retry + report `dist/beta/last-maestro-report.json` | Premium web checkout remains manual (live payment) |
| 10 | Global search not implemented | P2 | **Deferred** | Subject search on Review tab (`study.tsx`); no cross-app global search | Out of Phase 1 scope — doc only |
| 11 | Ad interstitial placeholder | P2 | **Env-gated** | `lib/ads/config.ts` (disabled without unit IDs); `AdInterstitialModal` fallback; tests | Beta: Plus upsell modal when AdMob unset |
| 12 | Tab label "Ranks" vs "Stats" | P2 | **Intentional drift noted** | Tab 3 = Leaderboard (`Ranks`); Tab 4 = progress/profile; design doc predates leaderboard tab | Rename would mislabel leaderboard; update design doc in future pass |
| 13 | Limited entitlement/IAP tests | P2 | **Expanded** | `entitlements.test.ts`, `product-skus.test.ts`, `availability.test.ts`, `server-rate-limit.test.ts`, `ads/config.test.ts` | Edge `iap-verify` covered by migration + function rate limit |

---

## What was already fixed (prior passes)

- Server content gate hardening migration (`user_has_content_access` excludes demo/refunded/revoked).
- PostHog Phase 4 funnel events wired across auth, practice, subscribe, analytics screens.
- Phase 5 web checkout copy (`checkout-copy.ts`) and Android `preferWebCheckout()`.
- Maestro guest/premium/auth flows + `beta-maestro-run.mjs`.
- Client login lockout, disposable email block, Turnstile component, OTP verify screen.
- `verify-prod-security.mjs` and `beta:phase1:verify` gates.

## What this pass changed

- **Prod auth script verification gate** — `configure-supabase-auth.mjs` fails if auto-confirm still ON after `--prod`.
- **`npm run db:disable-demo-iap`** — ops script to reset demo entitlement GUC on hosted DB.
- **Server login rate limit** — migration + mobile `assertLoginRateLimitAllowed` before password sign-in.
- **Pricing display centralization** — `resolveMonthlyPlusDisplay` replaces scattered `₱159` fallbacks.
- **Guest subscribe copy** — `GUEST_WEB_CHECKOUT_HINT` for Android APK beta.
- **Unit tests** — pricing, checkout copy, entitlements demo filter, IAP availability, AdMob config, server rate limit.

---

## Test results

Run after changes:

```bash
npm run mobile:test
npm run mobile:typecheck
```

Optional release gates:

```bash
npm run beta:phase1:verify
npm run beta:phase4:verify
npm run beta:phase5:verify
npm run beta:security:verify   # needs .env.supabase + hosted project
npm run beta:maestro           # needs emulator + Maestro CLI
```

---

## Recommended next steps (manual)

1. **Supabase prod:** `npm run supabase:auth:prod` → `npm run beta:migrations` → `npm run db:disable-demo-iap` → `npm run beta:security:verify`.
2. **CAPTCHA:** Cloudflare Turnstile keys → `npm run supabase:captcha` → set `EXPO_PUBLIC_TURNSTILE_SITE_KEY` in EAS preview/production → rebuild APK.
3. **PostHog:** Confirm `EXPO_PUBLIC_POSTHOG_API_KEY` in EAS; complete one Guest→Signup→Practice→Subscribe funnel; verify events in PostHog.
4. **Premium cohort:** Physical device — P2 web checkout (GCash/Maya) → entitlement refresh → no ads.
5. **Play migration:** When ready, follow `docs/play-console-migration.md` for billing + FCM.
