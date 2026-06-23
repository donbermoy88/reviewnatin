# Release Readiness Checklist — ReviewNatin PH

Use before every beta APK or store release. **Block release if any P0 is open.**

**Current ship candidate:** [build 36](./beta-distribution-build-36.md) (2026-06-23)

## Phase 1 — Auth hardening (2026-06-23)

Shipped in code; hosted config applied 2026-06-23. See [android-beta-program-phase-1.md](./android-beta-program-phase-1.md).

- [x] Email OTP verify screen + auth provider methods
- [x] Email verification gate (unverified users blocked)
- [x] Login lockout (5 fails / 15 min) + login events RPC
- [x] Password strength validation (min 8, upper, number)
- [x] Disposable email blocklist (client + DB RPC)
- [x] Auth rate-limit migrations (`otp_send`, `otp_verify`, `login_attempt`)
- [x] Server login rate limit RPC (`check_client_login_rate_limit`)
- [x] Web checkout path for APK beta (Play Billing hidden)
- [x] `npm run beta:phase1:verify` script + docs
- [x] Hosted: `npm run supabase:auth:prod` applied (OTP + password min 8)
- [x] Hosted: `npm run beta:migrations` applied
- [x] Hosted: SMTP live (Resend) for OTP delivery
- [ ] Hosted: Turnstile CAPTCHA (`npm run supabase:captcha`) — optional until keys ready
- [x] `npm run beta:security:verify` all green on prod project (CAPTCHA warn OK)

## Phase 2 — Screen audit & UX (2026-06-23)

See [android-beta-program-phase-2.md](./android-beta-program-phase-2.md) and [beta-route-audit-matrix.md](./beta-route-audit-matrix.md).

- [x] `toUserFacingError()` mapper + tests
- [x] No raw `error.message` in Alert.alert
- [x] ErrorState + retry on analytics, leaderboard, mistakes, bookmarks, mock-review
- [x] Accessibility on auth fields, quiz choices, tab bar, onboarding exam cards
- [x] Deep link Vitest + Maestro deeplink flow in suite
- [x] `npm run beta:phase2:verify` script + 36-route matrix
- [x] Full Maestro pass on release candidate emulator (build 36 — 5/5 flows)
- [ ] Update route matrix status column for build 36 (partial — see beta-audit-matrix)

## Phase 3 — Onboarding redesign (2026-06-23)

See [android-beta-program-phase-3.md](./android-beta-program-phase-3.md).

- [x] Step heroes + Taglish welcome headline
- [x] Dashboard preview readiness ring by proficiency
- [x] First practice deep link + step 5 CTA
- [x] Post-onboarding activation coach (PasaPath Taglish)
- [x] `onboarding_completed` with dailyMinutes + startPractice
- [x] `npm run beta:phase3:verify`
- [x] Maestro guest onboarding smoke on release candidate (build 36)

## Phase 4 — Analytics & charts (2026-06-23)

See [android-beta-program-phase-4.md](./android-beta-program-phase-4.md) and [analytics-posthog.md](./analytics-posthog.md).

- [x] PostHog provider + typed funnel events
- [x] Home dashboard charts + insight cards + `dashboard_charts_viewed`
- [x] Full `/analytics` screen with trend + subject charts
- [x] `subscription_active` on web checkout paid + store purchase
- [x] PrimaryButton reduced-motion + haptic microinteractions
- [x] `npm run beta:phase4:verify`
- [ ] PostHog live smoke on preview build (EAS env) — manual device session

## Phase 5 — Performance & subscription (2026-06-23)

See [android-beta-program-phase-5.md](./android-beta-program-phase-5.md).

- [x] Defer dashboard charts + AdMob after first interaction
- [x] Free daily limit strip + exam countdown Plus CTA
- [x] DB-authoritative pricing + web checkout copy
- [x] `npm run beta:phase5:verify`
- [x] Maestro premium subscribe on build 36

## Automated gates

- [x] `npm run mobile:test` passes (Vitest) — **156/156 pass (2026-06-23)**
- [x] `npm run beta:phase1:verify` passes locally
- [x] `npm run beta:phase2:verify` passes locally
- [x] `npm run beta:phase3:verify` passes locally
- [x] `npm run beta:phase4:verify` passes locally
- [x] `npm run beta:phase5:verify` passes locally
- [x] Product UX audit P0 items shipped (build 28+) — see [product-experience-audit-2026-06-22.md](./product-experience-audit-2026-06-22.md)
- [ ] `npm run ci:local` passes (if touching shared packages)
- [ ] `npm run release:check:android` passes (production AAB only)

## Three-cohort manual smoke (required)

Run on **build 36** — see [beta-audit-matrix.md](./beta-audit-matrix.md).

### Guest cohort (4 testers)
- [x] Guest login skip → onboarding → dashboard (Maestro v36)
- [ ] 20 Q daily practice limit → paywall
- [ ] Ads visible (Home/Study/Result)
- [x] Subscribe prompts signup (Maestro premium hint)
- [ ] Restore purchases hidden
- [x] Beta feedback report works (Maestro v36)

### Free cohort (4 testers)
- [x] Email signup → OTP verify → onboarding (Maestro v36)
- [ ] 20 Q/day limit enforced
- [ ] Mock exam preview (not full) if applicable
- [ ] AI tutor daily limit
- [ ] Ads visible
- [ ] Web checkout reachable from paywall
- [ ] Leaderboard + cloud sync

### Premium cohort (4 testers)
- [ ] Web checkout activates Plus (APK beta) — **physical device required**
- [ ] No ads
- [ ] Unlimited practice
- [ ] Full mock access
- [ ] AI tutor unlimited
- [ ] Offline pack download
- [ ] Manage subscription in Settings

## Cross-cutting

- [x] Auth OTP + disposable email block (Phase 1 code shipped)
- [ ] Offline quiz → reconnect sync
- [ ] Deep links (subscribe ✓ Maestro, pasapath, verify-email cold start)
- [ ] Zero new P0 Sentry crashes in 24h post-release
- [x] [beta-testers.md](./beta-testers.md) updated for build 36
- [ ] Release notes posted to tester group — **manual: copy from distribution doc**

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
| Security | 20% | OTP on, demo entitlements off, RLS — `beta:security:verify` ✓ |
| UX / cohort flows | 20% | All 3 cohort smokes pass |
| Performance | 15% | No jank on low-end device |
| Analytics | 10% | Events firing in beta |
| Content | 15% | Exam minimums met |
| Store config | 20% | N/A for APK beta; required for Play |

**Minimum to ship beta APK:** automated tests + Maestro + no P0 + distribute to testers.

**Current estimate (2026-06-23):** **92/100** — build 36 automated gates green; manual cohort smokes + tester group post pending.
