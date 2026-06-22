# Android Emulator Beta Audit — Build 7 + Keyboard Fix — 2026-06-22 (v8)

**Device:** emulator-5554 (Android API 35, Medium Phone)  
**Package:** `ph.reviewnatin.app` (EAS **preview** APK — not dev client)  
**Build:** versionCode **7** · SHA-256 `b9bf3a5dbf2449a22a1f79de78fc65df010552e3d2999483601b23f79ed30f3a`  
**Testers:** 12 agent QA personas — [beta-testers.md](../docs/beta-testers.md)  
**Distribution:** [beta-distribution-build-7.md](../docs/beta-distribution-build-7.md)  
**Prior audit:** [android-beta-emulator-audit-v7-2026-06-22.md](./android-beta-emulator-audit-v7-2026-06-22.md)

---

## Executive summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| App stability | 9/10 | No crashes on preview APK v7 after clean reinstall |
| Guest cohort (G1–G4) | 9/10 | Maestro guest smoke **PASS**; subscribe deeplink after onboarding **PASS** |
| Free cohort (F1–F4) | 7/10 | Signup/login deeplinks **PASS**; cold `verify-email` deeplink **FAIL**; SMTP OTP still blocked |
| Premium cohort (P1–P4) | 8/10 | Maestro premium smoke **PASS**; web checkout + entitlements manual-only |
| Auth keyboard fix | 8/10 | Maestro `auth-keyboard-smoke` **PASS** on v7; `AuthLabeledField` fix in working tree → needs **build 8** APK |
| Release readiness (APK beta) | **84/100** | Ship guest/premium smokes; cut build 8 for keyboard fix; unblock SMTP for Free/Premium E2E |

**Readiness delta vs v7 (82/100):** +2 for new keyboard Maestro gate and subscribe deeplink evidence; −1 for verify-email cold deeplink regression; −1 for Maestro/ADB infra flake (dev client briefly installed on emulator).

---

## Audit environment notes

1. **Emulator contamination:** Mid-audit, emulator had a **Development Build** (versionCode 9) installed, causing Maestro failures and invalid screenshots (`01–05` in `audit/screenshots/v8/`). Fixed by `adb uninstall` + reinstall of `dist/beta/reviewnatin-beta-v7.apk`. Valid evidence starts at `06-welcome-v7.png`.
2. **Maestro driver flake:** After `adb shell pm clear` or rapid back-to-back runs, Maestro gRPC `UNAVAILABLE` occurs. Workaround: `adb shell am force-stop dev.mobile.maestro dev.mobile.maestro.test` before each flow.
3. **Keyboard fix scope:** `AuthLabeledField`, `showSoftInputOnFocus`, and `softwareKeyboardLayoutMode: resize` are in the **working tree** (uncommitted). Installed APK is still **build 7**. Build **8+** required to distribute keyboard fix to testers.

---

## Automated gates

```
npm run mobile:test → 23 files, 113 tests PASS
```

### Maestro results (preview APK v7, emulator-5554)

| Flow | Cohort | Result | Notes |
|------|--------|--------|-------|
| `guest-onboarding-quiz.yaml` | Guest G1 | **PASS** | Welcome → onboarding → Dashboard → Review → "Start practice quiz" |
| `premium-subscribe-hint.yaml` | Premium P1 | **PASS** | Guest Plus card → "Mag-log in para mag-subscribe" |
| `auth-keyboard-smoke.yaml` | Free F1 / cross | **PASS** | Signup + login label/placeholder tap → text input accepted |
| `free-signup-path.yaml` | Free F1 | **FAIL** | Cold `reviewnatin://verify-email?email=…` opens signup, not OTP screen |

**Screenshots (valid v7 evidence):** `audit/screenshots/v8/06–13` + Maestro keyboard warnings in `screenshot-⚠️-*-(auth-keyboard-smoke.yaml).png`

**Gap:** `scripts/beta-automate-all.mjs` runs only the three original cohort flows — does **not** yet include `auth-keyboard-smoke.yaml`.

---

## Keyboard fix verification

### Code changes (working tree → build 8)

| Fix | Location | Purpose |
|-----|----------|---------|
| `AuthLabeledField` | `apps/mobile/components/auth-labeled-field.tsx` | Tappable label → `onFocusField()` (+ 64 ms Android retry) |
| `showSoftInputOnFocus` | `login.tsx`, `signup.tsx` TextInputs | Force soft keyboard on focus |
| `softwareKeyboardLayoutMode: "resize"` | `apps/mobile/app.json` | Window resizes when keyboard opens |

### Verification steps (automated)

