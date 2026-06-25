# ReviewNatin PH — Principal-Level Audit & Production Hardening Report
**Date:** 2026-06-25
**Scope:** Full architecture, security, performance, and Android-readiness audit covering guest/free/premium flows, dashboard, navigation, community feature, Supabase, and Android build. This report consolidates fresh findings with prior audits (`audit/android-principal-audit-2026-06-16.md`, `audit/android-readiness-2026-06-16.md`, `audit/security-audit.md`, `audit/db-performance.md`, `audit/env-gaps.md`, `audit/ci-failures-2026-06-05.md`) — items already fixed are marked **FIXED**, not re-investigated from scratch.

---

## 1. Executive Summary

ReviewNatin PH is architecturally mature. Auth, onboarding/exam-selection, server-enforced entitlements, and the bulk of RLS hardening already exist and have been through multiple prior audit passes. The app is **not** a greenfield build needing a rewrite — it needs targeted hardening plus one substantial net-new feature.

**The single largest gap against current product requirements: the "Community" feature (exam-scoped social feed — posts, comments, likes, follows, profile photos) does not exist at any layer.** No database tables, no RLS, no API client, no screens. Bottom navigation is also a 4-tab structure (Home/Study/Leaderboard/Profile) rather than the target 5-tab structure (Home/Practice/Mock Exam/Community/Profile), and the dashboard is denser (10+ stacked sections) than the "compact" target.

Known carry-over risks from prior audits, status as of this pass (re-verified 2026-06-25, Phase 2):
- Entitlement gate hardening (`user_has_content_access`) — **FIXED and confirmed live in prod.** `supabase migration list` shows `20260616120000_harden_content_access_gate` present in both the Local and Remote columns. One check remains, requiring a live prod query rather than a code change: confirm `app.demo_entitlements_enabled` is unset/false in prod — deferred, needs explicit go-ahead before querying prod (see §17).
- **New finding**: `supabase migration list` shows 11 migrations dated 2026-06-17 through 2026-06-24 exist locally but have an empty Remote column — i.e. they have not been pushed to the production database. This is a deploy backlog, not a code defect; needs a deliberate `supabase db push` decision from the user (deferred, see §17).
- Pricing source-of-truth — **re-investigated, found already fixed.** `apps/mobile/lib/subscription/pricing-display.ts`'s `resolveProductPrice()` treats the DB (`subscription_products.price`) as authoritative, with store-reported localized price (`lib/iap/store.ts`) as a display-only override (Play/App Store requires the shown price to match the store's own price). The only literal numeric price (`fallbackPhp = 159`) is explicitly documented as "UI only — not billing SoT," used solely while the catalog hasn't loaded yet. No hardcoded pricing map found anywhere in the client. The "3 sources of truth" finding from the 2026-06-16 audit no longer reflects current code — closing this item.
- Release build signs with the debug keystore — confirmed still true in `android/app/build.gradle`. **Partially addressed this pass**: wired a `keystore.properties`-driven release `signingConfig` (gitignored file, falls back to debug signing until the file exists — see `android/keystore.properties.example`) so the only remaining step is the user generating/supplying a real upload keystore. No functional change to current builds until that file is added.
- No automated entitlement/purchase-verification tests — **still open**, out of scope for this pass.

## 2. Architecture / Data Flow Summary

**Monorepo**: `apps/mobile` (Expo Router + React Native, the focus of this audit), `apps/admin` (Next.js admin panel), `apps/marketing` (Next.js marketing site), `packages/shared` (cross-app constants: `EXAM_CATALOG`, `EXAM_TYPES`, design tokens, generated `database.types`).

**State management**: Context + hooks throughout — `AuthProvider` (`providers/auth-provider.tsx`, Supabase session), `EntitlementsProvider` (`providers/entitlements-provider.tsx`, queries `user_entitlements`), `PreferencesProvider` (theme/notifications), `OnboardingGate`. No Redux/Zustand/react-query — all data fetching is manual `useState`+`useCallback`+Supabase client/RPC calls. This is a deliberate, consistent idiom across the codebase (confirmed: zero `@tanstack/*` or Redux deps in `package.json`).

