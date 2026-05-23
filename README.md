# ReviewNatin

Filipino-first mobile exam reviewer — **PasaPath**, Taglish explanations, and verified content for CSE, LET, and PNLE.

> Review together. Pass together.

This repository contains **MVP product specifications** produced from the concept audit (May 2026). Implementation has not started yet.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/01-phase-1-exam-blueprints.md](docs/01-phase-1-exam-blueprints.md) | Phase 1 exams: CSE Pro/Sub, LET, PNLE — official TOS alignment |
| [docs/02-database-schema.md](docs/02-database-schema.md) | Revised MVP database schema |
| [docs/03-pasapath-spec.md](docs/03-pasapath-spec.md) | PasaPath daily study engine + readiness score |
| [docs/04-mvp-screens.md](docs/04-mvp-screens.md) | 12 mobile screens + web admin split |
| [docs/05-pricing-iap.md](docs/05-pricing-iap.md) | Free / Exam Pass / Plus tiers + Apple/Google IAP |
| [docs/06-content-pipeline.md](docs/06-content-pipeline.md) | CSV import, review workflow, user reports |

## Positioning

**ReviewNatin** = the trusted, Filipino-friendly, path-guided mobile reviewer for 3 exams — not a shallow catalog of every board exam.

**Differentiation triangle:**
1. **PasaPath** — day-by-day plan from diagnostic to exam day
2. **Mistake Bank** — automatic weak-area mastery
3. **Taglish explanations** — explain like a beginner

## Tech stack (recommended)

- **Mobile:** Expo (React Native) + TypeScript
- **Web:** Next.js (marketing + admin CMS)
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Payments:** Apple IAP + Google Play Billing (Phase 1)

## Phase 1 exams

1. Civil Service — Professional & Subprofessional
2. LET — Elementary & Secondary
3. PNLE — Nursing Licensure

## 90-day build order

| Weeks | Focus |
|-------|-------|
| 1–2 | Blueprints, schema, admin CSV import |
| 3–4 | Core quiz loop + Taglish explanations |
| 5–6 | Mock exam + Mistake Bank + offline pack |
| 7–8 | PasaPath + dashboard + readiness score |
| 9–10 | Analytics + IAP + exam calendar |
| 11–12 | Beta (50 users), content QA, store submit |

## Legal disclaimer

ReviewNatin is an independent study tool. Not affiliated with the Civil Service Commission (CSC), Professional Regulation Commission (PRC), or any government agency.
