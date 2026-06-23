# Beta APK Distribution — Build 36 (current)

**Date:** 2026-06-23  
**Audience:** 12 beta testers (G1–G4 · F1–F4 · P1–P4) — see [beta-testers.md](./beta-testers.md)

**Ships:** Phase 5 performance polish, centralized pricing/checkout copy, audit remediation (auth rate limits, prod security gates), PostHog funnel (when EAS key set).

---

## Install package

| Field | Value |
|-------|-------|
| **Build** | `android.versionCode` **36** |
| **Package** | `ph.reviewnatin.app` |
| **EAS build** | [69a3d561-bb33-4983-8b39-063dff45ff6b](https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/69a3d561-bb33-4983-8b39-063dff45ff6b) |
| **APK (direct)** | https://expo.dev/artifacts/eas/Kl3gRkSk86vM-NjB-RElBEwNlXT9VKh_e0zp0iyZFEY.apk |
| **Local copy** | `dist/beta/reviewnatin-beta-v36.apk` |
| **SHA-256** | `ec51e0ec796308ea9bba43feaa08e3623acf482d407cd531f9328e88dc5a875e` |

Verify before install:

```bash
shasum -a 256 reviewnatin-beta-v36.apk
# must match: ec51e0ec796308ea9bba43feaa08e3623acf482d407cd531f9328e88dc5a875e
```

---

## Install steps (all 12 testers)

1. **Uninstall** any old ReviewNatin build (Settings → Apps → Uninstall, or `adb uninstall ph.reviewnatin.app`).
2. Download the APK from the EAS link above (or use the local `dist/beta/` copy).
3. Enable **Install unknown apps** for your browser or file manager if prompted.
4. Install build **36** and open — welcome screen (“Get started — it's free”), **not** Expo dev launcher.

---

## What's new vs build 28

- **Phase 5:** Deferred dashboard charts + AdMob init; free daily-limit strip; exam-countdown Plus CTA; DB-backed pricing display.
- **Audit remediation:** Server login rate limit RPC; prod auto-confirm verification gate; guest web-checkout hint on Subscribe.
- **PostHog:** Funnel events wired (signup → practice → subscribe) — needs `EXPO_PUBLIC_POSTHOG_API_KEY` in EAS preview profile.
- **Maestro:** All 5 cohort smokes **PASS** on build 36 (including premium subscribe hint).

---

## Maestro results (build 36, emulator, 2026-06-23)

| Flow | Cohort | Result |
|------|--------|--------|
| `guest-onboarding-quiz.yaml` | G1–G2 | **PASS** |
| `guest-settings-feedback.yaml` | G4 | **PASS** |
| `auth-keyboard-smoke.yaml` | F1–F2 | **PASS** |
| `free-signup-path.yaml` | F1 | **PASS** |
| `premium-subscribe-hint.yaml` | P1 | **PASS** |
| Cold `verify-email` deeplink | F1 | **WARN** — screen copy not detected; manual check recommended |

Report: `dist/beta/last-automation-report.json`

---

## 12-tester focus (build 36)

| Persona | Cohort | Automated | Manual focus today |
|---------|--------|-----------|-------------------|
| Mara Santos (G1) | Guest | ✓ onboarding Maestro | Hit 20 Q → paywall copy |
| Diego Reyes (G2) | Guest | ✓ onboarding | Ads on Home/Study/Result |
| Anica Cruz (G3) | Guest | — | 20 Q limit → Tagalog panel |
| Paolo Mendoza (G4) | Guest | ✓ settings feedback | Profile → Settings hint |
| Jasmine Lo (F1) | Free | ✓ signup path | **Cold verify-email deeplink** (tap link from email app) |
| Kyle Tan (F2) | Free | ✓ keyboard | Google/Apple OAuth path |
| Rica Villanueva (F3) | Free | — | 20 Q limit enforcement |
| Lea Fernandez (F4) | Free | — | Mock preview limits |
| Andrea Bautista (P1) | Premium | ✓ subscribe hint | **Web checkout on physical device** |
| Marco Silva (P2) | Premium | — | GCash/Maya → Plus active → no ads |
| Nico Almario (P3) | Premium | — | Unlimited practice + full mock |
| Patricia Gomez (P4) | Premium | — | Offline pack + AI tutor |

**Ship gate:** **Cleared for 12-tester distribution** on automated gates. **Blockers for “full beta sign-off”:** Premium web checkout on a real device + optional PostHog live smoke.

---

## Taglish post (copy to tester group)

```
Kumusta testers! Bagong beta build 36 na.

📦 Install: https://expo.dev/artifacts/eas/Kl3gRkSk86vM-NjB-RElBEwNlXT9VKh_e0zp0iyZFEY.apk
🔐 SHA-256: ec51e0ec796308ea9bba43feaa08e3623acf482d407cd531f9328e88dc5a875e

Uninstall muna ang lumang ReviewNatin bago i-install.

Plus = web checkout lang sa APK beta (walang Play Billing pa).
Report bugs: Settings → Report a problem, o GitHub beta-feedback.

Focus ngayon:
• Guest (G1–G4): onboarding → 20 tanong → paywall
• Free (F1–F4): signup + OTP → practice limit
• Premium (P1–P4): web checkout → confirm walang ads

Salamat!
```

Also saved: `dist/beta/release-notes-taglish-build-36.txt`

---

## Manual steps (cannot automate)

### You — distribute APK (5 min)

1. Post the Taglish block above to your tester Messenger/Viber/Telegram group.
2. Assign each tester their cohort from [beta-testers.md](./beta-testers.md).

### Premium cohort — web checkout (P1–P4, physical device)

1. Install build 36 on a **real Android phone** (not emulator).
2. Register → OTP → onboarding → **Subscribe**.
3. Tap web checkout → complete payment (GCash/Maya test or prod as configured).
4. Return to app → confirm **Plus active**, **no ads**, unlimited practice.
5. Report pass/fail in GitHub beta-feedback with `cohort:premium`.

### PostHog live smoke (optional, 10 min)

1. Open [PostHog](https://us.i.posthog.com) → Live events.
2. On build 36: Guest → Signup → Practice → Subscribe screen.
3. Confirm funnel events appear (`signup_started`, `onboarding_completed`, etc.).

### CAPTCHA (optional before next build)

When Turnstile keys are ready:

```bash
npm run supabase:captcha
# Set EXPO_PUBLIC_TURNSTILE_SITE_KEY in EAS preview → rebuild APK
```

---

## Prior builds

[build 28](./beta-distribution-build-28.md) · [build 12](./beta-distribution-build-12.md) · [build 10](./beta-distribution-build-10.md)
