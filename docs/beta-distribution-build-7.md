# Beta APK Distribution — Build 7

**Date:** 2026-06-22  
**Audience:** 12 agent QA personas (G1–G4 · F1–F4 · P1–P4) — see [beta-testers.md](./beta-testers.md)

---

## Install package

| Field | Value |
|-------|-------|
| **Build** | `android.versionCode` **7** |
| **Package** | `ph.reviewnatin.app` |
| **EAS build** | [6877bf05-67fa-4cc3-a076-11e63ba45009](https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/6877bf05-67fa-4cc3-a076-11e63ba45009) |
| **APK download (EAS)** | https://expo.dev/artifacts/eas/SuaEKXuupCeljpXC93BcXaM8FhR6YpRICDWYacpyV64.apk |
| **Local copy** | `dist/beta/reviewnatin-beta-v7.apk` |
| **SHA-256** | `b9bf3a5dbf2449a22a1f79de78fc65df010552e3d2999483601b23f79ed30f3a` |

Verify before install:

```bash
shasum -a 256 reviewnatin-beta-v7.apk
# must match: b9bf3a5dbf2449a22a1f79de78fc65df010552e3d2999483601b23f79ed30f3a
```

---

## Install steps (all testers)

1. Enable **Install unknown apps** for your browser or file manager.
2. Uninstall any old ReviewNatin build first (dev client or older preview):
   ```bash
   adb uninstall ph.reviewnatin.app
   ```
3. Install build 7 APK.
4. Open app — you should see the **welcome screen** (“Get started — it's free”), **not** the Expo dev launcher.

---

## Per-cohort instructions

### Guest — Mara, Diego, Anica, Paolo (G1–G4)

1. Tap **Get started — it's free** → complete onboarding (pick your exam focus).
2. On step 4, tap **Skip muna (guest)**.
3. Tap **Pumunta sa Dashboard** → explore Home, Review, Subscribe.
4. Report any signup CTAs that block core study flows.

### Free — Jasmine, Kyle, Rica, Lea (F1–F4)

1. Tap **Log in** on welcome → **Sign up** (or open `reviewnatin://signup`).
2. Register with a **real email** you can access.
3. Enter the **6-digit OTP** from email (requires SMTP — run `npm run supabase:resend:setup` if OTP email doesn't arrive).
4. Complete onboarding. **Do not** purchase Plus.
5. Confirm 20 questions/day limit and visible ads.

### Premium — Andrea, Marco, Nico, Patricia (P1–P4)

1. Same signup + OTP path as Free cohort.
2. Open Subscribe (Home Plus card or `reviewnatin://subscribe` after onboarding).
3. Complete **web checkout** (GCash/Maya) for ReviewNatin Plus.
4. Confirm: no ads, unlimited practice, full mocks, AI tutor, offline pack.

---

## What's new in build 7

- SMTP/OTP automation scripts (`npm run supabase:smtp`, `supabase:resend:setup`)
- Maestro cohort smokes fixed for preview APK welcome-first launch
- 6-digit OTP templates applied on hosted Supabase
- Deep-link routes: `login`, `signup`, `verify-email`, `subscribe`

---

## Known issues (build 7)

| ID | Severity | Issue |
|----|----------|-------|
| B7-1 | P1 | OTP email delivery blocked until `RESEND_API_KEY` configured |
| B7-2 | P2 | Deep links to `/subscribe` redirect to onboarding until guest onboarding complete |
| B7-3 | P2 | Free cohort Maestro smoke depends on unique email + SMTP for full pass |

Report issues: Settings → Report a problem, or GitHub beta-feedback template.
