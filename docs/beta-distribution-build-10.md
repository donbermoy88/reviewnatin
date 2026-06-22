# Beta APK Distribution — Build 10

**Date:** 2026-06-22  
**Audience:** 12 agent QA personas (G1–G4 · F1–F4 · P1–P4) — see [beta-testers.md](./beta-testers.md)

---

## Install package

| Field | Value |
|-------|-------|
| **Build** | `android.versionCode` **10** |
| **Package** | `ph.reviewnatin.app` |
| **EAS build** | [9a36c682-d88b-43f5-9837-4dc74bde6602](https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/9a36c682-d88b-43f5-9837-4dc74bde6602) |
| **APK download (EAS)** | https://expo.dev/artifacts/eas/qHt_wBWSYPHFp5FxRncmwH5KnXVrsgI3X634sgFyiew.apk |
| **Install link (QR)** | https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/9a36c682-d88b-43f5-9837-4dc74bde6602 |
| **Local copy** | `dist/beta/reviewnatin-beta-v10.apk` |
| **SHA-256** | `12ed3c4ac659eb8479a8b27ac8e8a415e77a17e2536a05d3f213ef36758eb688` |

Verify before install:

```bash
shasum -a 256 reviewnatin-beta-v10.apk
# must match: 12ed3c4ac659eb8479a8b27ac8e8a415e77a17e2536a05d3f213ef36758eb688
```

---

## Install steps (all testers)

1. **Uninstall** any old ReviewNatin build first (dev client or builds 7–9):
   ```bash
   adb uninstall ph.reviewnatin.app
   ```
2. Enable **Install unknown apps** for your browser or file manager.
3. Install build 10 APK from the EAS link above.
4. Open app — you should see the **welcome screen** (“Get started — it's free”), **not** the Expo dev launcher.

---

## Per-cohort instructions

### Guest — Mara, Diego, Anica, Paolo (G1–G4)

1. Tap **Get started — it's free** → complete onboarding (pick your exam focus).
2. On step 4, tap **Skip muna (guest)**.
3. Tap **Pumunta sa Dashboard** → explore Home, Review, Subscribe.

### Free — Jasmine, Kyle, Rica, Lea (F1–F4)

1. Tap **Log in** on welcome → **Sign up** (or open `reviewnatin://signup`).
2. Tap **Name** or **Email** labels — keyboard must open (build 10 fix).
3. Register with a **real email** → enter **6-digit OTP** from email.
4. Complete onboarding. **Do not** purchase Plus.

### Premium — Andrea, Marco, Nico, Patricia (P1–P4)

1. Same signup + OTP path as Free cohort.
2. Open Subscribe → complete **web checkout** (GCash/Maya) for ReviewNatin Plus.
3. Confirm Plus entitlements (no ads, unlimited practice, mocks, AI tutor, offline pack).

---

## What's new in build 10

- **Auth keyboard fix:** tappable Name/Email/Password labels on signup and login (`AuthLabeledField`)
- `showSoftInputOnFocus` on all auth text fields
- Android `softwareKeyboardLayoutMode: resize` — form scrolls when keyboard opens
- New Maestro gate: `auth-keyboard-smoke.yaml` (included in `npm run beta:automate`)
- Resend DNS automation script for `reviewnatinph.com` SMTP

---

## Known issues (build 10)

| ID | Severity | Issue |
|----|----------|-------|
| B10-1 | P1 | Cold `verify-email` deeplink opens signup without auth session |
| B10-2 | P1 | OTP email delivery requires `RESEND_API_KEY` (`npm run supabase:resend:setup`) |
| B10-3 | P2 | Premium web checkout needs live payment test on physical device |

Report issues: Settings → Report a problem, or GitHub beta-feedback template.
