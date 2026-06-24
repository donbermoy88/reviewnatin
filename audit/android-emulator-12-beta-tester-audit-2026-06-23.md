# Android Emulator 12 Beta Tester Audit — 2026-06-23

**Device:** `lowend_api35` / `emulator-5554` · `sdk_gphone64_arm64` · Android 15 (API 35)  
**APK tested:** `apps/mobile/build-1782175700144.apk` · versionCode 29 · versionName 1.0.0  
**SHA-256:** `711388ec8074592091e7eb011b9fd803cc2790f51f3226d022ba95b658390447`  
**Scope:** 12 beta tester personas across first launch, registration/OTP, onboarding, dashboard, practice, mock exams, notes/flashcards, AI tutor, analytics/ranks, subscription flow, and daily return.  
**Note:** This is a separate emulator audit artifact. `audit/android-device-beta-audit-2026-06-23.md` was not edited.

## Executive Summary

Guest onboarding, dashboard return, practice entry, settings feedback, warm login/signup, and warm OTP UI are usable on the Android emulator. The app can support G1/G3/G4 style guest exploration and free-practice discovery.

The largest beta risk is route reliability for unauthenticated conversion/auth links. Cold `reviewnatin://signup`, `reviewnatin://login`, `reviewnatin://verify-email`, and `reviewnatin://subscribe` all reached the app but stayed on a loading spinner during this emulator run. Warm login/signup/verify-email work, but warm subscribe fell back to the welcome screen instead of opening the paywall. This is a high conversion and registration drop-off risk for G2, F1, P1, and P2.

There is also a low-end Android first-launch layout issue: the welcome hero text overlaps on `lowend_api35`, weakening first impression for G3/confused users. Premium entitlement, payment, ads removal, offline packs, and real daily-limit behavior remain blocked without signed-in free/premium test accounts and live purchase/OTP setup.

## Validation Results

| Area | Status | Evidence |
|---|---|---|
| First launch | **PASS with UX issue** | `audit/screenshots/device-beta-audit/2026-06-23-emulator-01-launch.png`; text overlap visible on low-end layout |
| Guest onboarding | **PASS** | Maestro `guest-onboarding-quiz.yaml` passed |
| Guest dashboard | **PASS** | `audit/screenshots/device-beta-audit/2026-06-23-emulator-14-daily-return.png` |
| Practice entry | **PASS** | `audit/screenshots/device-beta-audit/2026-06-23-emulator-13-review-after-guest-flow.png` |
| Settings feedback | **PASS** | Maestro `guest-settings-feedback.yaml` passed through “Report a problem” tap |
| Warm login/signup | **PASS** | `09-login-warm-deeplink.png`, `10-signup-warm-deeplink.png` |
| Warm OTP verify UI | **PASS** | `11-verify-email-warm.png` |
| Cold auth deeplinks | **FAIL** | `05-signup.png`, `06-verify-email.png`, `07-login.png` show spinner |
| Cold subscribe deeplink | **FAIL** | `03-subscribe-cold-deeplink.png`, `04-subscribe-after-wait.png` show spinner after wait |
| Warm subscribe deeplink | **FAIL** | `12-subscribe-warm.png` returns to welcome, not paywall |
| AI tutor guest gate | **PASS** | `18-ai-tutor.png` shows “Mag-log in muna” premium gate |
| Quiz exit confirmation | **PASS** | `21-after-close-quiz.png` shows “Aalis sa quiz?” confirmation |
| Mock exam / notes sub-tabs | **PARTIAL** | Visible on Review, but not fully exercised; coordinate tap started practice due sticky CTA area |
| Analytics/ranks | **BLOCKED** | Attempted while quiz/session overlay was active; needs re-run after clean tab navigation |

## Persona Findings

