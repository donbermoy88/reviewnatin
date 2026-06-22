# Mobile Design System — ReviewNatin PH

Source of truth for tokens: `packages/shared/src/tokens.ts` → re-exported in `apps/mobile/constants/theme.ts`.

## Typography

| Role | Font | Usage |
|------|------|--------|
| Brand | Plus Jakarta Sans 800 | Logo, hero brand marks |
| Headline | Plus Jakarta Sans 700 | Screen titles |
| Body | Plus Jakarta Sans 500/400 | Copy, labels |
| Caption | Plus Jakarta Sans 500 | Hints, metadata |

## Colors

| Token | Light | Usage |
|-------|-------|--------|
| `primary` | `#1E4FD9` | CTAs, links, active tab |
| `accent` | `#F5B800` | Highlights, streaks, gold |
| `background` | `#F7F9FC` | Screen bg |
| `surface` | `#FFFFFF` | Cards |
| `error` | Red family | Errors |
| `success` | Green family | Correct answers, verified |

Dark mode: `constants/dark-theme.ts` via `useAppTheme()`.

## Spacing & touch

- Grid: 4px base (`spacing.xs` → `spacing.xxl`)
- Min touch target: 48dp (`touchTarget.min`)
- Card radius: 18–22px (`radii.lg`, `radii.xl`)

## Core components

| Component | Path | Use |
|-----------|------|-----|
| `PrimaryButton` | `components/primary-button.tsx` | Main CTAs (haptic on press) |
| `ActionCard` | `components/ui/action-card.tsx` | List rows with icon |
| `ScreenScroll` | `components/screen-scroll.tsx` | Safe-area scroll shells |
| `GradientHeader` | `components/gradient-header.tsx` | Hero headers |
| `LoadingState` / `Skeleton` | `components/ui/`, `skeleton.tsx` | Loading |
| `ErrorState` | `components/error-state.tsx` | Retry UI |
| `EmptyState` | `components/empty-state.tsx` | No data |
| `ReadinessRing` | `components/readiness-ring.tsx` | Dashboard score |
| `PasswordStrengthMeter` | `components/password-strength-meter.tsx` | Signup |
| `TurnstileCaptcha` | `components/turnstile-captcha.tsx` | Optional signup CAPTCHA |
| `PasapathCoachMark` | `components/pasapath-coach-mark.tsx` | Post-onboarding hint |
| Study charts | `components/analytics/*` | Dashboard / Analytics |

## Patterns

- **Hero:** `LinearGradient` + rounded bottom corners (28px)
- **Errors:** `toUserFacingError()` from `lib/errors/user-facing.ts` — never raw Supabase messages
- **Analytics:** `trackEvent()` from `lib/analytics/events.ts`
- **Beta feedback:** `openBetaFeedback()` with cohort via `resolveBetaCohort()`

## Cohort UX

| Cohort | Auth | Ads | Practice | Subscribe |
|--------|------|-----|----------|-----------|
| Guest | Skip login | Yes | 20 Q/day local | Signup prompt |
| Free | OTP required | Yes | 20 Q/day | Web checkout |
| Premium | OTP required | No | Unlimited | Manage subscription |

See `docs/beta-audit-matrix.md` for full matrix.