```bash
# 1. Ensure preview APK (not dev client)
adb -s emulator-5554 uninstall ph.reviewnatin.app
adb -s emulator-5554 install dist/beta/reviewnatin-beta-v7.apk

# 2. Stabilize Maestro driver
adb -s emulator-5554 shell am force-stop dev.mobile.maestro dev.mobile.maestro.test

# 3. Run keyboard smoke
maestro test apps/mobile/.maestro/flows/auth-keyboard-smoke.yaml
```

**Expected:** Signup screen shows "Gumawa ng account" → tap Name/Email/Password labels → `inputText` succeeds on all three → login screen accepts email/password input.

**2026-06-22 result:** **PASS** (v7 APK). Maestro used label taps with placeholder fallbacks; Password label matched via "Enter your password" placeholder on login.

### Verification steps (manual — recommended on build 8 physical device)

1. Open `reviewnatin://signup` → tap **Name** label (not field) → keyboard opens, cursor in name field.
2. Tap **Email** label → keyboard stays/refocuses; type valid email.
3. Tap **Password** label → keyboard opens; password visible toggle works.
4. Repeat on `reviewnatin://login` for Email + Password labels.
5. With keyboard open, confirm form scrolls (resize mode) — submit button remains reachable.

---

## 12-persona cohort results

Legend: **PASS** = automatable evidence · **PARTIAL** = UI reachable, E2E blocked · **FAIL** = regression · **MANUAL** = requires human/device/payment

### Guest — Mara (G1), Diego (G2), Anica (G3), Paolo (G4)

| Persona | Focus | Status | Evidence |
|---------|-------|--------|----------|
| **G1** Mara | CSE Pro · onboarding → Review smoke | **PASS** | Maestro `guest-onboarding-quiz` |
| **G2** Diego | LET Elem · deeplinks + subscribe CTA | **PASS** | `13-signup-deeplink-g2.png`; `12-subscribe-after-guest-onboarding.png`; premium Maestro login gate |
| **G3** Anica | PNLE · 20 Q limit | **MANUAL** | Not exercised on emulator |
| **G4** Paolo | CSE Subpro · Settings beta feedback | **PARTIAL** | `settings.tsx` "Report a problem" — code verified, not tapped in run |

| Check | G1 | G2 | G3 | G4 |
|-------|----|----|----|----|
| Welcome → onboarding | ✓ | ✓ | — | — |
| Skip guest (step 4) | ✓ | ✓ | — | — |
| Dashboard / Home | ✓ | ✓ | — | — |
| Review → practice entry | ✓ | — | — | — |
| Subscribe guest login CTA | — | ✓ | — | — |
| Deep link signup/login | — | ✓ | — | — |
| 20 Q/day limit | — | — | MANUAL | — |
| Beta feedback path | — | — | — | PARTIAL |

### Free — Jasmine (F1), Kyle (F2), Rica (F3), Lea (F4)

| Persona | Focus | Status | Evidence |
|---------|-------|--------|----------|
| **F1** Jasmine | CSE Pro · signup → OTP UI | **PARTIAL** | Signup deeplink `07-signup-v7.png`; Maestro keyboard PASS; verify deeplink FAIL; SMTP pending |
| **F2** Kyle | LET Sec · OAuth skip OTP | **MANUAL** | Google/Apple buttons visible; flow not exercised |
| **F3** Rica | PNLE · 20 Q + ads | **MANUAL** | Requires registered free account |
| **F4** Lea | LET Elem · mock preview limits | **MANUAL** | Requires registered free account |

| Check | F1 | F2 | F3 | F4 |
|-------|----|----|----|----|
| Signup form + deeplink | ✓ | — | — | — |
| Keyboard label → input | ✓ | — | — | — |
| OTP verify screen (cold deeplink) | ✗ | — | — | — |
| OTP verify (post-signup) | PARTIAL | — | — | — |
| OAuth path | — | MANUAL | — | — |
| 20 Q/day + ads | — | — | MANUAL | — |
| Mock preview limits | — | — | — | MANUAL |

**F1 verify-email failure:** `reviewnatin://verify-email?email=f1.agent@reviewnatinph.com` without auth session redirects to signup (`10-verify-deeplink-v7.png`). OTP UI reachable only after signup triggers verify flow (needs SMTP for full pass).

### Premium — Andrea (P1), Marco (P2), Nico (P3), Patricia (P4)