| Persona | Result | Friction / Drop-off / Conversion Notes |
|---|---|---|
| G1 first-time guest | **PASS** | First launch, onboarding, dashboard, Review tab, and practice entry passed. Retention is helped by the daily-return Home state. |
| G2 avoiding registration | **PARTIAL / conversion risk** | Guest path works, but subscribe deeplink is broken in cold and warm states, so a registration-avoidant user may not see the paywall at the moment of intent. |
| G3 low-end Android | **PARTIAL / UX risk** | Core guest flow works on `lowend_api35`, but first-launch hero copy overlaps; this weakens trust and readability on small/low-end profiles. |
| G4 confused user | **PASS** | Settings feedback path passed via Maestro; “Report a problem” is reachable after onboarding. |
| F1 serious CSE | **PARTIAL / registration risk** | Warm signup/login/OTP screens work, but cold OTP/signup links spin. OTP delivery itself was not validated. |
| F2 LET free user | **PARTIAL** | Warm login shows Google and email login options. OAuth was not completed because emulator/account setup was not available. |
| F3 casual PNLE | **BLOCKED** | Guest/free practice is reachable, but 20-question limit, ads, and registered free-state behavior require a free test account/session. |
| F4 heavy free user | **BLOCKED** | Mock exam preview limits were not fully exercised; needs a registered free account and clean Review sub-tab run. |
| P1 daily active premium prospect | **FAIL / conversion risk** | Premium subscribe CTA route did not reliably render the paywall; warm subscribe returned to welcome. |
| P2 power user | **BLOCKED / conversion risk** | Purchase flow cannot be validated until subscribe route opens reliably and a Play/internal or web checkout test path is available. |
| P3 paying subscriber | **BLOCKED** | Entitlements, no-ads behavior, and restore/persistence require an active premium account. |
| P4 exam within 30 days | **BLOCKED** | AI tutor guest gate is clear, but premium tutor/offline/full mock access requires active premium entitlement. |

## Key Findings

1. **P1: Cold deeplinks hang on spinner.** `reviewnatin://signup`, `reviewnatin://login`, `reviewnatin://verify-email`, `reviewnatin://practice`, and `reviewnatin://subscribe` reached `MainActivity` but did not render their target screens after cold `pm clear` launches in this run. Warm auth routes render correctly, which points to cold-start route/session initialization timing.

2. **P1: Subscribe route does not show the paywall.** Cold subscribe hangs on spinner; warm subscribe falls back to the welcome screen. This removes the most important premium trigger for G2/P1/P2-style users.

3. **P2: Low-end first launch has text overlap.** On `lowend_api35`, “Your study buddy for every Filipino board exam” overlaps the logo/tagline area. G3 and G4 users may perceive the app as unfinished before reaching onboarding.

4. **P2: Premium triggers exist but are not enough if route is broken.** The Review screen shows “Go ad-free with Plus” above the practice CTA, and AI Tutor has a clear premium/login gate, but subscribe navigation must reliably reach the paywall.

5. **P2: Quiz exit is guarded but interrupts navigation.** The “Aalis sa quiz?” confirmation is clear and protective, but while it is open all tab navigation is blocked. This is expected behavior, but audit scripts should confirm “Umalis” explicitly before trying Ranks/Profile.

## Commands Run

```bash
adb devices
ls -lh "apps/mobile"/*.apk
command -v maestro
"$HOME/Library/Android/sdk/emulator/emulator" -list-avds
"$HOME/Library/Android/sdk/emulator/emulator" -avd lowend_api35 -no-snapshot-save
adb wait-for-device
adb shell getprop sys.boot_completed
adb -s emulator-5554 uninstall ph.reviewnatin.app || true
adb -s emulator-5554 install -r "apps/mobile/build-1782175700144.apk"
adb -s emulator-5554 shell am start -n ph.reviewnatin.app/.MainActivity
maestro test apps/mobile/.maestro/flows/guest-onboarding-quiz.yaml
maestro test apps/mobile/.maestro/flows/guest-settings-feedback.yaml
maestro test apps/mobile/.maestro/flows/premium-subscribe-hint.yaml
maestro test apps/mobile/.maestro/flows/free-signup-path.yaml
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'reviewnatin://subscribe' ph.reviewnatin.app
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'reviewnatin://signup' ph.reviewnatin.app
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'reviewnatin://verify-email?email=f1.agent@reviewnatinph.com' ph.reviewnatin.app
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'reviewnatin://login' ph.reviewnatin.app
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'reviewnatin://practice' ph.reviewnatin.app
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'reviewnatin://tutor' ph.reviewnatin.app
shasum -a 256 "apps/mobile/build-1782175700144.apk"
```

## Remaining Blockers

- **OTP email delivery/account setup:** Registration completion and free-user daily return require a real test mailbox and working OTP delivery.
- **OAuth:** F2 Google/Apple path requires emulator Google account setup or physical device.
- **Premium purchase/entitlements:** P2–P4 need a Play/internal track or configured checkout test account with active Plus.
- **Ads and 20-question limit:** F3/F4 and P3 checks need free/premium authenticated sessions.
- **Mock exam and analytics:** Need a clean post-quiz navigation run after fixing/avoiding the active quiz confirmation state.
- **Subscription route:** Must be fixed/re-run before meaningful P1/P2 conversion validation.
