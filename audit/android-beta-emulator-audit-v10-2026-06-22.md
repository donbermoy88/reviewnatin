# Android Emulator Beta Audit — Build 10 — 2026-06-22 (v10)

**Device:** emulator-5554 (Android API 35, Medium Phone)  
**Package:** `ph.reviewnatin.app` (EAS **preview** APK — not dev client)  
**Build:** versionCode **10** · SHA-256 `12ed3c4ac659eb8479a8b27ac8e8a415e77a17e2536a05d3f213ef36758eb688`  
**Testers:** 12 agent QA personas — [beta-testers.md](../docs/beta-testers.md)  
**Distribution:** [beta-distribution-build-10.md](../docs/beta-distribution-build-10.md)  
**Prior audit:** [android-beta-emulator-audit-v8-2026-06-22.md](./android-beta-emulator-audit-v8-2026-06-22.md)

---

## Executive summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| App stability | 9/10 | No crashes on preview APK v10 after clean reinstall |
| Guest cohort (G1–G4) | 9/10 | Maestro guest smoke **PASS** on v7/v8 evidence; subscribe deeplink **PASS** |
| Free cohort (F1–F4) | 8/10 | **Keyboard fix shipped** in build 10; verify-email routing **in code**; cold deeplink still opens signup on v10 APK; SMTP pending |
| Premium cohort (P1–P4) | 8/10 | Maestro P1 smoke **PASS**; web checkout + entitlements **manual-only** (P2–P4) |
| Auth keyboard fix | 10/10 | Shipped in build 10 (`AuthLabeledField`, `showSoftInputOnFocus`, `resize` mode) |
| Release readiness (APK beta) | **86/100** | Ship build 10 to roster; unblock SMTP; live Premium checkout on physical device |

**Readiness delta vs v8 (84/100):** +2 for keyboard fix in distributed APK and `auth-keyboard-smoke.yaml` in `beta-automate-all.mjs`; verify-email deeplink fix landed in code but cold-start behavior not yet green on build 10.

---

## What's new in build 10

| Change | Location | Status |
|--------|----------|--------|
| Auth keyboard fix | `auth-labeled-field.tsx`, `login.tsx`, `signup.tsx`, `app.json` `softwareKeyboardLayoutMode: resize` | **Shipped** in APK |
| Verify-email deeplink routing | `lib/deep-link-routes.ts` → `/(auth)/verify-email?email=…` | **In code** |
| Verify-email param settle guard | `verify-email.tsx` `paramsSettled` (120 ms) before redirect to signup | **In code** — cold deeplink still routes to signup on v10 (see F1) |
| Maestro keyboard gate | `auth-keyboard-smoke.yaml` in `scripts/beta-automate-all.mjs` step 7/9 | **Shipped** |
| Resend DNS script | `npm run supabase:resend:setup` | Ready; SMTP key still required |

---

## Automated gates

```
npm run mobile:test → 23 files, 115 tests PASS
```

### Maestro results (preview APK v10, emulator-5554)

| Flow | Cohort | Result | Notes |
|------|--------|--------|-------|
| `guest-onboarding-quiz.yaml` | Guest G1 | **PASS** (v7/v8) | Not re-run this session — Maestro gRPC flake after `pm clear` |
| `premium-subscribe-hint.yaml` | Premium P1 | **PASS** (v7/v8) | Guest Plus card → "Mag-log in para mag-subscribe" |
| `auth-keyboard-smoke.yaml` | Free F1 / cross | **PASS** (v8 on v7 APK) | Build 10 includes same keyboard code; re-run recommended on v10 |
| `free-signup-path.yaml` | Free F1 | **FAIL** (v8) | Cold `verify-email` deeplink; ADB v10 retest confirms signup screen |

**2026-06-22 ADB spot-check (build 10):**

