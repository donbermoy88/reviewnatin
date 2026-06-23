# Phase 4 — Analytics, Dashboard Charts & Microinteractions

**Sprint:** Week 4  
**Status:** Code complete (local) — set `EXPO_PUBLIC_POSTHOG_API_KEY` on EAS preview for live funnels  
**Ship candidate:** [Build 28](./beta-distribution-build-28.md)

Parent program: [android-beta-program.md](./android-beta-program.md)  
Prior: [Phase 3 — Onboarding](./android-beta-program-phase-3.md) · Next: Phase 5 — Performance & subscription

PostHog setup: [analytics-posthog.md](./analytics-posthog.md)

---

## Goal

Product analytics via **PostHog**, dashboard chart engagement on Home + `/analytics`, and lightweight microinteractions (haptics, press feedback, pull-to-refresh) without hurting low-end devices.

---

## Deliverables checklist

### 4.1 Product analytics SDK

| Item | Status | Location |
|------|--------|----------|
| PostHog provider + daily_active dedupe | ✅ | `providers/analytics-provider.tsx` |
| Typed event catalog | ✅ | `lib/analytics/events.ts` |
| Funnel catalog (verify gate) | ✅ | `lib/analytics/funnel-catalog.ts` |
| Screen + identity tracking | ✅ | `posthog-screen-tracker.tsx`, `posthog-identity.tsx` |
| Sentry breadcrumbs (parallel) | ✅ | `lib/monitoring/events.ts` |

**Funnel events wired:**

| Event | Trigger |
|-------|---------|
| `registration_started` | Signup submit |
| `otp_sent` / `otp_verified` | OTP flow |
| `onboarding_completed` | Onboarding finish |
| `practice_started` / `practice_completed` | Quiz |
| `mock_exam_started` / `mock_exam_completed` | Mock mode |
| `flashcard_session` | Flashcards |
| `ai_tutor_message` | Tutor send |
| `subscription_viewed` / `checkout_started` / `subscription_active` | Paywall + checkout |
| `daily_active` | Once per day (foreground) |

### 4.2 Dashboard analytics upgrade

| Item | Status | Location |
|------|--------|----------|
| 7-day study trend chart | ✅ | `StudyTrendChart` on Home + `/analytics` |
| Subject strength chart | ✅ | `SubjectStrengthChart` |
| Actionable insight cards | ✅ | `buildAnalyticsInsights()` — “Review N weak topics” |
| `dashboard_charts_viewed` event | ✅ | Home tab when charts render |
| Data source (Supabase RPC) | ✅ | `lib/api/analytics.ts`, `lib/api/study-trend.ts` |

### 4.3 Microinteractions

| Item | Status | Location |
|------|--------|----------|
| PrimaryButton haptic + press scale | ✅ | `components/primary-button.tsx` |
| Reduced motion respect | ✅ | `hooks/use-reduced-motion.ts` |
| Dashboard / study / leaderboard pull-to-refresh | ✅ | `RefreshControl` on tabs |
| Loading skeletons (dashboard, leaderboard) | ✅ | `components/skeleton.tsx` |
| Quiz answer feedback | ✅ | Existing quiz UI animations |
| OTP verify success animation | ✅ | `verify-email.tsx` (Reanimated) |

---

## Commands

```bash
npm run beta:phase4:verify
npm run mobile:test -- funnel-catalog insights posthog
```

Set in EAS preview / `.env`:

```bash
EXPO_PUBLIC_POSTHOG_API_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Report: `dist/beta/phase4-verify.json`

---

## Acceptance criteria

- [ ] `npm run beta:phase4:verify` passes (all funnel events found in code)
- [ ] PostHog receives `daily_active` on preview build (manual smoke)
- [ ] Home tab shows Study insights block for signed-in users
- [ ] Subscribe web checkout fires `subscription_active` on paid status
- [ ] PrimaryButton skips scale transform when Reduce Motion is on

---

## PostHog dashboards (suggested)

1. DAU — `daily_active`
2. Signup funnel — `registration_started` → `otp_verified` → `onboarding_completed`
3. Practice activation — `practice_started` after onboarding
4. Chart engagement — `dashboard_charts_viewed` vs `analytics_screen_opened`
5. Subscribe — `subscription_viewed` → `checkout_started` → `subscription_active`

---

## Related

| Doc | Purpose |
|-----|---------|
| [analytics-posthog.md](./analytics-posthog.md) | Env vars, architecture, privacy |
| [release-readiness-checklist.md](./release-readiness-checklist.md) | Release gates |
