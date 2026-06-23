# Phase 3 — Onboarding Redesign

**Sprint:** Week 3  
**Status:** Code complete (local) — Maestro guest onboarding smoke recommended each release  
**Ship candidate:** [Build 28](./beta-distribution-build-28.md)

Parent program: [android-beta-program.md](./android-beta-program.md)  
Prior: [Phase 2 — Screen audit & UX](./android-beta-program-phase-2.md) · Next: Phase 4 — Analytics & charts

---

## Goal

Increase activation and retention by polishing onboarding UX, dashboard preview, first-practice routing, and post-onboarding coach marks — **without** rewriting `onboarding-store` or goal sync.

---

## Deliverables checklist

### 3.1 Welcome experience (Step 0)

| Item | Status | Location |
|------|--------|----------|
| Brand hero (LogoMark + exam chips) | ✅ | `app/onboarding/index.tsx` step 0 |
| Reanimated transitions (`FadeInUp`, `ZoomIn`) | ✅ | Same |
| Taglish headline | ✅ | “Handa ka na bang pumasa sa CSE, LET, o PNLE?” |
| Step 1 personalized exam headline | ✅ | “Handa ka na bang pumasa sa {exam}?” |

### 3.2 Goal selection (Steps 1–4)

| Item | Status | Location |
|------|--------|----------|
| Exam → proficiency → daily goal → account | ✅ | Steps 1–4 |
| Explicit proficiency step | ✅ | Step 2 + `ONBOARDING_LEVELS` |
| Per-step hero illustrations | ✅ | `components/onboarding-step-hero.tsx` |
| Dashboard preview + readiness ring | ✅ | Step 5 — `previewReadinessPercent(level)` |

### 3.3 Post-onboarding activation

| Item | Status | Location |
|------|--------|----------|
| PasaPath coach mark (Taglish) | ✅ | `components/pasapath-coach-mark.tsx` |
| Activation pending flag after finish | ✅ | `lib/onboarding-activation.ts` |
| Dashboard consumes activation + shows coach | ✅ | `app/(tabs)/index.tsx` |
| First practice deep link by level | ✅ | `lib/onboarding-first-practice.ts` |
| “Simulan ang unang practice” CTA | ✅ | Step 5 → `getPostOnboardingHref({ startPractice: true })` |
| `onboarding_completed` analytics | ✅ | `examSlug`, `level`, `dailyMinutes`, `startPractice` |

**Do not break:** `lib/onboarding-store.ts`, `lib/auth/post-auth.ts`, guest skip path — preserved.

---

## Commands

```bash
npm run beta:phase3:verify
npm run mobile:test -- onboarding-first-practice onboarding-nav
npm run beta:maestro   # guest-onboarding-quiz.yaml
```

Report: `dist/beta/phase3-verify.json`

---

## Acceptance criteria

- [ ] `npm run beta:phase3:verify` passes
- [ ] Guest path: welcome → steps → dashboard OR first practice
- [ ] Step 5 preview ring reflects proficiency level
- [ ] Signed-in user sees PasaPath coach after onboarding (when task exists)
- [ ] `onboarding_completed` fires with `dailyMinutes` in PostHog/Sentry breadcrumb

---

## Related

| Doc | Purpose |
|-----|---------|
| [beta-testers.md](./beta-testers.md) | G1–G4 guest onboarding smokes |
| [product-experience-audit-2026-06-22.md](./product-experience-audit-2026-06-22.md) | P0 guest activation |