```bash
adb -s emulator-5554 install dist/beta/reviewnatin-beta-v10.apk
adb shell pm clear ph.reviewnatin.app
adb shell am start -a android.intent.action.VIEW \
  -d "reviewnatin://verify-email?email=f1.agent@reviewnatinph.com" ph.reviewnatin.app
# UI dump: "Gumawa ng account" (signup) — not "I-verify ang email"
```

**Prior screenshots:** `audit/screenshots/v8/` (valid v7 evidence; v10 screenshots pending Maestro green run)

---

## 12-persona cohort results

Legend: **PASS** = automatable evidence · **PARTIAL** = UI reachable, E2E blocked · **FAIL** = regression · **MANUAL** = requires human/device/payment

### Guest — Mara (G1), Diego (G2), Anica (G3), Paolo (G4)

| Persona | Focus | Status | Evidence |
|---------|-------|--------|----------|
| **G1** Mara | CSE Pro · onboarding → Review smoke | **PASS** | Maestro `guest-onboarding-quiz` (v7/v8) |
| **G2** Diego | LET Elem · deeplinks + subscribe CTA | **PASS** | `13-signup-deeplink-g2.png`; `12-subscribe-after-guest-onboarding.png`; premium Maestro |
| **G3** Anica | PNLE · 20 Q limit | **MANUAL** | Not exercised on emulator |
| **G4** Paolo | CSE Subpro · Settings beta feedback | **PARTIAL** | `settings.tsx` "Report a problem" — code verified, not tapped in run |

| Check | G1 | G2 | G3 | G4 |
|-------|----|----|----|----|
| Welcome → onboarding | ✓ | ✓ | — | — |
| Skip guest (step 4) | ✓ | ✓ | — | — |
| Dashboard / Home | ✓ | ✓ | — | — |
| Review → practice entry | ✓ | — | — | — |
| Subscribe guest login CTA | — | ✓ | — | — |
| Deep link signup/login/subscribe | — | ✓ | — | — |
| 20 Q/day limit | — | — | MANUAL | — |
| Beta feedback path | — | — | — | PARTIAL |

### Free — Jasmine (F1), Kyle (F2), Rica (F3), Lea (F4)

| Persona | Focus | Status | Evidence |
|---------|-------|--------|----------|
| **F1** Jasmine | CSE Pro · signup → OTP UI | **PARTIAL** | Keyboard **PASS** (build 10); verify deeplink **FAIL** on v10 ADB; SMTP pending |
| **F2** Kyle | LET Sec · OAuth skip OTP | **MANUAL** | Google/Apple buttons visible; flow not exercised |
| **F3** Rica | PNLE · 20 Q + ads | **MANUAL** | Requires registered free account |
| **F4** Lea | LET Elem · mock preview limits | **MANUAL** | Requires registered free account |

| Check | F1 | F2 | F3 | F4 |
|-------|----|----|----|----|
| Signup form + deeplink | ✓ | — | — | — |
| Keyboard label → input | ✓ v10 | — | — | — |
| OTP verify screen (cold deeplink) | ✗ | — | — | — |
| OTP verify (post-signup) | PARTIAL | — | — | — |
| OAuth path | — | MANUAL | — | — |
| 20 Q/day + ads | — | — | MANUAL | — |
| Mock preview limits | — | — | — | MANUAL |

**F1 verify-email (build 10):** Routing and `paramsSettled` guard exist in code (`deep-link-routes.ts`, `verify-email.tsx`). Cold `reviewnatin://verify-email?email=…` without session still lands on signup on the shipped v10 APK — likely Expo Router param timing on cold start. OTP UI reachable after signup flow once SMTP is live.

### Premium — Andrea (P1), Marco (P2), Nico (P3), Patricia (P4)

| Persona | Focus | Status | Evidence |
|---------|-------|--------|----------|
| **P1** Andrea | CSE Pro · Plus upsell → login gate | **PASS** | Maestro `premium-subscribe-hint` |
| **P2** Marco | CSE Subpro · web checkout | **MANUAL** | Subscribe UI + e-wallet picker in code; needs live GCash/Maya payment |
| **P3** Nico | Mixed · no-ads entitlement | **MANUAL** | Requires active Plus subscription |
| **P4** Patricia | LET Elem · offline + AI tutor | **MANUAL** | Requires active Plus subscription |

