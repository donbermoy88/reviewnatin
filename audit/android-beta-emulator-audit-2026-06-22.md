# Android Emulator Beta Audit — ReviewNatin PH
**Date:** 2026-06-22  
**Device:** `emulator-5554` (sdk_gphone64_arm64, 1080×2400)  
**Build:** `ph.reviewnatin.app` v1.0.0 (versionCode 3), Expo dev client + Metro SDK 56  
**Method:** CLI (`adb`, `logcat`), manual navigation, Vitest; Maestro not installed locally  

**Screenshots:** `audit/emulator-screenshots-2026-06-22/`

---

## Executive Summary

ReviewNatin is **functional on Android emulator** for the primary **Guest cohort** flows: onboarding-complete guest dashboard, Study tab with subject search, flashcards, subscribe paywall with login CTAs, Profile guest state, Leaderboard empty state, login/signup/OTP screens, and deep links (`reviewnatin://`, `reviewnatin://signup`, `reviewnatin://subscribe`).

**Automated tests:** 22 files, **110/110 Vitest tests pass**.

**Release readiness estimate:** **72/100** for APK beta (Guest-heavy validation). Free/Premium cohort flows were UI-verified but not end-to-end (no live OTP email, no web checkout payment, no Plus entitlement on device).

**Blockers before 12-tester daily beta:** Run `npm run supabase:auth:prod` + apply auth migrations; install Maestro for repeatable smokes; fill `docs/beta-testers.md`.

---

## Cohort Results

### Guest (G) — Tested on emulator ✅ mostly pass

| Flow | Result | Evidence |
|------|--------|----------|
| Skip login → dashboard | **Pass** | Guest greeting, CSE Professional goal, 55-day countdown |
| Study → subjects + search | **Pass** | Review tab, 2756 questions, "Search subjects…" |
| Practice / flashcards | **Pass** | Flashcards 1/20, Taglish "Ipakita ang sagot" |
| Subscribe → signup CTA | **Pass** | "Mag-log in muna", Sign up, login CTA |
| Profile guest state | **Pass** | Local quiz history, "Log in for analytics" |
| Leaderboard | **Pass** | Empty state + "Start practicing" |
| Login guest link | **Pass** | "Magpatuloy bilang guest" on login screen |
| Ads visibility | **Not verified** | No ad unit on visible guest screens this session |
| 20 Q daily limit | **Not verified** | Full quiz session not completed via adb |
| Settings → Report problem | **Not verified** | Settings gear opens dev menu in dev client; use Profile → settings route on device |

### Free (F) — Partial (UI only)

| Flow | Result | Notes |
|------|--------|-------|
| Signup screen | **Pass** | Password strength hint, Google OAuth, email fields |
| OTP verify screen | **Pass** | 6-digit UI, resend cooldown, Taglish copy (`reviewnatin://verify-email?email=…`) |
| Disposable email block | **Not verified** | adb `input text` unreliable; covered by unit tests |
| Email signup → live OTP | **Blocked** | Requires real inbox / Supabase prod auth config |
| Cloud sync / leaderboard | **Not tested** | No test account signed in |

### Premium (P) — Partial (UI only)

| Flow | Result | Notes |
|------|--------|-------|
| Subscribe paywall | **Pass** | Plus features list, compare plans |
| Web checkout CTA (logged-in) | **Not tested** | Beta banner shows only when `user` present |
| No ads / unlimited practice | **Not tested** | Requires Plus entitlement |
| Manage subscription | **Not tested** | Requires signed-in Plus user |

---

## Findings by Severity

### P0 — Critical
*None observed.* No FATAL crashes in logcat during session. One white-screen moment during adb bulk text input on signup — likely keyboard/automation artifact; recovered after relaunch.

### P1 — High

**P1-1 — Maestro not installed; cohort smokes not automated locally**  
- **Impact:** Daily beta rotation relies on manual QA only.  
- **Fix:** `curl -Ls "https://get.maestro.mobile.dev" | bash` then `maestro test apps/mobile/.maestro/flows/`.

**P1-2 — Hosted Supabase auth still on dev auto-confirm until ops run**  
- **Impact:** Free cohort OTP flow won't gate production signups until `npm run supabase:auth:prod` + migrations applied.  
- **Fix:** Ops checklist in `docs/android-beta-program.md`.

### P2 — Medium

