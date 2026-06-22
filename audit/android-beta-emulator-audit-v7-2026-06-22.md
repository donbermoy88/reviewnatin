# Android Emulator Beta Audit — Build 7 — 2026-06-22

**Device:** emulator-5554 (Android API 35, Medium Phone)  
**Package:** `ph.reviewnatin.app` (EAS **preview** APK, not dev client)  
**Build:** versionCode **7** · SHA-256 `b9bf3a5dbf2449a22a1f79de78fc65df010552e3d2999483601b23f79ed30f3a`  
**Testers:** 12 agent QA personas — [beta-testers.md](../docs/beta-testers.md)  
**Distribution:** [beta-distribution-build-7.md](../docs/beta-distribution-build-7.md)

---

## Executive summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| App stability | 9/10 | No crashes on preview APK; clean launch to welcome |
| Guest cohort (G1–G4) | 9/10 | Maestro guest smoke PASS; onboarding → Review tab |
| Free cohort (F1–F4) | 7/10 | Signup + OTP UI reachable; email delivery blocked without SMTP |
| Premium cohort (P1–P4) | 8/10 | Maestro premium smoke PASS; guest paywall shows login CTA |
| Release readiness (APK beta) | **82/100** | Ship to agent roster; unblock end-to-end OTP with Resend SMTP |

---

## Automated gates

```
npm run mobile:test → 23 files, 113 tests PASS
Maestro (preview APK v7, `adb shell pm clear` between flows):
  guest-onboarding-quiz     PASS
  premium-subscribe-hint    PASS
  free-signup-path          PASS
```

Screenshots: `audit/screenshots/v7/`

---

## 12-persona cohort results

### Guest — Mara (G1), Diego (G2), Anica (G3), Paolo (G4)

| Check | G1 | G2 | G3 | G4 | Evidence |
|-------|----|----|----|----|----------|
| Welcome → onboarding | ✓ | ✓ | ✓ | ✓ | Maestro guest flow |
| Skip guest account step | ✓ | — | — | — | Step 4 "Skip muna (guest)" |
| Dashboard / Home tab | ✓ | — | — | — | Maestro |
| Review → practice entry | ✓ | — | — | — | "Start practice quiz" visible |
| Subscribe guest CTA | — | ✓ | — | — | Premium Maestro: "Mag-log in para mag-subscribe" |
| Deep link signup | — | ✓ | — | — | `reviewnatin://signup` after pm clear |
| 20 Q limit | — | — | — | — | Not exercised |
| Beta feedback | — | — | — | — | Code verified |

### Free — Jasmine (F1), Kyle (F2), Rica (F3), Lea (F4)

| Check | F1 | F2 | F3 | F4 | Evidence |
|-------|----|----|----|----|----------|
| Signup form | ✓ | — | — | — | Deep link + Maestro |
| OTP verify screen | ~ | — | — | — | "I-verify ang email" (needs SMTP for email) |
| 6-digit OTP input | ✓ | — | — | — | `verify-email.tsx` |
| OAuth skip OTP | — | — | — | — | Not exercised |
| 20 Q/day + ads | — | — | — | — | Not exercised |

### Premium — Andrea (P1), Marco (P2), Nico (P3), Patricia (P4)

| Check | P1 | P2 | P3 | P4 | Evidence |
|-------|----|----|----|----|----------|
| Plus upsell on Home | ✓ | — | — | — | Maestro taps a11y label |
| Subscribe paywall | ✓ | — | — | — | Guest login gate correct for APK beta |
| Web checkout | — | — | — | — | Needs registered user + live payment |
| No ads when Plus | — | — | — | — | Needs active entitlement |

---

## P0 / P1 / P2

### P0 — none

No crashes or auth dead-ends on preview APK.

### P1

1. **SMTP not configured** — Free/Premium cohorts cannot complete OTP without `RESEND_API_KEY` (`npm run supabase:resend:setup`).
2. **Deep links before onboarding** — `reviewnatin://subscribe` blocked by onboarding gate until first-run complete (expected; document for testers).

### P2

1. **Build 6 Maestro flows** assumed login-first; preview APK opens welcome — fixed in build 7 flows.
2. **release-notes-build-7.md** previously referenced v5 APK path — corrected.

---

## Next actions

1. Run `npm run supabase:resend:setup` → verify OTP email to F1 persona email.
2. Re-run `maestro test apps/mobile/.maestro/flows` after SMTP live.
3. Physical device pass for Premium web checkout (P1–P4).
4. Friday release gate: all three Maestro flows green + no open P0/P1.

---

## Commands used

```bash
adb uninstall ph.reviewnatin.app
adb install dist/beta/reviewnatin-beta-v7.apk
maestro test apps/mobile/.maestro/flows
npm run mobile:test
```