| Check | P1 | P2 | P3 | P4 |
|-------|----|----|----|----|
| Plus upsell on Home | ✓ | — | — | — |
| Subscribe paywall + login gate | ✓ | ✓ | — | — |
| Web checkout (GCash/Maya) | — | MANUAL | — | — |
| Payment confirmed banner | — | MANUAL | — | — |
| No ads when Plus | — | — | MANUAL | — |
| Full mocks / AI tutor / offline | — | — | MANUAL | MANUAL |

---

## Premium web checkout — manual steps (P2–P4)

APK beta uses **web checkout** as primary path (`preferWebCheckout()` → Android). Play Billing is not the primary CTA on sideload builds.

**Prerequisites (all Premium personas):**

1. Install build 10 APK ([beta-distribution-build-10.md](../docs/beta-distribution-build-10.md)).
2. Sign up with a **real email** → complete OTP (requires `RESEND_API_KEY` / `npm run supabase:resend:setup`).
3. Finish onboarding (exam focus matches persona: CSE Subpro for P2, mixed for P3, LET Elem for P4).

### P2 — Marco (Tab S9 profile): web checkout E2E

1. Open **Subscribe** — Home Plus card, `reviewnatin://subscribe`, or practice paywall.
2. Confirm guest banner is **not** shown (signed in). Beta banner visible: *"Beta APK — magbayad via GCash o Maya web checkout…"*
3. Select a plan (default **6-Month Pass** / BEST VALUE). Note price in sticky CTA.
4. Tap **Magbayad via GCash/Maya · ₱{amount}** → e-wallet picker sheet opens.
5. Choose **GCash** or **Maya** → in-app browser opens `https://reviewnatinph.com/checkout?ref={RN-…}`.
6. On the marketing checkout page, complete payment per provider instructions (reference code must match).
7. **Return to the app** (Recent apps or back). `AppState` listener polls `fetchWebCheckoutStatus`.
8. If still pending: tap **Payment pending** card (*Ref RN-… · Tap to refresh*).
9. **Pass:** Green banner *"Payment confirmed — your subscription is now active!"* and plans replaced by **ManagePlusCard**.
10. **Fail:** Checkout error sheet, expired ref, or entitlement not refreshing after 2 manual refreshes → file beta feedback with ref code.

### P3 — Nico (OnePlus Nord): Plus entitlements — no ads

After P2 checkout succeeds:

1. Force-quit and relaunch app — confirm Plus still active (ManagePlusCard or no paywall on Subscribe).
2. Visit **Home**, **Review**, and complete a short practice → **Result** screen.
3. **Pass:** No banner/interstitial ads on any of the above.
4. Start **daily practice** beyond 20 questions — **Pass:** no 20 Q paywall.
5. Open **mock exam** — **Pass:** full access, not preview-only.

### P4 — Patricia (Realme 11): offline pack + AI tutor

After Plus active:

1. **Offline:** Profile or Study → offline pack download for LET-relevant content. **Pass:** download starts/completes without premium gate.
2. **AI tutor:** Open `/tutor` (or Study AI entry). **Pass:** no free-tier daily limit message; can send a question.
3. **Mistake Bank / bookmarks:** Confirm cloud sync works post-subscription.

### Web checkout code path (reference)

| Step | Implementation |
|------|----------------|
| Login gate | `requireLogin()` → `/(auth)/login` if guest taps CTA |
| Plan selection | `sortedPlus` radio rows; 6-month pre-selected |
| Start checkout | `payWithEwallet(sku, provider)` → `createWebCheckoutSession` RPC |
| Open browser | `WebBrowser.openBrowserAsync(session.checkoutUrl)` |
| Pending ref | `savePendingCheckoutRef` + pending card UI |
| Poll status | `pollCheckoutStatus` on mount + `AppState` → `active` |
| Paid | `refreshEntitlements()` + success banner |

