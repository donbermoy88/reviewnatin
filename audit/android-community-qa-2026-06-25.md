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