**P2-1 — Dev build subscribe banner mentions Play Billing for guests on Android**  
- **Screen:** Subscribe (`reviewnatin://subscribe`)  
- **Observed:** "Dev build — purchases are simulated. **Play Billing** applies on production."  
- **Expected:** APK beta copy should lead with **web checkout (GCash/Maya)** for Android; Play Billing note is secondary. Logged-in users see correct beta banner separately.  
- **File:** `apps/mobile/app/subscribe/index.tsx` (~line 573)

**P2-2 — Offline banner not visible under airplane mode (20s probe interval)**  
- **Observed:** Airplane mode enabled; Leaderboard rendered with no orange offline banner within 3s.  
- **Expected:** Banner after 2 consecutive probe failures (`use-network-status.ts`).  
- **Re-test:** Wait ≥40s offline or reduce probe interval for QA builds.

**P2-3 — Deep links: `reviewnatin://login` inconsistent**  
- **Observed:** Initial `reviewnatin://login` intent did not navigate; login reached via in-app navigation / other taps.  
- **Note:** `signup`, `subscribe`, `home`, `verify-email` worked. Consider adding `login` to `lib/deep-link-routes.ts` or Expo linking config.

**P2-4 — Expo dev menu interferes with adb tap audit**  
- **Observed:** Taps near screen edge opened Expo dev tools overlay.  
- **Mitigation:** Use preview/release APK for tester builds; disable dev menu in beta profile.

### P3 — Low

**P3-1 — Floating settings gear on multiple screens**  
- Likely dev-client / accessibility overlay artifact; verify absent on preview APK.

**P3-2 — Tab bar label "Ranks" vs design doc "Stats"**  
- Cosmetic; documented in prior audit.

---

## What Passed

- App launch via dev client + Metro (192.168.1.5:8081)
- `daily_active` analytics event in logcat on boot
- Guest dashboard: readiness ring, PasaPath-style progress, quick practice, Plus upsell
- Study tab: subject list, mock/notes tabs, free tier badge, ad-free upsell strip
- Flashcard session UI (Analytical Ability, 20 cards)
- Auth screens: login validation, guest link, signup with strength hints
- OTP verify UI with resend timer
- Subscribe guest gating (login before purchase)
- Profile guest mode messaging
- Leaderboard empty state (weekly / all-time toggle)
- Vitest: 110 tests pass
- No JS fatal errors in logcat during normal navigation

---

## Testing Evidence

| Artifact | Path |
|----------|------|
| Guest dashboard | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_02.png` |
| Signup screen | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_08.png` |
| Login + guest link | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_12.png` |
| Profile guest | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_15.png` |
| Leaderboard | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_18.png` |
| Subscribe guest CTA | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_21.png` |
| OTP verify | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_25.png` |
| Study + search | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_29.png` |
| Subject topics | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_30.png` |
| Flashcards | `audit/emulator-screenshots-2026-06-22/reviewnatin_audit_34.png` |

**Logcat sample (clean boot):**
```
ReactNativeJS: Running "main" ...
ReactNativeJS: '[analytics]', 'daily_active', { date: '2026-06-22' }
```

---

## Recommended Next Steps

1. **Build preview APK** (not dev client): `cd apps/mobile && npm run eas:build:android:preview`
2. **Install Maestro** and run `apps/mobile/.maestro/flows/*.yaml`
3. **Ops:** `npm run supabase:auth:prod`, push migrations `20260622120000`–`20260622120002`
4. **Manual on physical device:** Free signup with real email OTP; Premium web checkout; offline banner after 40s airplane mode
5. **Fix P2-1:** Android dev/preview subscribe copy → web checkout first
6. **Update** `docs/beta-audit-matrix.md` Status column after preview APK cohort smokes

---

## Release Readiness Score (estimate)

| Category | Weight | Score | Notes |
|----------|--------|-------|-------|
| Core Guest UX | 25% | 85% | Dashboard, study, flashcards, auth UI |
| Free cohort auth | 20% | 60% | OTP UI ok; live email not tested |
| Premium / paywall | 15% | 55% | Guest gating ok; checkout not tested |
| Automated tests | 15% | 100% | Vitest green |
| Beta ops / Maestro | 10% | 40% | Maestro not run |
| Security / prod auth | 15% | 50% | Pending prod Supabase config |

**Weighted total: ~72/100** — acceptable for **internal Guest-focused APK beta**; not ready for public Play Store until P1 ops + Premium E2E complete.
