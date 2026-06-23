# Release Readiness Checklist — ReviewNatin PH

Use before every beta APK or store release. **Block release if any P0 is open.**

## Phase 1 — Auth hardening (2026-06-23)

Shipped in code; hosted config may still need manual apply. See [android-beta-program-phase-1.md](./android-beta-program-phase-1.md).

- [x] Email OTP verify screen + auth provider methods
- [x] Email verification gate (unverified users blocked)
- [x] Login lockout (5 fails / 15 min) + login events RPC
- [x] Password strength validation (min 8, upper, number)
- [x] Disposable email blocklist (client + DB RPC)
- [x] Auth rate-limit migrations (`otp_send`, `otp_verify`, `login_attempt`)
- [x] Web checkout path for APK beta (Play Billing hidden)
- [x] `npm run beta:phase1:verify` script + docs
- [ ] Hosted: `npm run supabase:auth:prod` applied (OTP + password min 8)
- [ ] Hosted: `npm run beta:migrations` applied
- [ ] Hosted: SMTP live (Resend) for OTP delivery
- [ ] Hosted: Turnstile CAPTCHA (`npm run supabase:captcha`)
- [ ] `npm run beta:security:verify` all green on prod project

## Phase 2 — Screen audit & UX (2026-06-23)

See [android-beta-program-phase-2.md](./android-beta-program-phase-2.md) and [beta-route-audit-matrix.md](./beta-route-audit-matrix.md).

- [x] `toUserFacingError()` mapper + tests
- [x] No raw `error.message` in Alert.alert
- [x] ErrorState + retry on analytics, leaderboard, mistakes, bookmarks, mock-review
- [x] Accessibility on auth fields, quiz choices, tab bar, onboarding exam cards
- [x] Deep link Vitest + Maestro deeplink flow in suite
- [x] `npm run beta:phase2:verify` script + 36-route matrix
- [ ] Full Maestro pass on release candidate emulator
- [ ] Update route matrix status column for new build

## Phase 3 — Onboarding redesign (2026-06-23)

See [android-beta-program-phase-3.md](./android-beta-program-phase-3.md).

- [x] Step heroes + Taglish welcome headline
- [x] Dashboard preview readiness ring by proficiency
- [x] First practice deep link + step 5 CTA
- [x] Post-onboarding activation coach (PasaPath Taglish)
- [x] `onboarding_completed` with dailyMinutes + startPractice
- [x] `npm run beta:phase3:verify`
- [ ] Maestro guest onboarding smoke on release candidate

## Automated gates

- [x] `npm run mobile:test` passes (Vitest) — **124/124 pass (2026-06-22)**
- [x] `npm run beta:phase1:verify` passes locally
- [x] `npm run beta:phase2:verify` passes locally
- [x] `npm run beta:phase3:verify` passes locally
- [ ] Product UX audit P0 items shipped — see [product-experience-audit-2026-06-22.md](./product-experience-audit-2026-06-22.md)
- [ ] `npm run ci:local` passes (if touching shared packages)
- [ ] `npm run release:check:android` passes (production AAB only)

## Three-cohort manual smoke (required)

Run on latest APK — see [beta-audit-matrix.md](./beta-audit-matrix.md).

### Guest cohort (4 testers)
- [ ] Guest login skip → onboarding → dashboard
- [ ] 20 Q daily practice limit → paywall
- [ ] Ads visible (Home/Study/Result)
- [ ] Subscribe prompts signup
- [ ] Restore purchases hidden
- [ ] Beta feedback report works

### Free cohort (4 testers)
- [ ] Email signup → OTP verify → onboarding
- [ ] 20 Q/day limit enforced
- [ ] Mock exam preview (not full) if applicable
- [ ] AI tutor daily limit
- [ ] Ads visible
- [ ] Web checkout reachable from paywall
- [ ] Leaderboard + cloud sync

### Premium cohort (4 testers)
- [ ] Web checkout activates Plus (APK beta)
- [ ] No ads
- [ ] Unlimited practice
- [ ] Full mock access
- [ ] AI tutor unlimited
- [ ] Offline pack download
- [ ] Manage subscription in Settings

## Cross-cutting

- [x] Auth OTP + disposable email block (Phase 1 code shipped)
- [ ] Offline quiz → reconnect sync
- [ ] Deep links (subscribe, pasapath) open correct screen
- [ ] Zero new P0 Sentry crashes in 24h post-release
- [ ] [beta-testers.md](./beta-testers.md) updated
- [ ] Release notes posted

## Production-only (Play Store)

- [ ] Play Billing SKUs live
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` in Supabase
- [ ] FCM `google-services.json`
- [ ] Real AdMob + Sentry env in EAS production
- [ ] Supabase Pro (no free-tier pause)
- [ ] Content QA gates per [06-content-pipeline.md](./06-content-pipeline.md)

## Release readiness score

| Category | Weight | Pass criteria |
|----------|--------|---------------|
| P0 bugs | Blocker | Zero open |
| Security | 20% | OTP on, demo entitlements off, RLS — Phase 1 scripts ready; run `beta:security:verify` |
| UX / cohort flows | 20% | All 3 cohort smokes pass |
| Performance | 15% | No jank on low-end device |
| Analytics | 10% | Events firing in beta |
| Content | 15% | Exam minimums met |
| Store config | 20% | N/A for APK beta; required for Play |

**Minimum to ship beta APK:** all cohort smokes + automated tests + no P0.

**Current estimate (2026-06-23):** **90/100** — Phase 1 auth hardening shipped; build 28 current; hosted SMTP/Turnstile/security verify pending manual apply.