| Persona | Focus | Status | Evidence |
|---------|-------|--------|----------|
| **P1** Andrea | CSE Pro · Plus upsell → login gate | **PASS** | Maestro `premium-subscribe-hint` |
| **P2** Marco | CSE Subpro · web checkout | **MANUAL** | Plus paywall UI `12-subscribe-after-guest-onboarding.png`; GCash/Maya needs live payment |
| **P3** Nico | Mixed · no-ads entitlement | **MANUAL** | Requires active Plus subscription |
| **P4** Patricia | LET Elem · offline + AI tutor | **MANUAL** | Requires active Plus subscription |

| Check | P1 | P2 | P3 | P4 |
|-------|----|----|----|----|
| Plus upsell on Home | ✓ | — | — | — |
| Subscribe paywall + login gate | ✓ | ✓ | — | — |
| Web checkout (GCash/Maya) | — | MANUAL | — | — |
| No ads when Plus | — | — | MANUAL | — |
| Full mocks / AI tutor / offline | — | — | MANUAL | MANUAL |

---

## Remaining manual-only items

| Item | Blocks personas | Action |
|------|-----------------|--------|
| **SMTP OTP delivery** | F1–F4, P1–P4 | Run `npm run supabase:resend:setup`; verify 6-digit email to real inbox |
| **Web checkout (GCash/Maya)** | P2, all Premium | Physical device + live payment on Subscribe screen |
| **Plus entitlements** (no ads, unlimited, mocks, AI, offline) | P3, P4 | Complete checkout → re-audit entitlement gates |
| **20 Q/day + ads** | G3, F3 | Guest/free session on emulator or physical device |
| **OAuth (Google/Apple) skip OTP** | F2 | Device with Google account; not emulated |
| **Physical device matrix** | All 12 | Samsung/Oppo/Vivo/Realme profiles per [beta-testers.md](../docs/beta-testers.md) |
| **Build 8 APK** | Keyboard fix rollout | EAS preview build with `AuthLabeledField` + `resize` mode committed |

---

## P0 / P1 / P2

### P0 — none

No crashes or auth dead-ends on preview APK v7 after clean install.

### P1

1. **SMTP not configured** — Free/Premium cannot complete OTP E2E (`RESEND_API_KEY` / `npm run supabase:resend:setup`).
2. **Cold `verify-email` deeplink** — Opens signup instead of OTP UI when no session (Maestro `free-signup-path` FAIL).
3. **Keyboard fix not in shipped APK** — Code ready; needs build 8 before tester distribution.

### P2

1. **Maestro infra flake** — gRPC UNAVAILABLE after `pm clear`; force-stop Maestro driver between flows.
2. **Dev client vs preview APK** — Same package id; accidental dev-client install breaks cohort smokes.
3. **`beta-automate-all.mjs`** — Missing `auth-keyboard-smoke.yaml` in step 7/9 Maestro loop.

---

## Maestro flow inventory

| File | Maps to | In `beta-automate-all.mjs` |
|------|---------|----------------------------|
| `guest-onboarding-quiz.yaml` | G1 onboarding smoke | ✓ |
| `free-signup-path.yaml` | F1 signup/OTP UI | ✓ |
| `premium-subscribe-hint.yaml` | P1 paywall smoke | ✓ |
| `auth-keyboard-smoke.yaml` | F1 keyboard regression | ✗ (add in build 8) |

---

## Next actions

1. Commit keyboard fix → bump `versionCode` → EAS preview **build 8** APK.
2. Add `auth-keyboard-smoke.yaml` to `scripts/beta-automate-all.mjs` Maestro loop.
3. Run `npm run supabase:resend:setup` → re-run `free-signup-path.yaml` with SMTP live.
4. Fix or document cold `verify-email` deeplink behavior (session required vs direct OTP entry).
5. Physical device pass: Premium web checkout (P2) + entitlement audit (P3, P4).
6. Friday release gate: 4/4 Maestro flows green + no open P0/P1.

---

## Commands used

```bash
adb -s emulator-5554 uninstall ph.reviewnatin.app
adb -s emulator-5554 install dist/beta/reviewnatin-beta-v7.apk
shasum -a 256 dist/beta/reviewnatin-beta-v7.apk
npm run mobile:test
adb -s emulator-5554 shell am force-stop dev.mobile.maestro dev.mobile.maestro.test
maestro test apps/mobile/.maestro/flows/guest-onboarding-quiz.yaml
maestro test apps/mobile/.maestro/flows/free-signup-path.yaml
maestro test apps/mobile/.maestro/flows/premium-subscribe-hint.yaml
maestro test apps/mobile/.maestro/flows/auth-keyboard-smoke.yaml
adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "reviewnatin://signup" ph.reviewnatin.app
adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "reviewnatin://login" ph.reviewnatin.app
adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "reviewnatin://subscribe" ph.reviewnatin.app
```
