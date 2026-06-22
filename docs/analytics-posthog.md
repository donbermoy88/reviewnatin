# PostHog analytics (mobile)

ReviewNatin uses **PostHog** for product analytics, dashboard chart engagement, and CTA microinteractions. In-app charts still load from Supabase (`lib/api/analytics.ts`); PostHog records when users view them and how they navigate the app.

## Setup

1. Create a PostHog project (US or EU).
2. Copy the **Project API Key** (`phc_…`).
3. Add to `apps/mobile/.env` (and EAS secrets for preview/production):

```bash
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # or https://eu.i.posthog.com
```

4. Rebuild the dev client or EAS build so env vars are baked in.

Without `EXPO_PUBLIC_POSTHOG_API_KEY`, analytics falls back to dev console logs + Sentry breadcrumbs only.

## Architecture

| Layer | Path | Role |
|-------|------|------|
| SDK singleton | `lib/analytics/posthog.ts` | Init, capture, screen, identify |
| Event API | `lib/analytics/events.ts` | `trackEvent()`, `trackMicrointeraction()` |
| Provider | `providers/analytics-provider.tsx` | `PostHogProvider`, `daily_active` |
| Screens | `components/analytics/posthog-screen-tracker.tsx` | Expo Router `$screen` events |
| Identity | `components/analytics/posthog-identity.tsx` | User id + beta cohort (`guest` / `free` / `premium`) |

Screen autocapture is **off** (`captureScreens: false`); we track routes manually via `usePathname()` because Expo Router + SDK 56 needs explicit screen names.

## Key events

| Event | When |
|-------|------|
| `daily_active` | Once per calendar day (AsyncStorage dedupe) |
| `registration_started` / `otp_sent` / `otp_verified` | Auth funnel |
| `onboarding_completed` | Onboarding finish |
| `practice_started` / `practice_completed` | Quiz loop |
| `mock_exam_started` / `mock_exam_completed` | Mock exams |
| `subscription_viewed` / `checkout_started` | Paywall |
| `dashboard_charts_viewed` | Home tab when subject charts render |
| `analytics_screen_opened` | Full `/analytics` screen |
| `ui_tap` | PrimaryButton haptic taps (`target`, `variant`, `size`) |

## PostHog dashboards

Suggested insights to create in PostHog:

1. **DAU** — unique users on `daily_active`
2. **Signup funnel** — `registration_started` → `otp_verified` → `onboarding_completed`
3. **Practice activation** — `practice_started` after onboarding
4. **Chart engagement** — `dashboard_charts_viewed` vs `analytics_screen_opened` by `cohort`
5. **Subscribe intent** — `subscription_viewed` → `checkout_started` → `subscription_active`
6. **CTA heatmap** — `ui_tap` grouped by `target`

Person properties: `email`, `cohort`, `auth_provider`.

## Privacy / Play Console

- PostHog receives pseudonymous user id (Supabase UUID), optional email, cohort, and product events.
- Document in Play Console **Data safety** under Analytics (see `docs/play-console-migration.md`).
