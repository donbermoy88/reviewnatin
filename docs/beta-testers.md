# Beta Tester Roster — Android (12 agent QA personas)

**4 testers per cohort:** Guest · Free · Premium

These are **automated QA personas** (emulator + Maestro + adb audit agents) representing the 12 daily beta testers. Each persona maps to a cohort smoke, exam focus, and audit owner for release gates.

| # | Cohort | Persona | Device profile | Android | Exam focus | Build v12 | Last audit | Notes |
|---|--------|---------|----------------|---------|------------|-----------|------------|-------|
| 1 | **Guest** | **Mara Santos** (G1) | Pixel 8 emulator | API 35 | CSE Professional | ✓ v28 | 2026-06-23 | P0 guest card PASS |
| 2 | **Guest** | **Diego Reyes** (G2) | Samsung A54 profile | API 35 | LET Elementary | ✓ v28 | 2026-06-23 | P0 “libre, walang signup” |
| 3 | **Guest** | **Anica Cruz** (G3) | Redmi Note 13 profile | API 35 | PNLE | ✓ v28 | 2026-06-23 | 20 Q Tagalog panel — manual |
| 4 | **Guest** | **Paolo Mendoza** (G4) | Vivo Y36 profile | API 35 | CSE Subprofessional | ✓ v28 | 2026-06-23 | Settings hint + feedback path |
| 5 | **Free** | **Jasmine Lo** (F1) | Pixel 7a profile | API 35 | CSE Professional | ✓ v28 | 2026-06-23 | OTP UI; verify deeplink Maestro ✗ |
| 6 | **Free** | **Kyle Tan** (F2) | Samsung S23 profile | API 35 | LET Secondary | ✓ v28 | 2026-06-23 | OAuth skip OTP — not exercised |
| 7 | **Free** | **Rica Villanueva** (F3) | Oppo A98 profile | API 35 | PNLE | ✓ v28 | 2026-06-23 | P0 limit copy at 20 Q |
| 8 | **Free** | **Lea Fernandez** (F4) | Galaxy A55 profile | API 35 | LET Elementary | ✓ v28 | 2026-06-23 | Mock preview — manual |
| 9 | **Premium** | **Andrea Bautista** (P1) | Pixel 8 Pro profile | API 35 | CSE Professional | ✓ v28 | 2026-06-23 | P0 Plus headline + login gate |
| 10 | **Premium** | **Marco Silva** (P2) | Tab S9 profile | API 35 | CSE Subprofessional | ✓ v28 | 2026-06-23 | Web checkout — manual |
| 11 | **Premium** | **Nico Almario** (P3) | OnePlus Nord profile | API 35 | Mixed exams | ✓ v28 | 2026-06-23 | Plus entitlement — manual |
| 12 | **Premium** | **Patricia Gomez** (P4) | Realme 11 profile | API 35 | LET Elementary | ✓ v28 | 2026-06-23 | Offline + AI — manual |

## Distribution — build 28 (current)

**Automated drop for AI subagents:** `npm run beta:agents` (or `npm run beta:agents -- --apk dist/beta/reviewnatin-beta-v28.apk`).

See [beta-distribution-build-28.md](./beta-distribution-build-28.md) for APK path, SHA-256, P0 UX checklist, and per-persona results. Latest agent run: `dist/beta/last-ai-testers-report.json`.

**Prior builds:** [build 12](./beta-distribution-build-12.md) · [build 10](./beta-distribution-build-10.md)

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

- [x] APK v28 distributed (`dist/beta/reviewnatin-beta-v28.apk`) — **includes P0 product UX audit**
- [x] Verify-email deeplink hardening (F1 still needs Maestro openLink pass)
- [x] Maestro: P0 copy assertions on guest card + Plus headline
- [x] SMTP configured for end-to-end OTP email (`npm run supabase:resend:setup` — verified 2026-06-22)
- [ ] Premium web checkout live test on physical device

## Feedback channels

1. **In-app:** Settings → "Report a problem"
2. **GitHub:** [Beta Feedback](../.github/ISSUE_TEMPLATE/beta-feedback.yml) — tag `cohort:guest|free|premium`
3. **Email:** beta@reviewnatinph.com