**Navigation**: Expo Router file-based routing. Root stack (`app/_layout.tsx`) wraps a tab navigator (`app/(tabs)/_layout.tsx`, 4 tabs today) plus route groups: `(auth)/` (login/signup/verify/reset), `onboarding/`, `practice/quiz`, `study/[subjectSlug]`, `mock-review/[sessionId]`, `barkada/` (group quiz challenges), `subscribe/`, `profile/edit`, `notes/`, `flashcards/`, `mistakes/`, `pasapath/week`.

**Selected-exam flow**: `lib/onboarding-store.ts` persists `{ examSlug, targetDate, dailyMinutes, level, majorSlug?, completed }` via secure-store/AsyncStorage. Dashboard, Practice, Study, and Mock screens all correctly read the active exam from this store (or from `user_exam_goals` server-side for entitlement checks) — no inconsistency found between client display and server-resolved exam scope.

**Premium/entitlement flow**: `EntitlementsProvider` → `useEntitlements()` → `isPremium(examTypeId?)`. Server truth lives in `user_entitlements` (lifecycle fields: `status`, `current_period_end`, `grace_period_expires_at`, `revoked_at`) validated by the `user_has_content_access(exam_type_id)` Postgres function, called from RLS policies and RPCs (`get_practice_questions`, `get_mock_exam_questions`, `get_mistake_bank`) — i.e., premium content is gated **server-side**, not just by hiding UI.

## 3. Database and RLS Audit

64 migrations, ~50 tables across catalog/content, users/progress, quiz/analytics, monetization, social (Barkada), and admin/infra domains.

**RLS coverage**: 100% of public tables have RLS enabled; no table found with RLS-enabled-but-zero-policies (fully locked) or a write policy using bare `using(true)`. Pattern is consistent: public-read catalog tables (`exam_types`, `questions WHERE status='published'`), owner-only personal data (`FOR ALL USING (auth.uid() = user_id)`), premium-gated content via `user_has_content_access()`, staff-only admin tables via `is_staff_user()`, and membership-gated group tables (Barkada) via `EXISTS` subqueries.

**Entitlement gate** (`supabase/migrations/20260616120000_harden_content_access_gate.sql`): redefines `user_has_content_access` to use `COALESCE(grace_period_expires_at, current_period_end, expires_at) > now()`, exclude `revoked_at IS NOT NULL` and `status IN ('refunded','revoked','expired')`, and exclude `source='demo'` unless `app.demo_entitlements_enabled='true'`. This is a correct fix for the previously-flagged paywall-bypass risk (P0-2 in `android-principal-audit-2026-06-16.md`). **Action needed**: confirm this migration has actually been pushed to the production Supabase project and that `app.demo_entitlements_enabled` is unset/false there — this is an infra-state check, not a code change, and is called out in Phase 2 of the implementation plan.

**Storage**: one bucket today, `question-images` (public read, 5MB limit, image mime allowlist, write restricted to service-role). No user-generated-content bucket exists.

**Gap (not a flaw, a missing feature)**: no `community_posts`/`community_comments`/`community_post_likes`/`community_follows`/`community_reports` tables. The existing social feature, "Barkada" (`barkada_groups`/`barkada_members`/`barkada_challenges`/`barkada_challenge_results`), is a group-quiz-challenge feature, not a feed — it does not satisfy the Community requirement and is a good RLS/RPC pattern to clone, not a substitute.

## 4. API Audit

**Edge Functions** (7, all server-side, no client-exposed secrets found): `iap-verify` (Apple/Google receipt verification, calls `fulfill_iap_purchase()`), `store-webhook` (billing lifecycle sync via `apply_entitlement_lifecycle()`), `web-checkout-submit` (GCash/Maya verification), `ai-tutor` / `ai-explain` (Claude API calls, key stays server-side), `readiness-cron`, `push-reengage`.