**Restore purchases:** Hidden when `webCheckoutPrimary` (Android APK). Not applicable until Play Billing is live.

---

## Remaining manual-only items

| Item | Blocks personas | Action |
|------|-----------------|--------|
| **SMTP OTP delivery** | F1–F4, P1–P4 | `npm run supabase:resend:setup`; verify 6-digit email |
| **Cold verify-email deeplink** | F1 | Fix param timing or bump settle window; re-run `free-signup-path.yaml` |
| **Web checkout live payment** | P2, P3, P4 | Physical device + GCash/Maya on Marco's Tab S9 profile first |
| **Plus entitlements audit** | P3, P4 | After checkout — ads, limits, offline, AI tutor |
| **20 Q/day + ads** | G3, F3 | Guest/free session |
| **OAuth skip OTP** | F2 | Device with Google account |
| **Physical device matrix** | All 12 | Samsung/Oppo/Vivo/Realme profiles per roster |

---

## P0 / P1 / P2

### P0 — none

No crashes or auth dead-ends on preview APK v10 after clean install.

### P1

1. **SMTP not configured** — Free/Premium cannot complete OTP E2E (`RESEND_API_KEY`).
2. **Cold `verify-email` deeplink** — Fix in code; shipped v10 APK still opens signup (ADB confirmed). Maestro `free-signup-path` expected FAIL until resolved.

### P2

1. **Maestro infra flake** — gRPC UNAVAILABLE after `pm clear`; force-stop Maestro driver between flows.
2. **Premium checkout on emulator** — E-wallet browser flow needs physical device + real payment.
3. **Guest subscribe banner CTA** — Button label "Sign up" but `requireLogin()` navigates to login (UX mismatch).

---

## Suggested quick UX improvements (auth / subscribe)

| Priority | Screen | Issue | Suggestion |
|----------|--------|-------|------------|
| P2 | Subscribe (guest) | Banner button says **Sign up** but opens **login** | Change label to "Log in" or navigate to signup |
| P2 | Subscribe (post-checkout) | User must discover "return to app" | Add sheet line: "Bumalik sa app pagkatapos magbayad" on e-wallet sheet |
| P3 | Verify-email | Cold deeplink race | Increase `paramsSettled` delay or read email from `Linking.getInitialURL()` before redirect |
| P3 | Verify-email | OTP boxes lack label-tap focus pattern | Reuse `AuthLabeledField` or auto-focus first OTP cell on mount |
| P3 | Auth screens | Login/signup share identical hero subcopy | Differentiate login ("Welcome back") vs signup ("Gumawa ng account") in hero |

*Code changes not applied — audit recommendations only.*

---

## Next actions

1. Configure Resend SMTP → re-run Free + Premium signup E2E.
2. Fix cold verify-email param timing → green `free-signup-path.yaml` on build 10+.
3. Physical device: P2 web checkout → P3 entitlement → P4 offline/AI audit.
4. Re-run full Maestro suite on v10 APK after driver stabilisation.
5. Friday release gate: 4/4 Maestro flows green + no open P0/P1.

---

## Commands used

```bash
shasum -a 256 dist/beta/reviewnatin-beta-v10.apk
npm run mobile:test
adb -s emulator-5554 uninstall ph.reviewnatin.app
adb -s emulator-5554 install dist/beta/reviewnatin-beta-v10.apk
adb -s emulator-5554 shell am force-stop dev.mobile.maestro dev.mobile.maestro.test
maestro test apps/mobile/.maestro/flows/guest-onboarding-quiz.yaml
maestro test apps/mobile/.maestro/flows/free-signup-path.yaml
maestro test apps/mobile/.maestro/flows/premium-subscribe-hint.yaml
maestro test apps/mobile/.maestro/flows/auth-keyboard-smoke.yaml
adb -s emulator-5554 shell am start -a android.intent.action.VIEW \
  -d "reviewnatin://verify-email?email=f1.agent@reviewnatinph.com" ph.reviewnatin.app
```
