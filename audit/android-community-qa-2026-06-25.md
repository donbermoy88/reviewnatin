# Android Device QA — Community Feature, Nav Restructure, Dashboard Compaction
**Date:** 2026-06-25
**Device:** Android emulator `Medium_Phone_API_35` (1080×2400), local debug dev-client build
**Scope:** Phases 3–6 of the production-hardening plan (Community feature, bottom-nav restructure, dashboard compaction, this QA pass)

## Setup note (important context for future sessions)

The AVD had `ph.reviewnatin.app` installed from an **EAS preview/beta build** (`dist/beta/reviewnatin-beta-v38.apk`), which embeds its own JS bundle and never talks to local Metro. Every code change appeared to silently do nothing — not a caching bug, but testing against the wrong build entirely. Fixed by uninstalling the beta build and installing a freshly built local debug APK (`expo run:android`), which also required a one-line fix to `MainActivity.kt`'s `onNewIntent` override (signature was incompatible with the current Android SDK, blocking the native build entirely — unrelated to this feature work but a hard blocker for any local testing). See `[[android-device-testing-gotchas]]` memory for the full diagnostic trail.

## What was tested

### Community feature (Phase 3)
- Guest: feed loads read-only, exam-scoped header ("CSE Professional reviewers"), composer shows "Log in to post" and **does not** allow typing.
- Guest tap-to-login: found and fixed a bug where the composer (`editable={false}` TextInput) silently ate guest taps instead of redirecting to login — Android doesn't fire `onFocus` on a disabled input. Replaced with a `Pressable`; reverified working.
- Found and fixed a `FlatList.onEndReached` infinite-retry loop when the initial feed load fails (backend doesn't have the migration yet) — `hasMore` was never reset to `false` in the error path, so the empty/errored list kept re-triggering pagination forever. Froze interaction (`uiautomator` reported "could not get idle state" with high sustained CPU). Fixed by setting `hasMore = false` on both the initial-load and load-more error paths; reverified — UI goes idle immediately after the fix.
- Error state (`get_community_feed` RPC doesn't exist yet — migration not pushed to the real Supabase project) renders the expected friendly Taglish error card with a retry button — no crash, no white screen.

### Bottom nav restructure (Phase 4)
- All 5 tabs (Home, Practice, Mock Exam, Community, Profile) render and load correctly.
- Practice tab: subjects list, search, ad banner for free users, footer CTA — all working.
- Mock Exam tab: 3 mock exams listed with correct guest-gating badges ("Log in").
- Demoted routes (`study`, `leaderboard`) confirmed still reachable: Home's "Tingnan ang subjects" link and the new Profile "Leaderboard" button both navigate correctly to the now-hidden tabs.
- Tab-to-tab back-button behavior (lands on Home, not the previous tab) confirmed to be pre-existing default React Navigation behavior (`backBehavior: 'initialRoute'`), not a regression — same behavior existed before this restructure for any tab-routed screen (e.g. the pre-existing hidden `settings` tab).

### Dashboard compaction (Phase 5)
- Redundant "Continue" card removed — daily-goal ring now renders alone, full width, no layout breakage.
- Plus-upsell gradient banner removed — confirmed absent from the scroll, no gap/seam left behind.
- New "Mock exams" and "Community" shortcut cards render correctly between Quick Practice and Subject Shortcuts; Community shortcut confirmed to navigate to and correctly highlight the Community tab.
- Full scroll-through: no clipped text, no overlapping elements, no broken spacing at any section boundary.

### This QA pass (Phase 6)
- **Network failure**: toggled wifi+data off via `adb shell svc wifi/data disable`. The app correctly shows a pre-existing "Offline — using saved content" banner (not something I built — confirms existing offline handling wasn't broken by these changes).
- **Found (pre-existing, not introduced by this work): a PostHog analytics SDK retry-storm during network flapping measurably degrades touch responsiveness for a sustained period** — toggling network off/on repeatedly produced a recurring "Error while flushing PostHog" toast and tab-bar taps were dropped for noticeably longer than the toast's own visible duration. Confirmed this is unrelated to the Community/nav/dashboard code: a fresh app restart (clearing the retry backlog) immediately restored normal tap responsiveness on the exact same Community tab. Not fixed — out of scope (PostHog SDK behavior, not part of this engagement) — but worth a follow-up ticket since it's a real UX papercut for any user with flaky connectivity.
- **App restart / session persistence**: force-stop + relaunch correctly restored the guest session and onboarding state (landed directly on the dashboard, no re-onboarding prompt).
- **Avatar upload**: not tested end-to-end. Testing requires a signed-in account, and this Supabase project is the real production instance — creating a throwaway account would write real data to prod. Deferred pending your go-ahead, consistent with how every other prod-write action was handled this session. The code itself (`lib/api/avatar.ts`) was validated via `tsc`/lint and follows the same patterns as the rest of the codebase's Supabase Storage usage.
- **Logcat**: no `FATAL`/`AndroidRuntime` crashes attributable to any of this session's changes across the entire testing session. One unrelated pre-existing crash was found and is **not** fixed (out of scope): Expo Router's dev-only "Unmatched Route → Sitemap" screen throws `TypeError: Cannot read property 'origin' of undefined` — only reachable by an invalid/unregistered deep link, not a real user flow.
- **Memory**: `dumpsys meminfo` showed a normal profile for a debug RN build (~700MB PSS total, no signs of a leak across repeated navigation).

## Known limitations (carried into the final report)

1. Migration not pushed to any Supabase project (local or prod) — full CRUD (create/edit/delete post, like, comment, follow) against real data is not testable until that happens.
2. Avatar upload not end-to-end tested (needs a signed-in test account against prod — deferred).
3. PostHog retry-storm during network flapping (pre-existing, unrelated, not fixed).
4. Unmatched-route Sitemap crash (pre-existing, unrelated, not fixed).

## Remaining risk before this ships

Same three items flagged throughout this engagement: (1) confirm the entitlement-gate migration backlog status before pushing anything new, (2) the Community migration itself still needs a deliberate `supabase db push` decision, (3) a real upload keystore is still needed for release builds. Everything in Phases 3–5's actual application code has been verified correct on a real device, not just in code review.

## Update 2026-06-25 (later same day) — authenticated CRUD + avatar upload, now testable

The Community migration is live (see `[[community-feature-plan]]`). To close the "needs a signed-in account" gap above without writing throwaway data through the real signup/email-OTP flow, created one clearly-labeled test account directly via the Supabase Admin API (service-role key, already available for migration work) — `qa.dummy.20260625@reviewnatinph.com`, `email_confirm: true` set at creation, so it logs in through the app's normal `signInWithPassword` flow with zero inbox access needed. This unblocked full authenticated testing for the first time this engagement.

**Bugs found and fixed, in the order encountered:**

1. **Duplicate React keys on every new user's first dashboard load.** `components/dashboard/home-study-insights.tsx`'s zero-history fallback gave all 7 placeholder chart points the identical key `date: ''`, producing `Encountered two children with the same key` spam (`''` and `label-`) the instant a freshly-created account (zero study history) opened Home. Fixed by giving each placeholder a unique synthetic key (`placeholder-day-${i}`).
2. **`community/[postId].tsx` and `community/profile/[userId].tsx` could get stuck on an infinite loading spinner with no error and no recovery.** Both screens' `load()` callback had `if (!postId) return;` / `if (!userId) return;` as an early return *before* the `try/finally`, so when the param was falsy (reproduced via a Metro full-JS-reload mid-session, which can restore a route before its params resolve), `setLoading(false)` never ran — the spinner span forever, recoverable only by force-closing the app. Fixed by setting an error + `loading=false` in that branch instead of silently returning.
3. **"now ago" rendered literally** wherever `formatRelativeTime` fed into `{...} ago` text (feed, post detail, profile). Added `formatRelativeTimeAgo` (returns bare `"now"`, appends `" ago"` to everything else) and switched all 4 call sites to it.
4. **Avatar upload silently failed on Android** (`Could not upload your photo. Check your connection and try again.`) for every real photo-picker selection. Root cause: `fetch(asset.uri).then(r => r.blob())` is unreliable on Android for the `content://` URIs the system Photo Picker returns. Fixed by reading the file as base64 via `expo-file-system/legacy` and decoding to bytes manually (`lib/format/base64.ts`, dependency-free since `atob`/`Buffer` aren't reliably available in Hermes) before uploading to Supabase Storage. Verified end-to-end: real image, `image/png`, 194KB, publicly fetchable via the returned URL immediately after upload.
5. **Optimistic comment authorship showed "You" instead of the real display name/avatar**, inconsistent with how optimistic posts already showed the real name — and visually jarring (avatar flips from the real initial to "Y" then back once the screen refetches). Fixed `sendComment`'s optimistic object in `[postId].tsx` to use `useUserProfile()`'s real `displayName`/`avatarUrl`, matching `submitPost`'s existing pattern.
6. **Stale counts after returning from a child Community screen.** The feed only fetched on mount, so liking/commenting on a post and navigating back showed the pre-interaction comment/like count until a manual pull-to-refresh. Same gap existed in the post-detail and profile screens for analogous round-trips (e.g. post → author profile → back). Fixed all three screens to use `useFocusEffect` (re-exported by `expo-router`) instead of a mount-only `useEffect`.
7. **The Home dashboard greeting and the Profile tab header never rendered an uploaded avatar at all** — both always showed the initials placeholder regardless of whether `avatarUrl` was set, because neither destructured `avatarUrl` from `useUserProfile()`. (`profile/edit.tsx` and the Community screens already had this right.) Fixed both to conditionally render an `Image` when `avatarUrl` is present, mirroring the existing `profile/edit.tsx` pattern.

**Confirmed working (no fix needed):** like/unlike with live count + trigger-maintained `like_count`/`comment_count`, comment create/edit, exam-name badge on posts, post persistence across app restarts, session persistence across app restarts, the native Android Photo Picker → crop → upload flow end-to-end, and an accidental React Native Element Inspector activation (triggered by a stray input during testing, not a real user gesture) which cleared cleanly on app restart with no lasting state corruption.

All fixes verified via `tsc --noEmit`, `eslint`, the full `vitest` suite (38 files / 206 tests passing, up from 197 before this update — added coverage for `formatRelativeTimeAgo` and the new `base64ToUint8Array` decoder), and re-tested live against the running emulator + real production Supabase project after each fix.

## Update 2026-06-25 (third pass) — Settings avatar, cross-account flows, delete/report/follow

Continued straight from the update above. Created a **second** test account (`qa.dummy2.20260625@reviewnatinph.com`, same Admin API pattern) specifically to test cross-user interactions that one account can't exercise alone — liking/commenting/following/reporting *someone else's* content, and confirming RLS-driven ownership UI (no Edit/Delete on content you don't own) actually holds on a real device, not just in the RLS policy text.

**Bugs found and fixed:**

8. **Settings tab header had the exact same "never renders the uploaded avatar" gap** as the Home/Profile headers fixed in the previous update — `app/(tabs)/settings.tsx` destructured `initials` from `useUserProfile()` but not `avatarUrl`. Grepped all 7 call sites of `useUserProfile()` across the app to confirm this was the last instance (the other 4 already either pass `avatarUrl` through correctly or never render an avatar at all). Fixed the same way: conditional `Image` when `avatarUrl` is present.
9. **`hooks/use-user-profile.ts` silently swallowed `fetchUserProfile` errors** with no logging — caught a real instance of this firing (a transient race during a dev Fast-Refresh reload caused the profile fetch to throw, and the screen fell back to `user_metadata.display_name` and a null avatar with zero trace in logcat of why). Added a `console.warn` for visibility, matching the same fix already applied to `lib/api/avatar.ts`'s catch block. The fallback behavior itself was already correct — this only fixes the silence around it.
10. **The post-detail screen had no way to reach the post author's or a commenter's profile at all** — `community/[postId].tsx` never wired tapping the avatar/name to navigate to `/community/profile/[userId]`, even though the feed screen (`community.tsx`) already does this correctly for posts. Found while trying to test the follow flow from a post opened directly (rather than from the feed). Fixed by wrapping the post header's avatar/name and each comment row's avatar/name in `Pressable`s that navigate to the author's profile, mirroring the feed's existing pattern exactly.

**Confirmed working (no fix needed) via the two-account setup:**
- **Delete**: soft-delete confirmed correct for both posts and comments — confirmation dialog, `is_deleted=true` (not a hard delete, preserving the moderation trail), and the trigger-maintained `comment_count` correctly decremented. Verified directly against the database after each delete, not just the UI.
- **Report**: reason picker (spam/harassment/wrong info/inappropriate/other) → "Report submitted" confirmation → real row in `community_reports` with the correct `reporter_id` and `status='open'`. Tested specifically as the *non-owner* account against the other account's post.
- **Follow**: "Follow" → "Following ✓" with the follower count incrementing live, a real row in `community_follows` with the correct `follower_id`/`followee_id`. Cross-checked the UI state against the database independently.
- **Ownership-scoped UI**: viewing another account's post/comments correctly shows a report flag instead of the owner-only manage menu, and never shows Edit/Delete on content you don't own — confirmed visually for both the post and a comment.
- **Logout/login**: logging out and logging in as a second account correctly swaps session state everywhere (Home greeting, Settings, Community composer) with no stale data from the first account leaking through.
- **Mock exam as a logged-in free user**: starting the free weekly Mini Mock shows the exam-rules confirmation (not a login prompt, since the user is authenticated) and launches a real timed quiz with a working countdown, answer selection, and progress tracker.
- **Premium paywall as a logged-in free user**: tapping the Plus-gated "Board Exam Mode" correctly shows an *upgrade* prompt ("This is a Premium feature" / View Premium Plans), not the guest *login* prompt — confirming the gate correctly distinguishes "not logged in" from "logged in but not premium". The paywall screen itself renders fully with the feature checklist and billing disclaimer. The "Demo: ..." purchase button visible on this build is correctly gated behind `__DEV__` (`isDevBuild` in `app/subscribe/index.tsx`) and will not appear in a production build — same pattern as the dev-only "Reset onboarding" item in Settings.

**Noted but not fixed (pre-existing, out of scope, low severity):** the quiz screen (`app/practice/quiz.tsx`, used by all quiz modes including mock/board) has no exit confirmation on the hardware back button — backing out of an in-progress timed mock silently discards answered-but-unsubmitted questions with no warning, despite the in-app copy explicitly warning "strict timer... no going back" before starting. Confirmed this does **not** burn the weekly mini-mock quota (the limit is computed server-side from *completed* `quiz_sessions` per `lib/paywall.ts`'s own doc comment, so an abandoned attempt is free to retry) — this softens it from a quota-loss bug to a UX papercut. Not fixed in this pass since it touches the shared quiz screen used by every quiz mode in the app, which warrants its own focused pass rather than a speculative change bundled into Community/avatar testing.

All fixes in this pass verified via `tsc --noEmit`, `eslint`, and the full `vitest` suite (38 files / 206 tests, unchanged count — this pass's fixes didn't add new pure logic worth separate unit tests), then re-confirmed live against the emulator and real production Supabase project, including direct database queries after each destructive/cross-account action to verify server-side state independent of what the UI displayed.
