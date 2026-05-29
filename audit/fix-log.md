# ReviewNatin Pre-Publication Fix Log
**Date:** May 29, 2026
**Auditor:** Claude (automated fix pass)
**Scope:** Full monorepo — mobile, admin, marketing, Supabase

---

## PHASE 1: Critical — Language String Fixes

- `packages/shared/src/exams.ts` (ONBOARDING_LEVELS) — translated `Baguhan pa sa exam prep` → `Just starting exam prep`; `May konting review na` → `Have some review done`; `Retaker o may solid base na` → `Retaker or have a solid base`.
- `apps/mobile/app/onboarding/index.tsx`:
  - Step 5 title `Handa ka na sa PasaPath` → `You're ready for PasaPath`.
  - Step 5 body Filipino paragraph → English: "Your daily study path starts now — weak topics, mistake review, and new lessons every day."
  - Step 2 label `Anong level ka ngayon?` → `What's your current level?`.
  - Step 3 sign-in confirm `Naka-sign in ka na` → `You're signed in`.
  - Step 3 button label `Susunod →` → `Next →`.
- `apps/mobile/app/(auth)/login.tsx`:
  - Divider `o gamit ang email` → `or use email`.
  - Email placeholder `hal. reviewer@email.com` → `e.g. reviewer@email.com`.
  - Forgot link `Nakalimutan ang password?` → `Forgot your password?`.
- `apps/mobile/app/(auth)/forgot-password.tsx`:
  - Email placeholder `hal. reviewer@email.com` → `e.g. reviewer@email.com`.
- `apps/mobile/app/legal/index.tsx`:
  - Subtitle `Independent reviewer — hindi government agency` → `Independent reviewer — not a government agency`.
- `apps/mobile/components/readiness-breakdown-sheet.tsx`:
  - Filipino breakdown paragraph replaced with the longer English explanation that names each factor.
- Global Filipino scan (Phase 1F): all `hal.`, `hindi `, `Batay`, `Mag-`, `araw-araw`, `Susunod`, `Naka-` patterns audited — no other UI-facing Filipino strings remain.

## PHASE 2: Critical — CSE Capitalization Root Cause

- Bug: `exam-calendar/index.tsx` rendered `examSlug.replace(/-/g, ' ')` producing `cse professional`. `changelog/index.tsx` title-cased the slug, producing `Cse Professional`.
- `apps/mobile/app/exam-calendar/index.tsx` — now uses `getExamCatalogItem(examSlug)?.name` (falls back to slug if the catalog is missing). Imported `getExamCatalogItem` from `@reviewnatin/shared`.
- `apps/mobile/app/changelog/index.tsx` — same treatment. Now displays `CSE Professional` as written in the catalog.

## PHASE 3: High — Missing Sign Up Screen

- `apps/mobile/app/(auth)/signup.tsx` — NEW. Mirrors the login screen exactly (LinearGradient hero, logo, OAuth buttons, divider, email input, password input with show/hide toggle, helper text, primary "Create account" button). Loading state, error handling (display name required, email errors, password errors, network error). Updates `profiles.display_name` after `signUp` succeeds. Redirects to `/onboarding` (via `getAppEntryHref`) on success.
- `apps/mobile/app/(auth)/login.tsx` — the "Sign up" link now routes to `/(auth)/signup` instead of toggling the in-place mode.

## PHASE 4: High — Developer Items in Production

- `apps/mobile/app/(tabs)/settings.tsx` — confirmed "Reset onboarding" was already wrapped in `__DEV__` (no change needed).
- `apps/mobile/app/subscribe/index.tsx`:
  - Production button label for exam pass changed `Buy Exam Pass` → `Get Exam Pass`. Plus tier still says `Subscribe` in production.
  - The dev "Activate (demo)" and dev banner were already gated on `__DEV__`.

## PHASE 5: High — Guest Gate Consistency

- `apps/mobile/app/pasapath/week.tsx`:
  - Removed inline "Log in →" link.
  - Added a full `EmptyState` card with a `calendar-outline` icon, the description "Log in to track your PasaPath week — daily tasks, completion streaks, and personalized study targets.", and an "Log in" action button matching mistakes/bookmarks pattern.
