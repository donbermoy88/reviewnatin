# Play Console Migration — APK Sideload → Internal Testing

Checklist for moving ReviewNatin Android from **direct APK distribution** (EAS `preview`) to **Google Play internal testing**, then closed/open tracks.

Prerequisites: [release-readiness-checklist.md](./release-readiness-checklist.md) score ≥ 75, all cohort smokes pass.

---

## Phase 1 — Play Console setup

| Step | Action | Owner |
|------|--------|-------|
| 1 | Create app in [Google Play Console](https://play.google.com/console) — package `ph.reviewnatin.app` | Product |
| 2 | Complete **Data safety** form (auth, analytics, crash data) | Product + Eng |
| 3 | Complete **Content rating** questionnaire | Product |
| 4 | Store listing: title, short description, screenshots (phone + 7" tablet) | Design |
| 5 | Privacy policy URL: `https://reviewnatinph.com/privacy` | — |
| 6 | Target audience / Families policy (education app, 13+) | Product |

---

## Phase 2 — Signing & build pipeline

| Item | Location / command |
|------|-------------------|
| Package name | `ph.reviewnatin.app` in `apps/mobile/app.json` |
| Production build | `cd apps/mobile && npm run eas:build:android:prod` → **AAB** |
| Submit track | `eas.json` → `submit.production.android.track: internal` |
| Version code | Bump `android.versionCode` each upload |
| OAuth SHA-1 | `npm run supabase:android` — register Play App Signing cert in Google Cloud |

**Switch testers from APK to Play:**

1. Upload AAB to **Internal testing** track.
2. Add tester emails to internal testing list (same roster as [beta-testers.md](./beta-testers.md)).
3. Deprecate Drive/Firebase APK links; note in release notes.

---

## Phase 3 — Google Play Billing (8 SKUs)

Canonical iOS SKUs map to Play product IDs in [apps/mobile/lib/iap/product-skus.ts](../apps/mobile/lib/iap/product-skus.ts):

| Play product ID | Tier |
|-----------------|------|
| `plus_monthly` | Plus monthly |
| `plus_six_months` | Plus 6 months |
| `plus_yearly` | Plus yearly |
| `exam_pass_cse_pro` | Exam pass CSE Professional |
| `exam_pass_cse_sub` | Exam pass CSE Subprofessional |
| `exam_pass_let_elem` | Exam pass LET Elementary |
| `exam_pass_let_sec` | Exam pass LET Secondary |
| `exam_pass_pnle` | Exam pass PNLE |

| Step | Action |
|------|--------|
| 1 | Create subscription + one-time products in Play Console matching IDs above |
| 2 | Set PHP pricing aligned with [05-pricing-iap.md](./05-pricing-iap.md) |
| 3 | Enable **Google Play Android Developer API** |
| 4 | Create service account; grant **Finance** permissions on the app |
| 5 | Store JSON key as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` in Supabase Edge secrets |
| 6 | Deploy `iap-verify` Edge Function; test sandbox purchase on internal track |
| 7 | Update subscribe screen: show Play Billing on Play-installed builds; keep web checkout fallback for sideload |

See [07-payments-iap-implementation.md](./07-payments-iap-implementation.md) and [10-store-webhooks.md](./10-store-webhooks.md).

---

## Phase 4 — FCM & production services

| Service | Secret / file | Notes |
|---------|---------------|-------|
| FCM | `google-services.json` in EAS secrets | Required for remote push on Play builds |
| AdMob | `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` | Production app ID in `production` profile |
| Sentry | `EXPO_PUBLIC_SENTRY_DSN` | Required for production profile |
| Supabase | Pro org — no project pause | [06-app-store-production.md](./06-app-store-production.md) |

Run `apps/mobile/scripts/check-android-release-env.mjs` before first production AAB.

---

## Phase 5 — Validation before promoting track

| Gate | Check |
|------|-------|
| Internal testing | Install from Play; signup → OTP → onboarding → quiz |
| Billing | Sandbox Plus purchase restores via Settings |
| Entitlements | `hasPremiumAccess` after Play purchase (no web-only path) |
| Push | Test notification on physical device |
| Cohort matrix | Re-run [beta-audit-matrix.md](./beta-audit-matrix.md) — update Subscribe row for Play Billing |
| Release score | [release-readiness-checklist.md](./release-readiness-checklist.md) ≥ 85 |

---

## Rollback plan

- Keep last known-good **APK** build artifact and SHA-256 for emergency sideload.
- Play Console: halt rollout if crash rate spikes; promote previous release.
- Web checkout remains available for users who subscribed during APK beta (entitlements in Supabase).

---

## Timeline suggestion

| Week | Milestone |
|------|-----------|
| 1 | Play app created; Data safety + content rating submitted |
| 2 | 8 SKUs live; service account + `iap-verify` tested |
| 3 | Internal testing AAB; 4 testers per cohort on Play install |
| 4 | Closed testing expansion; deprecate APK sideload |