**RPC pattern**: client never inserts/updates sensitive tables directly — all writes for Barkada, IAP fulfillment, and entitlement grants go through `SECURITY DEFINER` RPCs. This is the correct pattern to replicate for Community (see Refactoring Summary §10 and the implementation plan's Phase 3).

**Known gap**: pricing source-of-truth duplication — `apps/mobile/lib/api/entitlements.ts`'s `CANONICAL_PRODUCT_PRICING` hardcodes prices that should be sourced from `subscription_products` alone. Three sources (client hardcode, DB, Play Console) can drift; still open per prior audit.

## 5. Frontend Audit

**Dashboard** (`app/(tabs)/index.tsx`, ~1700 lines): renders 10+ stacked sections per load — hero/readiness ring, guest-next-step card, diagnostic card, plan-continue card, exam countdown card, quick-practice row, premium upsell strip, PasaPath daily-task card, content-gate banner, offline-pack card, mock-exam shortcut, bottom ads. Functionally complete but denser than the "compact dashboard" requirement; several cards answer overlapping questions (plan-continue and PasaPath both answer "what should I do now").

**Bottom nav** (`app/(tabs)/_layout.tsx`): 4 tabs today (Home/Study/Leaderboard/Profile) + hidden `settings` (via `href: null`). Target is 5 tabs (Home/Practice/Mock Exam/Community/Profile) — Study and Leaderboard need demotion to secondary screens, not deletion, and Practice/Mock Exam need to be split out of `study.tsx`'s internal sub-tab state into their own top-level screens.

**Lists/pagination**: every list in the app (leaderboard, bookmarks, mistakes) uses a single bounded `FlatList` fetch (e.g., leaderboard loads top 50 in one shot) with `RefreshControl`, no `onEndReached`/infinite-scroll pattern anywhere. A new feed screen will need to introduce cursor-based pagination for the first time in this codebase — recommended approach (no new dependency, consistent with existing idiom): manual `useState` cursor + `FlatList onEndReached`, not react-query/FlashList.

**Profile/avatars**: `profile/edit.tsx` renders text-initials only; no image picker, no avatar upload, no avatar storage anywhere in the app.

## 6. Android Emulator/ADB Audit

Extensive prior audit history exists: `audit/android-beta-emulator-audit-*.md` (multiple v7/v8/v10 passes, 2026-06-22), `audit/android-emulator-12-beta-tester-audit-2026-06-23.md`, `audit/android-device-beta-audit-2026-06-23.md` and `-24.md` (physical Vivo V2427/Android 16 device). These already exercised install/launch/login/guest/onboarding/back-button/restart/network-failure flows for the *existing* app surface. The custom automation built for this (`scripts/beta-device-audit.mjs`, `scripts/lib/device-audit-automation.mjs`, `scripts/lib/maestro-driver.mjs`) supports adb-driven UI checks across guest/free/premium personas and is the tool to extend for QA of new Community/nav/dashboard work (Phase 6 of the implementation plan) rather than building new tooling. Note: these scripts currently have uncommitted in-progress edits from other work — coordinate before extending.

**Not yet covered by prior passes** (because the features don't exist yet): Community feed CRUD, profile photo upload, the 5-tab nav, the compacted dashboard. These become new ADB/Maestro test cases once built.

## 7. Security Audit

- **Premium access**: server-enforced (RLS + RPC checks via `user_has_content_access`), not frontend-only. ✅
- **Entitlement gate lifecycle bug**: code-fixed, prod-push status needs verification (see §3).
- **Storage uploads**: only one bucket exists today and it's service-role-write-only (no user-upload attack surface yet). The planned `avatars` bucket (Phase 3) must restrict writes to the owner's own path (`{user_id}/avatar.*`) and cap file size/mime type, cloning the existing `question-images` policy shape.
- **Community feature security requirements** (since it doesn't exist yet, these are requirements for Phase 3, not findings against existing code): ownership-checked edit/delete via RLS, unique constraints preventing duplicate likes (`PRIMARY KEY (post_id, user_id)`) and duplicate/self-follows (`PRIMARY KEY (follower_id, followee_id)` + `CHECK (follower_id <> followee_id)`), guests blocked from writes but allowed to read, exam-scope resolved server-side from `user_exam_goals` (never trust a client-supplied `exam_type_id`), soft-delete preserving moderation audit trail, a `community_reports` table feeding moderation.
- **Secrets**: `.env`/`.env.local` files are not committed to git history (verified via prior audit); service-role key isolated to `apps/admin/.env.local`. `APPLE_IAP_SHARED_SECRET`/`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` are server-only Supabase function secrets, not client-exposed.
- **Release signing**: `android/app/build.gradle` release build config still points at the debug keystore — this is a security and Play Store compliance issue (debug keys are not suitable for production app signing), still open.

## 8. Performance Audit

`audit/db-performance.md` (migration `20260529000000_performance_indexes.sql`) already added composite covering indexes for the hottest read paths: quiz history, bookmarks, mistake bank, entitlement/paywall checks (`idx_user_entitlements_user`, called on nearly every screen), exam goals, Barkada rosters, AI usage rate-limits. This work is done and should not be redone.

**New performance requirement for Phase 3 (Community)**: the feed must use **keyset pagination**, not `OFFSET`/`LIMIT` — a composite index `idx_community_posts_feed (exam_type_id, created_at DESC, id DESC)` keeps each page fetch O(log n) regardless of scroll depth and avoids the classic feed bug where offset pagination skips/duplicates rows as new posts arrive concurrently. Like/comment counts should be denormalized columns (`like_count`, `comment_count`) maintained by triggers rather than `COUNT(*)` subqueries per feed row — avoids O(n) extra index scans per page render.

**Dashboard**: no measured perf issue found (the issue is visual density, not render cost), but compaction work in Phase 5 should keep an eye on re-render scope when merging cards.

## 9. DevOps Audit

CI/CD has a documented failure history (`audit/ci-failures-2026-06-05.md`): ESLint `react-hooks/refs` violations (reading `.current` during render — a real anti-pattern flagged by `eslint-config-expo` SDK 56's newer lint rules), `supabase db lint`/`db reset` flag issues, a Vercel deploy failure (GitHub App not linked at project level), and a Supabase free-tier auto-pause breaking the keep-alive ping (separately already addressed per memory: "keep-alive fixed"). These are process/CI hygiene issues, not application bugs — worth a pre-flight check (`npm run lint`, confirm Supabase project isn't paused) before this engagement's own migrations/deploys.

**Env hygiene** (`audit/env-gaps.md`): no secrets committed to git; AdMob production unit IDs and IAP server secrets (`APPLE_IAP_SHARED_SECRET`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`) still need provisioning before production submission — orthogonal to this audit's scope but a hard release blocker.

**Build profiles**: `eas.json` has development/development-device/preview/production profiles; production targets `app-bundle` with `autoIncrement` versionCode — correctly configured. The blocker is signing (§7), not the EAS profile structure.

## 10. Refactoring Summary

- Dashboard: collapse overlapping "what do I do now" cards (plan-continue + PasaPath) into one; collapse multiple premium-upsell UI elements into a single conditional banner.
- Nav: extract Practice/Mock Exam out of `study.tsx`'s internal `STUDY_TABS` state into standalone top-level screens — this also removes a small amount of routing complexity (no more passing an `activeTab` param through navigation to land on a sub-tab).
- Pricing: remove `CANONICAL_PRODUCT_PRICING` client hardcode once DB is confirmed authoritative.
- No dead-code/duplicate-table cleanup needed — the audit found no redundant tables or obviously dead Supabase functions.

## 11. Files Changed

**Phase 1 (audit, no code):** `audit/principal-audit-2026-06-25.md` (this file).

**Phase 2 (critical fixes):**
- `apps/mobile/android/app/build.gradle`, `apps/mobile/android/.gitignore`, `apps/mobile/android/keystore.properties.example` — release-signing wiring (no-op until a real keystore is supplied).
- Pricing and entitlement-gate findings: re-investigated, no code changes needed (already fixed in prior work).

**Phase 3 (Community feature):**
- `supabase/migrations/20260625120000_community_feature.sql` — new tables, RLS, RPCs, triggers, `avatars` storage bucket, `users.avatar_url` column.
- `apps/mobile/lib/api/community.ts`, `apps/mobile/lib/api/avatar.ts` (new), `apps/mobile/lib/format/relative-time.ts` (new).
- `apps/mobile/components/community-report-button.tsx` (new).
- `apps/mobile/app/(tabs)/community.tsx`, `apps/mobile/app/community/[postId].tsx`, `apps/mobile/app/community/profile/[userId].tsx` (new screens).
- `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/_layout.tsx` — route registration (community tab hidden via `href: null` pending Phase 4).
- `apps/mobile/app/profile/edit.tsx`, `apps/mobile/hooks/use-user-profile.ts`, `apps/mobile/lib/api/profile.ts` — avatar upload + display wiring.
- `apps/mobile/package.json` — added `expo-image-picker`.
- Not regenerated: `packages/shared/src/database.types.ts` (generated file, requires DB access this session didn't have for `db:gen-types`; harmless since the Supabase client is untyped, but regenerate when DB access is available).

## 12. Supabase Migration/RLS Summary (planned, Phase 3)

One new migration, `supabase/migrations/<timestamp>_community_feature.sql`:
- Tables: `community_posts`, `community_comments`, `community_post_likes`, `community_follows`, `community_reports`.
- Indexes: `idx_community_posts_feed (exam_type_id, created_at DESC, id DESC)` partial on non-deleted/non-hidden; `idx_community_posts_author`; `idx_community_comments_post`; `idx_community_post_likes_user`; `idx_community_follows_followee`; `idx_community_reports_open`.
- RLS: public SELECT (anon-readable, guests can browse), owner-scoped INSERT/UPDATE, no DELETE policy (soft-delete via RPC only).
- RPCs: `get_community_feed`, `create_community_post`, `toggle_community_like`, `create_community_comment`, `get_community_comments`, `toggle_community_follow`, `report_community_content`, `soft_delete_community_post`, `soft_delete_community_comment`.
- Storage: new `avatars` bucket + path-scoped (`{user_id}/avatar.*`) write policies; new `users.avatar_url` column.

## 13. QA Checklist

- [ ] Guest can browse Community feed, sees locked state on post/like/comment/follow actions.
- [ ] Free and Premium users can post/edit/delete own posts and comments, like/unlike, follow/unfollow, upload avatar.
- [ ] Cannot edit/delete another user's post/comment (RLS-verified, not just UI-hidden).
- [ ] Duplicate like/follow attempts are no-ops, not errors or duplicate rows.
- [ ] Report flow creates a `community_reports` row visible to admin tooling.
- [ ] Feed pagination has no duplicate/skipped posts when new posts arrive mid-scroll.
- [ ] All 5 bottom-nav tabs render and existing deep links (`reviewnatin://`, notification taps to `study`/`leaderboard`/`progress`) still resolve after the nav restructure.
- [ ] Dashboard renders correctly in light/dark mode post-compaction, no orphaned/duplicate upgrade prompts.
- [ ] Entitlement gate prod-push and `app.demo_entitlements_enabled` verified off.
- [ ] Back button, app restart/session persistence, network-failure, keyboard-overlap, and layout-overflow checks re-run on every new/changed screen (per existing emulator audit methodology).

## 14. Monitoring/Logging Strategy

No dedicated APM/error-tracking audit exists yet beyond `EXPO_PUBLIC_SENTRY_DSN` being a recommended-but-unconfirmed env placeholder (`audit/env-gaps.md`). Recommendation: confirm Sentry (or equivalent) is wired for the mobile app before Community ships, since a net-new write-heavy feature (posts/comments/likes) is the highest-risk surface for new runtime errors. At minimum, log RPC failures from the new `lib/api/community.ts` client functions distinctly (e.g. a `community.*` error tag) so feed-specific issues are triageable separately from existing quiz/entitlement errors. Server-side, `admin_logs`/`content_changelog` tables already exist and can be extended for moderation action logging (report resolution) without new infrastructure.

## 15. Disaster Recovery Plan

Supabase manages automated backups at the platform tier level (verify current plan's backup retention window — not independently confirmed this pass). Recommendations specific to new Community data: because `community_reports` references posts/comments by FK and posts/comments are soft-deleted (not hard-deleted), moderation history survives accidental content removal — this is itself a lightweight recovery mechanism for "undo a bad delete" within the soft-delete window. No additional DR infrastructure is required for Phase 3 beyond what Supabase already provides; if/when the platform tier changes, re-verify point-in-time-recovery (PITR) is enabled given the app now holds user-generated content (higher data-loss sensitivity than read-only catalog content).

## 16. Scaling Plan

- **1K users**: current architecture handles this trivially; no action needed. Community feed query load at this scale is negligible even without caching.
- **10K users**: existing indexes (§8) plus the new `idx_community_posts_feed` keyset index are sufficient. Watch `user_entitlements` lookup volume (called on most screens) — already indexed.
- **100K users**: consider read-replica or connection pooling tuning on Supabase (Supavisor) if concurrent connections become a bottleneck; the `like_count`/`comment_count` denormalization (rather than `COUNT(*)`) becomes increasingly important at this scale to keep feed-page latency flat. Edge functions (`iap-verify`, `ai-tutor`) should have rate-limiting reviewed (`ai_tutor_usage`/`ai_explanation_usage` already have per-user-per-hour indexes — confirm the limiting logic itself, not just the lookup index, scales).
- **1M users**: feed fan-out (showing posts from followed/exam-peer users) may need to move from query-time joins to a precomputed/cached feed if `get_community_feed`'s exam-scoped query alone isn't sufficient (it should be, since it's not a personalized follow-based timeline in v1 — it's exam-scoped, not follow-scoped). Revisit if a "following feed" mode is added later. AI tutor/explain usage costs (external LLM calls) become a meaningful cost driver — confirm rate limits are tuned for unit economics at this scale, not just abuse prevention.

## 17. Remaining Risks

1. ~~Entitlement gate prod-deployment status~~ — **resolved this pass**, confirmed live via `supabase migration list`.
2. **`app.demo_entitlements_enabled` prod value unconfirmed** — requires a live read-only query against the production database. Deferred pending explicit go-ahead (this touches prod, per the standing rule of confirming before prod actions).
3. **11 local migrations (2026-06-17 → 2026-06-24) not pushed to remote** — newly discovered this pass via `supabase migration list`. Needs the user's decision on what's safe to push and when; deferred pending go-ahead (`supabase db push` is a prod-affecting action).
4. Release signing uses debug keystore — gradle wiring prepared this pass; still blocked on the user generating/supplying a real upload keystore (`android/keystore.properties`, see `.example` template).
5. ~~Pricing 3-sources-of-truth~~ — **resolved**, re-investigation found current code already treats the DB as authoritative.
6. No automated tests for entitlement/purchase verification logic (open since prior audit) — Community feature should not repeat this gap; at minimum, RLS ownership checks should be smoke-tested before ship.
7. Community feature is entirely new code — highest-risk surface in this engagement by volume of new logic (migrations + RPCs + RLS + screens); mitigate via the phased checkpoint structure in the implementation plan rather than shipping it all at once.
8. AdMob production unit IDs and IAP server secrets still need provisioning before store submission (orthogonal but blocking for launch).

## 18. Final Recommendation Before Production Release

Do not ship to production until: (a) the entitlement gate migration is confirmed live in prod with demo-entitlements off, (b) release builds are signed with a real upload keystore (not debug), and (c) the Community feature — once built — has had at least one full RLS-ownership smoke pass (verify a non-owner genuinely cannot edit/delete another user's post/comment via direct RPC call, not just via the UI). Everything else in this report is hardening/polish that improves quality but is not a hard blocker on the scale of those three items.
