# Beta Tester Roster — Android (12 agent QA personas)

**4 testers per cohort:** Guest · Free · Premium

These are **automated QA personas** (emulator + Maestro + adb audit agents) representing the 12 daily beta testers. Each persona maps to a cohort smoke, exam focus, and audit owner for release gates.

| # | Cohort | Persona | Device profile | Android | Exam focus | Build v36 | Last audit | Notes |
|---|--------|---------|----------------|---------|------------|-----------|------------|-------|
| 1 | **Guest** | **Mara Santos** (G1) | Pixel 8 emulator | API 35 | CSE Professional | ✓ v36 | 2026-06-23 | Maestro onboarding PASS |
| 2 | **Guest** | **Diego Reyes** (G2) | Samsung A54 profile | API 35 | LET Elementary | ✓ v36 | 2026-06-23 | 20 Q limit — manual |
| 3 | **Guest** | **Anica Cruz** (G3) | Redmi Note 13 profile | API 35 | PNLE | ✓ v36 | 2026-06-23 | Ads visibility — manual |
| 4 | **Guest** | **Paolo Mendoza** (G4) | Vivo Y36 profile | API 35 | CSE Subprofessional | ✓ v36 | 2026-06-23 | Maestro settings feedback PASS |
| 5 | **Free** | **Jasmine Lo** (F1) | Pixel 7a profile | API 35 | CSE Professional | ✓ v36 | 2026-06-23 | Maestro signup PASS; cold verify-email deeplink warn |
| 6 | **Free** | **Kyle Tan** (F2) | Samsung S23 profile | API 35 | LET Secondary | ✓ v36 | 2026-06-23 | Maestro keyboard PASS; OAuth — manual |
| 7 | **Free** | **Rica Villanueva** (F3) | Oppo A98 profile | API 35 | PNLE | ✓ v36 | 2026-06-23 | 20 Q limit — manual |
| 8 | **Free** | **Lea Fernandez** (F4) | Galaxy A55 profile | API 35 | LET Elementary | ✓ v36 | 2026-06-23 | Mock preview — manual |
| 9 | **Premium** | **Andrea Bautista** (P1) | Pixel 8 Pro profile | API 35 | CSE Professional | ✓ v36 | 2026-06-23 | Maestro subscribe hint PASS |
| 10 | **Premium** | **Marco Silva** (P2) | Tab S9 profile | API 35 | CSE Subprofessional | ✓ v36 | 2026-06-23 | **Google Play purchase — manual (physical device)** |
| 11 | **Premium** | **Nico Almario** (P3) | OnePlus Nord profile | API 35 | Mixed exams | ✓ v36 | 2026-06-23 | Plus entitlement — manual |
| 12 | **Premium** | **Patricia Gomez** (P4) | Realme 11 profile | API 35 | LET Elementary | ✓ v36 | 2026-06-23 | Offline + AI — manual |

## Distribution — build 36 (current)

**APK:** [beta-distribution-build-36.md](./beta-distribution-build-36.md)  
**Automated drop:** `npm run beta:agents -- --apk dist/beta/reviewnatin-beta-v36.apk --skip-cloud`  
**Physical device audit:** `npm run adb:wireless` (pair) → `npm run beta:device-audit -- --apk …`  
**Taglish post:** `dist/beta/release-notes-taglish-build-36.txt`

**Prior builds:** [build 28](./beta-distribution-build-28.md) · [build 12](./beta-distribution-build-12.md)

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
- Subscribe via **Google Play Billing** on Subscribe screen (Play internal testing) — see [play-billing-paywall-compliance.md](./play-billing-paywall-compliance.md)
- Confirm ads hidden, unlimited practice, full mocks, AI tutor, offline pack

## Onboarding checklist (all 12 personas)

- [x] APK v36 distributed (`dist/beta/reviewnatin-beta-v36.apk`)
- [x] Maestro 5/5 flows PASS on build 36
- [x] SMTP configured for OTP email (Resend verified)
- [x] `beta:security:verify` green on prod
- [ ] Release notes posted to tester group — **manual**
- [ ] Premium Google Play purchase on physical device (Play internal track)

## Feedback channels

1. **In-app:** Settings → "Report a problem"
2. **GitHub:** [Beta Feedback](../.github/ISSUE_TEMPLATE/beta-feedback.yml) — tag `cohort:guest|free|premium`
3. **Email:** beta@reviewnatinph.com
