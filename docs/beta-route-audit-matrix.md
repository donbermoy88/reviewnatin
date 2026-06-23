# Beta Route Audit Matrix — Phase 2 (36 routes)

Screen × cohort expected behavior for the Android beta program. Update **Status** after each build.

**Cohorts:** **G** Guest · **F** Free · **P** Premium  
**Legend:** `✓` pass · `✗` fail · `—` not tested · `n/a` not applicable · `doc` documented limitation

**Automated:** `npm run beta:phase2:verify` · Maestro: `apps/mobile/.maestro/flows/` · Deep links: `lib/deep-link-routes.test.ts`

| # | Route | Area | G | F | P | Status (v28) | Notes |
|---|-------|------|---|---|---|--------------|-------|
| 1 | `/` (index) | Welcome | ✓ | ✓ | ✓ | ✓ | Cold start → Get started |
| 2 | `/(auth)/login` | Auth | n/a | ✓ | ✓ | ✓ | Keyboard smoke Maestro |
| 3 | `/(auth)/signup` | Auth | n/a | ✓ | ✓ | ✓ | OTP → verify-email |
| 4 | `/(auth)/verify-email` | Auth | n/a | ✓ | ✓ | ✗ | Cold deeplink flaky (F1) |
| 5 | `/(auth)/forgot-password` | Auth | n/a | ✓ | ✓ | — | User-facing errors |
| 6 | `/(auth)/reset-password` | Auth | n/a | ✓ | ✓ | — | Deep link from email |
| 7 | `/auth/callback` | Auth | n/a | ✓ | ✓ | — | OAuth return |
| 8 | `/onboarding` | Onboarding | ✓ | ✓ | ✓ | ✓ | Guest skip path Maestro |
| 9 | `/(tabs)/index` | Dashboard | ✓ | ✓ | ✓ | ✓ | Guest next-step card P0 |
| 10 | `/(tabs)/study` | Study | ✓ | ✓ | ✓ | ✓ | ScreenState empty copy |
| 11 | `/(tabs)/leaderboard` | Social | ✓ | ✓ | ✓ | ✓ | ErrorState + FlatList |
| 12 | `/(tabs)/progress` | Profile | ✓ | ✓ | ✓ | ✓ | Settings hint P0 |
| 13 | `/(tabs)/settings` | Settings | ✓ | ✓ | ✓ | ✓ | Beta feedback Maestro |
| 14 | `/practice/quiz` | Practice | ✓ | ✓ | ✓ | ✓ | Choice a11y + offline flusher |
| 15 | `/practice/result` | Practice | ✓ | ✓ | ✓ | — | AI explain limits |
| 16 | `/mock-review/[sessionId]` | Mock | n/a | ✓ | ✓ | ✓ | FlatList (verify perf) |
| 17 | `/study/[subjectSlug]` | Study | ✓ | ✓ | ✓ | — | Subject drill-down |
| 18 | `/study/lesson/[id]` | Study | ✓ | ✓ | ✓ | — | TTS errors mapped |
| 19 | `/subscribe` | Monetization | ✓ | ✓ | ✓ | ✓ | Web checkout APK; store price SoT |
| 20 | `/analytics` | Analytics | n/a | ✓ | ✓ | ✓ | ErrorState + retry (Phase 2) |
| 21 | `/tutor` | AI | gate | limit | ✓ | — | Premium gate; Plus via web |
| 22 | `/flashcards` | Study | ✓ | ✓ | ✓ | — | Save errors Taglish |
| 23 | `/mistakes` | Study | n/a | ✓ | ✓ | ✓ | ErrorState |
| 24 | `/bookmarks` | Study | n/a | ✓ | ✓ | ✓ | ErrorState |
| 25 | `/notes` | Study | n/a | ✓ | ✓ | — | Delete confirm Taglish |
| 26 | `/pasapath/week` | PasaPath | ✓ | ✓ | ✓ | — | Weekly task |
| 27 | `/offline-lessons` | Offline | gate | gate | ✓ | — | Premium download |
| 28 | `/focus` | Focus | ✓ | ✓ | ✓ | — | Timer mode |
| 29 | `/barkada` | Social | n/a | ✓ | ✓ | ✓ | User-facing errors (Phase 2) |
| 30 | `/profile/edit` | Profile | n/a | ✓ | ✓ | — | Account fields |
| 31 | `/exam-calendar` | Utility | ✓ | ✓ | ✓ | — | Exam dates |
| 32 | `/changelog` | Utility | ✓ | ✓ | ✓ | — | Static |
| 33 | `/legal` | Utility | ✓ | ✓ | ✓ | — | Static |
| 34 | `/streak-freeze` | Gamification | n/a | ✓ | ✓ | — | Streak item |
| 35 | `/diagnostic/intro` | Diagnostic | n/a | ✓ | ✓ | — | Pre-quiz intro |
| 36 | Deep links | Routing | ✓ | ✓ | ✓ | ✓ | Vitest + Maestro deeplink flow |

## Phase 2 backlog (not blocking beta)

| Item | Priority | Phase |
|------|----------|-------|
| Global search | P2 | Backlog |
| Onboarding illustrations | P1 | Phase 3 |
| Dashboard charts polish | P2 | Phase 4 |
| FCM push on APK sideload | doc | Phase 6 / Play migration |

## Regression commands

```bash
npm run beta:phase2:verify
npm run mobile:test -- deep-link-routes user-facing
npm run beta:maestro
```

See [android-beta-program-phase-2.md](./android-beta-program-phase-2.md).
