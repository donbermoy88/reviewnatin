# Android Emulator Beta Audit — 2026-06-22

**Device:** emulator-5554 (Android API 35)  
**Package:** `ph.reviewnatin.app` (dev client)  
**Build:** master @ 1305dc4 + Phase 2 follow-up  
**Method:** adb deep links, logcat, screencap, Vitest

---

## Executive summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| App stability | 9/10 | No FATAL crashes during audit; dev launcher when Metro idle |
| Guest cohort UX | 8/10 | Subscribe guest CTA verified; deep links work |
| Free cohort UX | 7/10 | Signup→OTP path code-complete; OTP not end-to-end tested (needs prod SMTP) |
| Premium cohort UX | 7/10 | Web checkout primary on Android; Plus activation needs live checkout |
| Release readiness (APK beta) | **72/100** | Ready for first tester APK after EAS build + Supabase prod auth |

---

## Automated tests

```
npm run mobile:test → 22 files, 110 tests PASS
```

Maestro: **not installed** on host (`maestro` CLI missing). Flows exist at `apps/mobile/.maestro/flows/`.

---

## Cohort audit results

### Guest (G1–G4) — partially verified

| Check | Result | Evidence |
|-------|--------|----------|
| App launches | ✓ | Dev client opens without crash |
| Deep link login | ✓ | `reviewnatin://login` delivered |
| Deep link subscribe | ✓ | Screenshot: guest paywall with "Mag-log in muna" + Sign up CTA |
| Dev build banner | ✓ | Subscribe shows Play Billing deferred message |
| Guest skip login flow | — | Requires manual tap (not automated) |
| 20 Q limit | — | Not exercised this session |
| Ads visible | — | AdMob test IDs; not visually confirmed |

### Free (F1–F4) — code verified, runtime partial

| Check | Result | Notes |
|-------|--------|-------|
| Signup screen | ✓ | Route exists; password strength meter wired |
| OTP screen | ✓ | `verify-email.tsx` with 6-digit input, resend cooldown |
| Email delivery | ✗ blocked | Requires `npm run supabase:auth:prod` + SMTP on hosted project |
| 20 Q/day limit | — | Server RPC; not exercised |

### Premium (P1–P4) — partial

| Check | Result | Notes |
|-------|--------|-------|
| Web checkout CTA | ✓ | `preferWebCheckout()` on Android; GCash/Maya path in subscribe |
| Play Billing | N/A | Correctly de-emphasized on APK sideload |
| No ads when Plus | — | Needs active entitlement to verify |

---

## P0 / P1 / P2 findings

### P0 — none observed

No crashes or data-loss paths found in this session.

### P1

1. **OTP email requires hosted Supabase prod config** — run `npm run supabase:auth:prod` and configure SMTP before Free/Premium cohort signup tests.
2. **Maestro CLI not installed** — install for CI-style cohort smokes: `curl -Ls https://get.maestro.mobile.dev | bash`

### P2

1. **Dev client shows Expo Dev Launcher** when Metro not connected to current bundle — testers need preview APK, not dev client.
2. **Global search** — subject filter added on Study tab; full global search still backlog.

### P3

1. Subscribe dev banner still mentions "Play Billing" generically — acceptable for dev client; preview APK copy is cohort-aware.

---

## Deep link smoke log

| URL | Result |
|-----|--------|
| `reviewnatin://login` | Delivered to running instance |
| `reviewnatin://subscribe` | ✓ Guest paywall rendered |
| `reviewnatin://onboarding` | Delivered |

---

## Recommendations before first tester APK

1. Bump `android.versionCode` → 4 (done in follow-up commit)
2. `npm run eas:build:android:preview`
3. `npm run supabase:auth:prod` + `supabase db push` on hosted project
4. Fill tester names in `docs/beta-testers.md`
5. Run cohort smokes per `docs/beta-audit-matrix.md`

---

## Phase 2 fixes applied same session

- PrimaryButton haptic feedback
- OTP verify success animation + haptics
- Study tab subject search filter
- Server disposable-email RPC (`is_email_domain_blocked`) + client check
- Leaderboard skeleton loaders
- `docs/mobile-design-system.md`
- `lib/beta-cohort.ts` for consistent cohort labels in feedback
