# Beta Audit Matrix — ReviewNatin PH (3 Cohorts)

Screen × cohort expected behavior. Update **Status** after each beta build (`—` untested, `✓` pass, `✗` fail).

**Cohorts:** **G** = Guest (no account) · **F** = Free (registered, no Plus) · **P** = Premium (active Plus via web checkout)

| Flow / Screen | G (Guest) | F (Free) | P (Premium) | Status |
|---------------|-----------|----------|-------------|--------|
| **Auth — skip login** | Can tap "Magpatuloy bilang guest" on login | N/A (signed in) | N/A | ✓ v10 Maestro |
| **Auth — email signup + OTP** | N/A | OTP required before app access | Same as Free | ✓ v10 keyboard · verify deeplink fix in code · SMTP pending |
| **Auth — OAuth** | N/A | Google/Apple → skip OTP | Same | — |
| **Onboarding** | Required once (local); cloud sync on signup later | Required; syncs to account | Same | ✓ v10 Maestro |
| **Dashboard** | Guest stats fallback; signup CTAs | Full dashboard; ads may show | Full; no ads | ✓ v10 guest |
| **Daily practice (20 Q limit)** | 20 Q/day then paywall | 20 Q/day then paywall | Unlimited | — |
| **Mock exam preview** | Preview / limited questions | Preview / limited | Full mock access | — |
| **AI tutor** | Signup prompt or limited | Daily limit (free tier) | Unlimited | — |
| **Ads (banner/interstitial)** | Shown on Home/Study/Result | Shown | Hidden | — |
| **Offline pack download** | Premium gate / signup prompt | Premium gate → subscribe | Download works | — |
| **Subscribe / paywall** | Prompt to create account | Web checkout (APK beta) | Manage subscription | ✓ v10 Maestro · P2–P4 checkout manual |
| **Restore purchases** | Hidden (no account) | N/A on APK (web checkout primary) | N/A on APK | — |
| **Leaderboard** | May show; scores local only | Full with account | Full | — |
| **Stats / Profile** | Guest progress local | Cloud sync | Cloud sync | — |
| **PasaPath** | Basic access per free tier | Basic / limited | Full | — |
| **Flashcards** | Available if content exists | Full (within limits) | Full | — |
| **Mistake Bank** | Local / limited without account | Cloud sync | Cloud sync | — |
| **Bookmarks** | Signup prompt for sync | Cloud sync | Cloud sync | — |
| **Settings — beta feedback** | Works (no user id in email) | Works with user id | Works | ✓ v10 code |
| **Settings — delete account** | Hidden / N/A | Available | Available | — |

**Current build:** v12 (2026-06-22) — see [beta-distribution-build-12.md](./beta-distribution-build-12.md), [product-experience-audit-2026-06-22.md](./product-experience-audit-2026-06-22.md), and [android-beta-emulator-audit-v10-2026-06-22.md](../audit/android-beta-emulator-audit-v10-2026-06-22.md).

## Release gates

Before shipping any beta APK, complete the **cohort smokes** and weighted score in [release-readiness-checklist.md](./release-readiness-checklist.md). Friday rotation must pass all three cohorts on the release candidate.

Automated helpers: `npm run mobile:test` (Vitest) and Maestro flows in `apps/mobile/.maestro/flows/`.

## Daily cohort rotation

Each weekday, QA runs one cohort-focused pass (rotate G → F → P → repeat):

| Day | Focus cohort | Minimum smoke |
|-----|--------------|---------------|
| Mon | **Guest (G)** | Guest onboarding → 20 Q practice → paywall → feedback report |
| Tue | **Free (F)** | Signup → OTP → practice → mock preview → leaderboard |
| Wed | **Premium (P)** | Web checkout Plus → no ads → full mock → AI tutor → offline pack |
| Thu | **Cross-cohort** | Re-test any P0/P1 from tester feedback (all cohorts) |
| Fri | **Release gate** | All three cohort smokes on latest APK before ship |

## Tester assignment

See [beta-testers.md](./beta-testers.md): 4 testers per cohort (12 total).

## Reporting failures

Tag GitHub issues with `cohort:guest`, `cohort:free`, or `cohort:premium`.
