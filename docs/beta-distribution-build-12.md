# Beta APK Distribution — Build 12 (current)

**Date:** 2026-06-22  
**Audience:** 12 agent QA personas (G1–G4 · F1–F4 · P1–P4) — see [beta-testers.md](./beta-testers.md)

---

## Install package

| Field | Value |
|-------|-------|
| **Build** | `android.versionCode` **12** |
| **Package** | `ph.reviewnatin.app` |
| **EAS build** | [83d39445-0098-484a-86b6-89e339109306](https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/83d39445-0098-484a-86b6-89e339109306) |
| **APK download (EAS)** | https://expo.dev/artifacts/eas/4wtfLKbequgbQmwC_vTrvCTueRewEImaxlIwFBzdrIg.apk |
| **Install link (QR)** | https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/83d39445-0098-484a-86b6-89e339109306 |
| **Local copy** | `dist/beta/reviewnatin-beta-v12.apk` |
| **SHA-256** | `cce6edb97f3b6db3acae698f0f79038bdcb3993b05bd49b2d537ab42af8a7b30` |

Verify before install:

```bash
shasum -a 256 reviewnatin-beta-v12.apk
# must match: cce6edb97f3b6db3acae698f0f79038bdcb3993b05bd49b2d537ab42af8a7b30
```

---

## Install steps (all 12 testers)

1. **Uninstall** any old ReviewNatin build (dev client or builds 7–11):
   ```bash
   adb uninstall ph.reviewnatin.app
   ```
2. Enable **Install unknown apps** for your browser or file manager.
3. Install build **12** from the EAS link above.
4. Open app — welcome screen (“Get started — it's free”), **not** Expo dev launcher.

---

## Per-cohort test script

### Guest — G1 Mara, G2 Diego, G3 Anica, G4 Paolo

| Step | Action |
|------|--------|
| 1 | Get started → onboarding → **Skip muna (guest)** → Dashboard |
| 2 | Review tab → start practice quiz |
| 3 | Subscribe tab → guest **Sign up** CTA (routes to signup) |
| 4 | Settings → **Report a problem** (G4) |
| 5 | Optional: `reviewnatin://practice` opens quiz (G3 path) |

### Free — F1 Jasmine, F2 Kyle, F3 Rica, F4 Lea

| Step | Action |
|------|--------|
| 1 | Sign up with **real email** — keyboard opens on Name/Email labels |
| 2 | Enter **6-digit OTP** from inbox (SMTP live at `beta@reviewnatinph.com`) |
| 3 | Complete onboarding — **do not** buy Plus |
| 4 | Confirm 20 Q/day limit and ads (F3, F4) |
| 5 | F2: try Google sign-in (OAuth skip OTP) |

### Premium — P1 Andrea, P2 Marco, P3 Nico, P4 Patricia

| Step | Action |
|------|--------|
| 1 | Same signup + OTP as Free |
| 2 | Subscribe → pick plan → **GCash/Maya web checkout** |
| 3 | Return to app → confirm Plus banner |
| 4 | P3: no ads, unlimited practice |
| 5 | P4: offline pack + AI tutor |

---

## What's new in build 12

- **Verify-email deeplink fix** — `reviewnatin://verify-email?email=…` opens OTP screen
- **Cold-start email fallback** via `Linking.getInitialURL()`
- **Auth keyboard** (build 10 carry-over): tappable labels, `resize` mode
- **Subscribe guest CTA** — “Sign up” routes to signup (not login)
- **`reviewnatin://practice`** deeplink for quiz entry
- **Maestro gates:** guest onboarding, settings feedback, keyboard, free signup, premium paywall

---

## Known issues

| ID | Severity | Issue |
|----|----------|-------|
| B12-1 | P2 | G3 20 Q/day limit needs manual or long quiz automation |
| B12-2 | P2 | P2–P4 web checkout requires live payment on physical device |
| B12-3 | P2 | F2 OAuth not covered by Maestro |

Report: Settings → Report a problem · GitHub beta-feedback · beta@reviewnatinph.com

**Prior builds:** [build 10](./beta-distribution-build-10.md) · [build 7](./beta-distribution-build-7.md)