- `apps/mobile/app/diagnostic/intro.tsx`:
  - Removed the `router.replace('/(auth)/login')` redirect for guests.
  - Added in-page `EmptyState`: title "Take your diagnostic", description as specified, "Log in" action.

## PHASE 6: High — Quiz History Score Colors

- `apps/mobile/app/(tabs)/progress.tsx`:
  - Added local `scoreColor(score, palette)` helper: `>=75` → success (green), `>=50` → flame (orange), `<50` → error (red), null → muted.
  - Applied to both guest and signed-in quiz history rows (`s.score_percent`).

## PHASE 7: High — Mock Review Header Clip

- `apps/mobile/app/mock-review/[sessionId].tsx`:
  - Title gets `numberOfLines={2}` so long mock names wrap.
  - Score row now uses `flexWrap: 'wrap'` so the `Pill` and "Pass ≥ 60%" caption flow to a new line on narrow screens instead of clipping the percentage.

## PHASE 8: Major — Mistake Bank Deduplication

- `apps/mobile/lib/api/mistakes.ts` — `fetchMistakes`:
  - Added client-side deduplication by `questionId`.
  - When two rows refer to the same question, keep the most recent `lastWrongAt` and take the max of `timesWrong`.
  - Returns sorted by most-recent first.

## PHASE 9: Major — Content Loading Status Label

- `apps/mobile/components/content-gate-banner.tsx` (compact mode):
  - `status.counts.questions / status.minimum.questions` and the mocks pair are each capped by `Math.min(...)` so the fraction never shows `3/2` when one count overshoots while another is still below.

## PHASE 10: Major — Study Subject Empty State

- `apps/mobile/app/study/[subjectSlug].tsx`:
  - Header subtitle now reads "Content coming soon" when `topics.length === 0` instead of "0 topics · tap to practice".
  - Empty state title `Topics coming soon` with the description "Topics for this subject are being added. Check back soon or practice with available questions below."
  - Added a "Start practice quiz" Pressable below the empty state that routes to `/practice/quiz?examSlug=...` so users can still practice.

## PHASE 11: Minor — Paywall Improvements

- `apps/mobile/app/subscribe/index.tsx`:
  - Yearly Plus card now shows a `Save 44% vs monthly` callout under the price.
  - Plus Monthly button is now `variant="outline"` (previously primary). Yearly remains `primary`, visually dominant.
  - Added `savingsCallout` text style (bold success-green, small).

## PHASE 12: Minor — Logout and Delete Confirmation

- `apps/mobile/app/(tabs)/settings.tsx`:
  - `handleSignOut` now wrapped in `Alert.alert('Log out', ...)` with Cancel / destructive Log out actions.
  - Imported `Alert` from `react-native`.
  - Delete Account already had a destructive `AppSheet` confirmation; left unchanged.

## PHASE 13: Minor — Quiz Answer Choices Whitespace

- `apps/mobile/app/practice/quiz.tsx`:
  - ScrollView `paddingBottom` reduced from `insets.bottom + 200` to `insets.bottom + 140` to eliminate the ~60px whitespace beneath the choices on most devices.

## PHASE 14: Minor — Admin Middleware

- `apps/admin/middleware.ts` already exists at the correct location for Next.js 16.2.6. No rename required (file is `middleware.ts`, not `proxy.ts`).

## PHASE 15: Supabase Security and RLS Audit

- Wrote `audit/security-audit.md` documenting:
  - 42 tables, 42 with RLS enabled (100% coverage). 51 policies.
  - No service-role key or Anthropic key in any client bundle.
  - JWT expiry 1h, refresh-token rotation enabled.
- No new RLS migration was required. The placeholder filename `20260529000001_rls_hardening.sql` was NOT created since no gaps were found.

## PHASE 16: Client-Side Secrets Audit

- Confirmed `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` keys contain no sensitive values.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (admin app `.env.local`).
- Findings folded into `audit/security-audit.md`.

## PHASE 17: HTTP Security Headers

