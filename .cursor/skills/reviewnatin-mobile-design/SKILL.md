---
name: reviewnatin-mobile-design
description: Design and polish ReviewNatin mobile UI (Expo SDK 56) with brand tokens, Ionicons, gradients, and Filipino-first copy. Use when styling apps/mobile, onboarding, dashboards, quiz screens, or when the user asks for modern app design, icons, or visual polish.
---

# ReviewNatin mobile design

Read before any UI work in `apps/mobile/`.

## Aesthetic direction

- **Tone:** Warm, trustworthy Filipino exam prep — not generic SaaS, not purple-gradient AI slop
- **Reference:** Marketing site `apps/marketing/app/page.tsx` — blue `#1E4FD9`, gold `#F5B800`, soft blobs, RN logo mark
- **Hero pattern:** Gradient background + decorative blobs + white elevated cards
- **Icons:** `@expo/vector-icons` Ionicons on every major action, list row, and onboarding step — never text-only option lists

## Brand tokens

Import from `constants/theme.ts` / `@reviewnatin/shared` — do not hardcode drift colors.

| Role | Value |
|------|-------|
| Primary | `#1E4FD9` |
| Accent | `#F5B800` |
| Background | `#F7F9FC` |
| Surface | `#FFFFFF` |

**Typography:** Syne only for large brand (`type.brand`, `AppLogo`). All in-app UI uses DM Sans (`type.headline`, `type.title`, `type.body`).

## Required components

Reuse before inventing:

| Component | Use |
|-----------|-----|
| `AppLogo` | Header brand mark (RN badge + wordmark) |
| `ScreenBackground` | Gradient + blob atmosphere behind screens |
| `IconBadge` | Circular icon container (primary/accent/success variants) |
| `FeatureRow` | Icon + title + description row |
| `SelectOption` | Tappable list option with icon + checkmark |
| `Card`, `PrimaryButton`, `Chip`, `StepIndicator` | Standard UI |

## Screen checklist

Every screen must have:

1. **Visual anchor** — logo, icon badge, or illustration area at top
2. **Hierarchy** — one headline, muted subtitle, grouped content in cards
3. **Icons** — tab bar, CTAs, list rows, empty states
4. **Touch targets** — min 48dp (`touchTarget.min`)
5. **Safe areas** — `ScreenScroll` with `safeTop` / `withTabBar`
6. **Filipino copy** — warm Taglish where helpful; CSC/PRC disclaimer where required

## Onboarding steps (icons)

| Step | Icon | Label |
|------|------|-------|
| 0 | `sparkles` | Welcome |
| 1 | `school` | Exam |
| 2 | `calendar` | Goals |
| 3 | `person-circle` | Account |
| 4 | `map` | PasaPath |

## Avoid

- Plain white screens with only text and one button
- Option lists without icons
- Emoji as primary iconography (tabs already use Ionicons)
- `npm audit fix --force`
- Syne on in-app titles (use DM Sans Bold)

## Related skills

- `~/.agents/skills/mobile-design-system` — touch targets, thumb zones, spacing grid
- `~/.claude/skills/frontend-design` — distinctive web/marketing layouts
