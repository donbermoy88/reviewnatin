# Release Readiness Checklist — ReviewNatin PH

Use before every beta APK or store release. **Block release if any P0 is open.**

## Automated gates

- [ ] `npm run mobile:test` passes (Vitest) — **116/116 pass (2026-06-22)**
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

- [ ] Auth OTP + disposable email block
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
| Security | 20% | OTP on, demo entitlements off, RLS |
| UX / cohort flows | 20% | All 3 cohort smokes pass |
| Performance | 15% | No jank on low-end device |
| Analytics | 10% | Events firing in beta |
| Content | 15% | Exam minimums met |
| Store config | 20% | N/A for APK beta; required for Play |

**Minimum to ship beta APK:** all cohort smokes + automated tests + no P0.

**Current estimate (2026-06-22):** **88/100** — build 12 shipped; Guest/Premium Maestro pass; Free OTP deeplink fix in build 13 pipeline; P2–P4 checkout manual.