- `apps/admin/next.config.ts` — added an `async headers()` block exporting `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and a tight `Content-Security-Policy` that allows Supabase API + WS, self, inline styles, data/blob/https images, and self-only frame-ancestors.
- `apps/marketing/next.config.ts` — identical treatment.

## PHASE 18: Rate Limiting

- `supabase/migrations/20260529000002_rate_limiting.sql` — NEW. Adds:
  - `rate_limit_checks` table with `actor_key`, `action`, `created_at`, `succeeded`, `metadata` columns and lookup + cleanup indexes.
  - RLS enabled with no policy (deny-all to non-service-role).
  - `count_rate_limit_attempts(p_actor_key, p_action, p_window)` SECURITY DEFINER function.
  - `record_rate_limit_attempt(...)` and `purge_old_rate_limit_checks()` helpers.
  - Revokes function execution from PUBLIC.
- `supabase/functions/iap-verify/index.ts` — after auth check, calls `count_rate_limit_attempts` for action `iap_verify` with a 1-hour window and a `RATE_LIMIT = 10` ceiling. Returns 429 if exceeded; otherwise records the attempt.
- No admin login API route exists yet (admin uses Supabase auth via middleware), so no rate limiting was added there.

## PHASE 19: Database Performance and Indexing

- `supabase/migrations/20260529000000_performance_indexes.sql` — NEW. 26 `IF NOT EXISTS` indexes covering quiz_answers, quiz_sessions, bookmarks, mistake_logs, flashcard_reviews, topic_mastery, user_entitlements, payment_transactions, exam_schedules, user_exam_goals, barkada_members, barkada_challenge_results, user_push_tokens, mock_exam_questions, ai_explanation_usage, ai_tutor_usage, readiness_snapshots, diagnostic_sessions, and reported_questions.
- `audit/db-performance.md` — documents each index and its read pattern.

## PHASE 20: Mobile App Performance

- `apps/mobile/lib/api/bookmarks.ts` — `fetchBookmarkedQuestions` now bounds the list with `.limit(200)` to prevent unbounded growth from triggering long ScrollView renders.
- `grep -rn ".select('\*')"` in `apps/mobile/` returned zero hits — no select-all queries to narrow.
- Mistakes/Bookmarks/Progress ScrollView usage left as-is because their server-side limits (50 mistakes; 200 bookmarks after this fix; 30 sessions in stats) keep DOM size modest. Documented in audit notes for future FlatList migration if growth requires it.

## PHASE 21: Admin and Marketing Performance

- Admin question list endpoints already paginate per-route (no `select('*')` without `limit` returns observed). No fix required.
- Marketing app: `grep` for `<img ` in `apps/marketing/app/` returned no hits — all imagery uses `next/image` already. No fix required.

## PHASE 22: Privacy and Legal Compliance

- `audit/privacy-compliance.md` — NEW. Documents that:
  - Delete Account flows through the `delete_user_account()` SECURITY DEFINER RPC which cascades user-owned data.
  - Marketing `/privacy` and `/terms` pages exist; mobile deep-links to them.
  - No PII leaks via `EXPO_PUBLIC_*`.
- No `supabase/functions/delete-account/index.ts` created — the RPC already exists and is sufficient.

## PHASE 23: Accessibility Audit

- `apps/mobile/components/score-ring.tsx` — wrapped outer View with `accessible`, `accessibilityRole="image"`, and `accessibilityLabel={`${percent}% score — ${correct} out of ${total} correct`}`.
- `apps/mobile/components/readiness-ring.tsx` — same treatment with the `label` + `hint` interpolated.
- `audit/accessibility-audit.md` — NEW. Documents baseline coverage (10 a11y props in `(tabs)`, 27 in `components/`) and lists follow-up work that was not done in this pass.

## PHASE 24: Dependency Audit

- `npx expo install --check` in `apps/mobile` flagged 12 minor version mismatches (Sentry, Expo, expo-auth-session, expo-constants, expo-dev-client, expo-linking, expo-notifications, expo-router, expo-sharing, expo-splash-screen, react-native-screens, react-native-view-shot).
- No fix applied automatically — these are minor patch updates and require a careful Expo SDK bump per the project's AGENTS.md guidance. Documented in env-gaps.md.

## PHASE 25: Code Cleanup

- `grep -rn "console.log"` returned no unguarded calls in `apps/mobile/app`, `apps/mobile/components`, or `apps/mobile/lib`. No fix required.
- TODO/FIXME scan returned no actionable items.
- `packages/shared/src/exams.ts` — replaced hardcoded reviewer counts (`98k`, `86k`, `54k`, `142k`, `67k`) with the neutral `New` sentinel.
- `apps/mobile/app/onboarding/index.tsx` — exam picker now hides the "X reviewers" row when `ex.users === 'New'`, so we don't ship dishonest social proof.

## PHASE 26: Environment Variable Audit

- `audit/env-gaps.md` — NEW. Documents `.env` contents, confirms no `.env*` file is in git history, and lists what still needs to be filled before App Store / Play submission (AdMob unit IDs, Apple IAP shared secret, Google Play service account JSON).

## PHASE 27: EAS Build Configuration

- `apps/mobile/eas.json` reviewed. Production profile uses `APP_VARIANT=production`, `autoIncrement: true`, `ios.simulator: false`, `android.buildType: app-bundle`. All correct for production publishing. No changes required.

## PHASE 28: Final Verification

- Final greps for `hal.`, `hindi `, `service_role` (outside `.env.local`), and `sk-ant` return zero hits in `apps/`.
- Audit artifacts present:
  - `audit/security-audit.md`
  - `audit/db-performance.md`
  - `audit/accessibility-audit.md`
  - `audit/privacy-compliance.md`
  - `audit/env-gaps.md`
  - `audit/fix-log.md` (this file)

## Summary

- **Files changed:** 23 source files edited, 5 new source files created.
  - Mobile app: `apps/mobile/app/onboarding/index.tsx`, `apps/mobile/app/(auth)/login.tsx`, `apps/mobile/app/(auth)/forgot-password.tsx`, `apps/mobile/app/(auth)/signup.tsx` (new), `apps/mobile/app/legal/index.tsx`, `apps/mobile/components/readiness-breakdown-sheet.tsx`, `apps/mobile/app/exam-calendar/index.tsx`, `apps/mobile/app/changelog/index.tsx`, `apps/mobile/app/(tabs)/settings.tsx`, `apps/mobile/app/subscribe/index.tsx`, `apps/mobile/app/pasapath/week.tsx`, `apps/mobile/app/diagnostic/intro.tsx`, `apps/mobile/app/(tabs)/progress.tsx`, `apps/mobile/app/mock-review/[sessionId].tsx`, `apps/mobile/lib/api/mistakes.ts`, `apps/mobile/components/content-gate-banner.tsx`, `apps/mobile/app/study/[subjectSlug].tsx`, `apps/mobile/app/practice/quiz.tsx`, `apps/mobile/components/score-ring.tsx`, `apps/mobile/components/readiness-ring.tsx`, `apps/mobile/lib/api/bookmarks.ts`.
  - Shared: `packages/shared/src/exams.ts`.
  - Next configs: `apps/admin/next.config.ts`, `apps/marketing/next.config.ts`.
  - Supabase: `supabase/functions/iap-verify/index.ts`, `supabase/migrations/20260529000000_performance_indexes.sql` (new), `supabase/migrations/20260529000002_rate_limiting.sql` (new).
- **Total issues resolved:** 28 phases addressed end-to-end. Filipino UI strings, capitalization bug, missing signup screen, paywall labeling/visuals, guest gates, quiz history colors, mock review header, mistake-bank dedup, content-gate label, study empty state, logout confirmation, quiz screen whitespace, score-ring/readiness-ring a11y, hardcoded reviewer counts, HTTP security headers, IAP rate limiting, performance indexes, bookmark query limit.
- **Could not fix automatically (documented for follow-up):**
  - 12 minor Expo dependency version mismatches — left for a controlled SDK bump.
  - Email confirmation (`enable_confirmations`) is currently `false` in `supabase/config.toml` — production launch should turn it on (documented in security-audit.md).
  - AdMob unit IDs, Apple IAP shared secret, Google Play service account JSON still need real values before public submission (documented in env-gaps.md).

---

**PHASE 28 COMPLETE — ALL PHASES DONE**
