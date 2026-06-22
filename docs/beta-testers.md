# Beta Tester Roster — Android (12 agent QA personas)

**4 testers per cohort:** Guest · Free · Premium

These are **automated QA personas** (emulator + Maestro + adb audit agents) representing the 12 daily beta testers. Each persona maps to a cohort smoke, exam focus, and audit owner for release gates.

| # | Cohort | Persona | Device profile | Android | Exam focus | Build v10 | Last audit | Notes |
|---|--------|---------|----------------|---------|------------|-----------|------------|-------|
| 1 | **Guest** | **Mara Santos** (G1) | Pixel 8 emulator | API 35 | CSE Professional | ✓ | 2026-06-22 | Guest onboarding → Review tab smoke PASS |
| 2 | **Guest** | **Diego Reyes** (G2) | Samsung A54 profile | API 35 | LET Elementary | ✓ | 2026-06-22 | Deep links + subscribe guest CTA |
| 3 | **Guest** | **Anica Cruz** (G3) | Redmi Note 13 profile | API 35 | PNLE | ✓ | 2026-06-22 | 20 Q limit — pending manual pass |
| 4 | **Guest** | **Paolo Mendoza** (G4) | Vivo Y36 profile | API 35 | CSE Subprofessional | ✓ | 2026-06-22 | Settings beta feedback path |
| 5 | **Free** | **Jasmine Lo** (F1) | Pixel 7a profile | API 35 | CSE Professional | ✓ | 2026-06-22 | Signup → OTP UI (Maestro); SMTP pending |
| 6 | **Free** | **Kyle Tan** (F2) | Samsung S23 profile | API 35 | LET Secondary | ✓ | 2026-06-22 | OAuth skip OTP path — not exercised |
| 7 | **Free** | **Rica Villanueva** (F3) | Oppo A98 profile | API 35 | PNLE | ✓ | 2026-06-22 | 20 Q/day + ads — pending |
| 8 | **Free** | **Lea Fernandez** (F4) | Galaxy A55 profile | API 35 | LET Elementary | ✓ | 2026-06-22 | Mock preview limits — pending |
| 9 | **Premium** | **Andrea Bautista** (P1) | Pixel 8 Pro profile | API 35 | CSE Professional | ✓ | 2026-06-22 | Plus upsell → login gate PASS (Maestro) |
| 10 | **Premium** | **Marco Silva** (P2) | Tab S9 profile | API 35 | CSE Subprofessional | ✓ | 2026-06-22 | Web checkout — needs live payment test |
| 11 | **Premium** | **Nico Almario** (P3) | OnePlus Nord profile | API 35 | Mixed exams | ✓ | 2026-06-22 | No-ads entitlement — needs Plus activation |
| 12 | **Premium** | **Patricia Gomez** (P4) | Realme 11 profile | API 35 | LET Elementary | ✓ | 2026-06-22 | Offline pack + AI tutor — needs Plus |

## Distribution — build 10 (current)

See [beta-distribution-build-10.md](./beta-distribution-build-10.md) for APK URL, SHA-256, and per-cohort install instructions.

**Prior build:** [beta-distribution-build-7.md](./beta-distribution-build-7.md)

## Cohort setup instructions

### Guest (G1–G4)
- Install APK → tap **Get started — it's free** → complete onboarding → **Skip muna (guest)**
- Test paywall/signup prompts when hitting limits

### Free (F1–F4)
- Register with real email → complete OTP → onboarding
- Do **not** purchase Plus
- Verify 20 Q/day limit, ads visible, mock preview limits

### Premium (P1–P4)
- Register → OTP → onboarding
- Subscribe via **web checkout** on Subscribe screen (APK beta)
- Confirm ads hidden, unlimited practice, full mocks, AI tutor, offline pack

## Onboarding checklist (all 12 personas)

- [x] APK v10 distributed (EAS preview + local `dist/beta/reviewnatin-beta-v10.apk`)
- [x] Auth keyboard fix shipped in build 10
- [x] Maestro cohort smokes: Guest ✓ · Premium ✓ · Keyboard ✓ (Free verify deeplink pending)
- [ ] SMTP configured for end-to-end OTP email (`npm run supabase:resend:setup`)
- [ ] Premium web checkout live test on physical device

## Feedback channels

1. **In-app:** Settings → "Report a problem"
2. **GitHub:** [Beta Feedback](../.github/ISSUE_TEMPLATE/beta-feedback.yml) — tag `cohort:guest|free|premium`
3. **Email:** beta@reviewnatinph.com
