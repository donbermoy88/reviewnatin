# Domains and Roadmap

## Domains (confirmed)

| Surface | URL | Stack |
|---------|-----|-------|
| Marketing | **https://reviewnatinph.com** | Next.js |
| Admin CMS | `https://admin.reviewnatinph.com` (recommended) | Next.js |
| Mobile app | App Store / Play Store | Expo (React Native) |
| API / backend | Supabase project URL | Supabase |

App deep links and legal pages should point to `reviewnatinph.com` (Privacy, Terms, disclaimers).

---

## Current status

- [x] Concept audit and competitor research
- [x] MVP product specs (blueprints, schema, PasaPath, screens, pricing, content pipeline)
- [x] SQL migration draft (`supabase/migrations/20260523120000_mvp_schema.sql`)
- [x] Supabase project provisioned (`reviewnatin`, migrations + seed applied)
- [x] Expo mobile app scaffolded (`apps/mobile`)
- [x] Marketing site scaffolded (`apps/marketing` → deploy to reviewnatinph.com)
- [x] Admin shell (`apps/admin`)
- [x] Seed SQL (`supabase/sql/catalog_seed.sql`, loaded via `supabase/seed/001_catalog.sql`)
- [ ] Question content + review pipeline
- [ ] Beta and store submission

---

## What to do next (recommended order)

### Step 1 — Foundation (Week 1)

1. **Create Supabase project** — run migrations via `npm run db:push`, then catalog seed (`supabase/sql/catalog_seed.sql`).
2. **Seed catalog** — insert Phase 1 `exam_types`, `subject_areas`, `topics`, and `exam_blueprints` from [01-phase-1-exam-blueprints.md](./01-phase-1-exam-blueprints.md).
3. **Scaffold Expo app** — `npx create-expo-app`, Expo Router, TypeScript, Zustand, Supabase client.
4. **Scaffold marketing site** — Next.js on `reviewnatinph.com` (hero, 3 exams, pricing, disclaimers, store badges).

### Step 2 — Core loop (Weeks 2–4)

5. **Auth + onboarding** — exam selection, goal setup, diagnostic session API.
6. **Practice quiz** — fetch questions, submit answers, EN + Taglish explanations.
7. **Admin v1** — CSV import script + review queue at `admin.reviewnatinph.com`.

### Step 3 — Differentiation (Weeks 5–8)

8. **Mock exam + Mistake Bank** — Board Exam Mode rules.
9. **PasaPath engine** — daily plan generator + dashboard card ([03-pasapath-spec.md](./03-pasapath-spec.md)).
10. **Readiness score** — nightly cron + dashboard breakdown.

### Step 4 — Ship (Weeks 9–12)

11. **IAP** — ReviewNatin Plus subscription SKUs ([05-pricing-iap.md](./05-pricing-iap.md)).
12. **Content QA sprint** — hit min question counts per exam before public launch.
13. **Closed beta** (~50 users) → App Store / Play Store submit.

---

## Immediate next action

If starting today, pick **one** of these parallel tracks:

| Track | First task | Owner skill |
|-------|------------|-------------|
| **Backend** | Supabase project + run migration + seed CSE blueprint | SQL / Supabase |
| **Mobile** | `create-expo-app` + auth shell + onboarding screens | Expo skills |
| **Web** | Next.js landing on reviewnatinph.com (static MVP) | frontend-design |
| **Content** | Hire/recruit 2 reviewers; start CSE question authoring in CSV template | content-pipeline |

**Critical path:** Backend seed + Admin CSV import before bulk content entry. Mobile can use mock data until API is ready.

---

## Deferred (do not start yet)

- Leaderboard, Barkada mode
- GCash/Maya payments
- Exams beyond CSE / LET / PNLE
- Bar, PSHS, scholarship modules
