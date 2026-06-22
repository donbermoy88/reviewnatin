# Android Beta — Guest cohort G1–G4 — Build 10 — 2026-06-22

**Device:** `emulator-5554` (Medium_Phone_API_35)  
**APK:** `dist/beta/reviewnatin-beta-v10.apk` (`ph.reviewnatin.app`, `versionCode=10`, `versionName=1.0.0`)

## Pre-flight

| Check | Result | Evidence |
|-------|--------|----------|
| Build 10 installed | **PASS** (no reinstall) | `adb dumpsys package ph.reviewnatin.app` → `versionCode=10` |
| Maestro driver | **Recovered** | `dev.mobile.maestro` + `.test` reinstalled from `~/.maestro/lib/maestro-client.jar` (`maestro-app.apk`, `maestro-server.apk`) → `audit/screenshots/v10-build10-guest/maestro-apks/` |

**Protocol:** `adb shell am force-stop dev.mobile.maestro dev.mobile.maestro.test` before each Maestro run; app reset via `launchApp: clearState` in YAML (no `pm clear` between Maestro flows).

## Maestro flows

| Flow | Cohort | Result | Evidence |
|------|--------|--------|----------|
| `guest-onboarding-quiz.yaml` | **G1** Mara | **PASS** (retry) | `audit/screenshots/v10-build10-guest/guest-onboarding-quiz-PASS.log`; debug `.../maestro-debug-guest-onboarding-quiz-PASS/` |
| `guest-onboarding-quiz.yaml` | G1 | **FAIL** (1st attempt) | `audit/screenshots/v10-build10-guest/guest-onboarding-quiz.log` — `Unable to launch app` after driver reinstall |
| `premium-subscribe-hint.yaml` | **G2** Diego (subscribe CTA) | **PASS** | `audit/screenshots/v10-build10-guest/premium-subscribe-hint.log`; debug `.../maestro-debug-premium-subscribe-hint-2026-06-22_212226/` |

G2 deeplink (supplemental): `reviewnatin://subscribe` cold start → **PASS** screenshot `audit/screenshots/v10-build10-guest/01-subscribe-deeplink-cold.png`

## G3 — Anica (PNLE · 20 Q/day limit)

| Test | Result | Notes |
|------|--------|-------|
| `reviewnatin://practice` deeplink | **NOT SUPPORTED** | No `practice` route in `apps/mobile/lib/deep-link-routes.ts`; screenshot `02-practice-deeplink-attempt.png` |
| 20 Q paywall E2E | **NOT AUTOMATED** | Limit enforced server-side (`fetchPracticeQuestions` → `daily_limit` / `get_usage_limits`); requires ~20 answered questions or a test-user fixture — no Maestro flow exists |

## G4 — Paolo (CSE Subpro · Settings beta feedback)

| Test | Result | Notes |
|------|--------|-------|
| Settings → “Report a problem” | **MANUAL GAP** | UI in `apps/mobile/app/(tabs)/settings.tsx`; no Maestro flow; not exercised on emulator this run |

## Environment notes

- Emulator disconnected mid-session; restarted AVD `Medium_Phone_API_35` (`audit/screenshots/v10-build10-guest/emulator.log`).
- Maestro 2.6.1 gRPC `UNAVAILABLE` when `dev.mobile.maestro*` packages were missing; fixed by manual APK install from `maestro-client.jar`.
