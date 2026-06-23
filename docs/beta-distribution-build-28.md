# Beta Distribution — Build 28 (prior)

**Date:** 2026-06-23  
**Audience:** 12 agent QA personas (G1–G4 · F1–F4 · P1–P4) — see [beta-testers.md](./beta-testers.md)

**First build shipping P0 product UX audit:** guest next-step card, Tagalog paywall panel, Plus subscribe copy, Profile settings hint.

---

## Install package

| Field | Value |
|-------|-------|
| **Build** | `android.versionCode` **29** (EAS autoIncrement; artifact named v28) |
| **Package** | `ph.reviewnatin.app` |
| **Local copy** | `dist/beta/reviewnatin-beta-v28.apk` |
| **SHA-256** | `711388ec8074592091e7eb011b9fd803cc2790f51f3226d022ba95b658390447` |

Verify before install:

```bash
shasum -a 256 reviewnatin-beta-v28.apk
# must match: 711388ec8074592091e7eb011b9fd803cc2790f51f3226d022ba95b658390447
```

---

## Install steps (all 12 testers)

1. **Uninstall** any old ReviewNatin build:
   ```bash
   adb uninstall ph.reviewnatin.app
   ```
2. Install build **28** from `dist/beta/reviewnatin-beta-v28.apk`.
3. Open app — welcome screen (“Get started — it's free”), **not** Expo dev launcher.

---

## P0 UX — what to verify (all cohorts)

| P0 item | Where | Pass criteria |
|---------|-------|---------------|
| Guest next-step card | Home (guest) | “Simulan dito — libre, walang signup” + “Mag-practice ngayon” |
| Settings hint | Profile tab | “Tip: Buksan ang Settings dito…” (scroll below stats if needed) |
| Tagalog paywall panel | Practice after 20 Q | “Abot na ang libreng tanong ngayon” + Plus bullets + “Balik bukas” |
| Plus headline | Subscribe screen | “Lahat ng kailangan mo…” + CSC/PRC disclaimer |

---

## 12-tester persona results (build 28)

| Persona | Cohort | P0 UX | Automated smoke | Notes |
|---------|--------|-------|-----------------|-------|
| Mara Santos (G1) | Guest | ✓ guest card | ✓ Maestro | Start path clear |
| Diego Reyes (G2) | Guest | ✓ guest card | ✓ Maestro | “Libre, walang signup” copy |
| Anica Cruz (G3) | Guest | ✓ | — | 20 Q limit panel — manual |
| Paolo Mendoza (G4) | Guest | ✓ settings path | ✓ Maestro | Profile → Settings → Report |
| Jasmine Lo (F1) | Free | N/A | ✓ verify-email Maestro | SMTP live for inbox OTP |
| Kyle Tan (F2) | Free | N/A | ✓ keyboard smoke | OAuth path not exercised |
| Rica Villanueva (F3) | Free | ✓ limit copy | — | Hit 20 Q → Tagalog panel |
| Lea Fernandez (F4) | Free | ✓ limit copy | — | Mock preview limits — manual |
| Andrea Bautista (P1) | Premium | ✓ Plus copy in APK | ✗ subscribe deeplink v28 | Manual subscribe screen on v28 |
| Marco Silva (P2) | Premium | ✓ Plus copy in APK | — | Web checkout — manual |
| Nico Almario (P3) | Premium | ✓ | — | Plus entitlement — manual |
| Patricia Gomez (P4) | Premium | ✓ | — | Offline + AI — manual |

**Ship gate:** **Cleared for 12-tester distribution** — Guest P0 UX and Free verify-email Maestro **PASS** on v28. Premium subscribe deeplink fails on v28 APK (onboarding gate); Plus copy verified in bundle — P1 manual subscribe check. Gate fix committed for next build.

---

## Maestro results (v28 APK, 2026-06-23)

| Flow | Cohort | Result |
|------|--------|--------|
| `guest-onboarding-quiz.yaml` | G1–G2 | **PASS** |
| `guest-settings-feedback.yaml` | G4 | **PASS** |
| `auth-keyboard-smoke.yaml` | F1–F2 | **PASS** |
| `free-signup-path.yaml` | F1 | **PASS** |
| `deeplink-verify-email.yaml` | F1 | **PASS** |
| `premium-subscribe-hint.yaml` | P1 | **FAIL** (v28; gate fix pending rebuild) |

Report: `dist/beta/last-maestro-report.json`

---

## What's new vs build 12

- PostHog analytics wiring (needs `EXPO_PUBLIC_POSTHOG_API_KEY` in EAS for production telemetry)
- **P0 product UX audit** — guest card, limit panel, Plus copy, settings hint
- Maestro flows assert P0 copy
- Verify-email deeplink hardening (`consumeInitialUrl`, regex param parse, longer signup fallback)
- Beta automation: local EAS APK discovery fix

---

## Prior builds

[build 12](./beta-distribution-build-12.md) · [build 10](./beta-distribution-build-10.md)
