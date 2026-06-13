# ReviewNatin Mobile App — Live Audit Report
**Date:** May 29, 2026  
**Device:** iPhone 16 Pro Max Simulator (iOS 18.2, UDID 080A5208-6939-4E65-A7EC-BB8C4F987962)  
**Build:** Debug dev build (Expo SDK 56, bundle `ph.reviewnatin.app`)  
**User state:** Guest (unauthenticated) throughout; one 12-question CSE Pro practice quiz completed  
**Auditor:** Claude (live navigation via xcrun simctl + screenshot observation)

---

## 1. Codebase Analysis Summary

| Area | Notes |
|------|-------|
| Router | Expo Router v4 file-based; 4 tabs (Home, Review, Ranks, Profile) |
| Auth | Supabase; Google + Apple SSO + email/password; guest mode supported |
| Quiz engine | Modes: mock, mistake_review, diagnostic, timed, weak_area, barkada, board, offline |
| Language toggle | EN / TL per-question; explanation language in Settings defaults EN |
| Theming | Light mode only (dark mode toggle exists, default OFF, no system-follow) |
| Monetisation | 3-tier: Guest → Free (signed-in) → Premium; paywall at `/subscribe` |
| Image support | `QuestionImage` component handles both raster (PNG/JPEG) and SVG via `react-native-svg` |
| i18n approach | Manual Filipino/English strings — no i18n library; several forgotten Filipino literals remain |

---

## 2. Screen-by-Screen Findings

### 2.1 Splash / Intro Screen
- **Status: ✅ PASS**
- App logo, "ReviewNatin" name, "Review together. Pass together." tagline
- "Start your review" CTA and "I already have an account" — both English
- Clean, no issues

---

### 2.2 Onboarding — Step 1 (Exam Picker)
- **Status: ⚠️ MINOR CONCERN**
- Three exam options visible: CSE Professional (98,000 reviewers), LET (86,000 reviewers), PNLE (142,000 reviewers)
- **Reviewer counts appear hardcoded/static** — no source shown; numbers seem inflated for a new app at v1.0.0
- "Pick your board exam" heading is English ✅

---

### 2.3 Onboarding — Step 3 (Level Picker)
- **Status: 🔴 CRITICAL — Filipino strings**
- Heading: **"Anong level ka ngayon?"** → should be "What's your current level?"
- Option 1: **"Baguhan pa sa exam prep"** → "Just starting exam prep"
- Option 2: **"May konting review na"** → "Have some review done"
- Option 3: **"Retaker o may solid base na"** → "Retaker or have a solid base"
- All 4 strings are Filipino. This is a high-visibility onboarding screen.

---

### 2.4 Onboarding — Step 5 (PasaPath Ready)
- **Status: 🔴 CRITICAL — Filipino strings**
- Heading: **"Handa ka na sa PasaPath"** → "You're ready for PasaPath"
- Body paragraph starts with **"Magsisimula ang araw-araw mong study path…"** — fully in Filipino
- This is the last onboarding screen before entering the app — a critical moment.

---

### 2.5 Onboarding — Steps 2 and 4
- **Status: ✅ PASS**
- Step 2 (Daily goal picker): English ✅
- Step 4 (Save progress prompt): English ✅

---

### 2.6 Dashboard (Home Tab — Guest)
- **Status: ✅ PASS**
- Streak label: "start today" (0-streak guest) ✅
- Motivational copy: "let's go! 💪" (guest variant) ✅
- "no fake progress here" integrity note ✅
- PasaPath day card visible with study subjects
- CSE Professional card shows "500 questions" with subject icon
- No Filipino strings observed ✅

---

### 2.7 Practice Quiz
- **Status: ✅ PASS (minor spacing note)**
- Answer choices highlight green (correct) / red (wrong) after selection ✅
- EN/TL toggle per-question visible ✅
- "Next question →" button visible ✅
- "View results →" button correctly appears on final (Q12) question ✅
- **Minor:** Large blank whitespace below the choices area (wasted vertical space ~60px gap)

---

### 2.8 Result Screen (post 12-question quiz)
- **Status: ✅ PASS**
- Score ring shows **RED** for 33% score ✅ (dynamic color confirmed)
- Score percentage displays as "33%" ✅
- Upsell modal shown to guest users ("Save your score — Log in") ✅
- "Review mistakes" button **absent** for guest users (expected — no sessionId saved to DB) ✅
- "View results →" navigated correctly from Q12 to result screen ✅

---

### 2.9 Mock Exam Confirmation Dialog
- **Status: ✅ PASS**
- Review Tab → Mock Exam section → tap any mock
- `Alert.alert('Board Exam Mode', ...)` appears before starting ✅
- Dialog includes time limit and rules ✅

---

### 2.10 Review Tab — Subjects
- **Status: ✅ PASS**
- Lists subjects with cycling emoji icons (📚🎓🔬🧮📝)
- CSE Professional shows "500 questions"
- Tapping CSE Professional navigates to Study Subject screen (see §2.20)

---

### 2.11 Review Tab — Notes
- **Status: ✅ PASS**
- Filter chips: All / Lessons / Cheat sheets
- Content loads correctly ✅

---

### 2.12 Ranks / Leaderboard Tab
- **Status: ✅ PASS**
- Shows dev user "Lyndon Ber…" at 28 XP
- "Barkada Challenge" button visible
- No Filipino strings ✅

---

### 2.13 Profile Tab (Guest)
- **Status: ✅ PASS**
- "GU" amber avatar, "Guest reviewer", "Log in to save your progress"
- Stats: 1 DAY STREAK | 12 ANSWERED | 33% ACCURACY (from our quiz session)
- "View analytics" button (outlined) — navigates to Analytics screen
- "Quiz history (on this device)" with "Practice · 12 items | May 29, 2026 | 33%"
- Local session persistence working correctly ✅

---

### 2.14 Mistakes Screen (Guest)
- **Status: ✅ PASS — expected gate**
- Bookmark icon + "Log in to continue" + "You need an account to save your Mistake Bank."
- "Log in" primary CTA ✅
- Consistent with other gated screens ✅

---

### 2.15 Flashcards Screen
- **Status: ⚠️ NO CONTENT**
- Empty state: "No flashcards yet" / "Flashcard decks will appear as we import content for your exam."
- "Go back" button
- Feature UI is built but no data exists — users will see this empty state immediately

---

### 2.16 Exam Calendar Screen
- **Status: ⚠️ MINOR ISSUES**
- Header subtitle: **"Official-style dates for cse professional"** — `cse professional` should be `CSE Professional` (capitalization)
- 1 event shown: "Examination" | **79D** countdown | Sun, Aug 16, 2026 | "Second CSE window (typical Aug slot — verify)"
- The note "typical Aug slot — verify" makes the date appear approximate/hardcoded, not sourced from an official API
- Gear icon (⚙️) appears in top-right — see §3.5 for the persistent gear icon issue
- Disclaimer: "ReviewNatin is not affiliated with CSC, PRC, or any government agency" ✅

---

### 2.17 Bookmarks Screen (Guest)
- **Status: ✅ PASS — expected gate**
- "Log in to continue" + "You need an account to save bookmarks." + "Log in" CTA ✅

---

### 2.18 Analytics Screen (Guest)
- **Status: ✅ PASS — expected gate**
- "Log in to continue" + "Analytics and weak-topic tracking require a signed-in account." + "Log in" CTA ✅

---

### 2.19 Subscribe / Paywall Screen
- **Status: ✅ PASS (production label note)**
- Header: "ReviewNatin Plus" + feature pills: Unlimited · PasaPath · Offline · No ads
- **Dev banner shown:** "Dev build — purchases are simulated. On TestFlight/App Store, real StoreKit billing applies." ✅ (correct warning)

**Plans visible:**

| Plan | Price | CTA |
|------|-------|-----|
| Plus Yearly (BEST VALUE) | ₱999/year | "Activate (demo)" (filled/primary) |
| Plus Monthly | ₱149/month | "Activate (demo)" (filled/primary) |
| CSE Professional (EXAM PASS) | ₱499 one-time | "Activate (demo)" (outlined/secondary) |

- "Restore purchases" button ✅
- Legal footer: auto-renew notice + "ReviewNatin is not affiliated with CSC, PRC, or any government agency. No pass guarantee." ✅
- **Minor:** "Activate (demo)" should be "Subscribe" / "Get Plus" in production
- **Minor:** No explicit savings callout for Yearly vs Monthly (₱999/yr ≈ ₱83/mo vs ₱149/mo — 44% cheaper)
- **Minor:** No X/close button on paywall — only back arrow `<`

---

### 2.20 Study Subject Screen (CSE Professional Topics)
- **Status: 🔴 BROKEN — No Data**
- Header: **"Cse Professional"** — capitalization bug (should be "CSE Professional")
- Subtext: "0 topics · tap to practice" — **misleading; "tap to practice" implies tappable topics, but 0 exist**
- Flashcards card: "Due cards for **Cse Professional**" — another capitalization instance
- Empty state: "No topics yet / Topics will appear as we add more content."
- **This is a dead end for users navigating from the Review tab subjects list**

---

### 2.21 Settings Screen
- **Status: ✅ PASS (with minor concerns)**

**PREFERENCES:**
- Notifications toggle — ON ✅
- Exam date reminders toggle — ON ✅
- Explanation language — EN/TL segmented control (EN default) ✅
- Dark mode toggle — OFF (no system-follow detection)

**STUDY:**
- Switch exam track — "Change CSE / LET / PNLE goal — may prompt new diagnostic" ✅
- Bookmarks ✅
- Content updates ✅
- Offline pack — "Premium · save content for offline review"
- Practice offline — "Download pack first"

**ACCOUNT:**
- Log in ✅
- **Reset onboarding** — labeled "Developer" — **developer-only option visible to all users in production builds**

**LEGAL:**
- Disclaimers & policies, Privacy Policy (external), Terms of Service (external) ✅

**SUPPORT:**
- Open website, About: "Version 1.0.0 · Connected" ✅

**Footer:** "Made with ❤️ for Filipino learners" ✅

---

### 2.22 Barkada Screen (Guest)
- **Status: ✅ PASS — expected gate**
- "Log in to continue" + "Barkada mode lets you review with friends and compare scores." + "Log in" CTA ✅

---

### 2.23 Content Updates / Changelog Screen
- **Status: ⚠️ MINOR ISSUES**
- Header subtitle: **"New questions, lessons, and fixes for Cse Professional"** — capitalization bug
- Only **2 entries** (both dated May 24, 2026):
  - "Wave 4: Exam calendar" — "Official-style exam dates + in-app reminders. Always verify on CSC/PRC sites."
  - "Achievement badges" — "Earn badges for streaks, mocks, and Barkada milestones on your Profile tab."
- **Achievement badges are mentioned in the changelog but no badge-viewing screen is accessible**

---

### 2.24 PasaPath Week Screen (Guest)
- **Status: ⚠️ UX INCONSISTENCY**
- Header: "PasaPath week" + subtitle: "Log in to see your weekly progress."
- Guest prompt: **"Log in →"** (inline link text)
- **All other gated screens use a full-page block with a centered icon + heading + "Log in" primary button. PasaPath uses just a text link — inconsistent.**

---

### 2.25 Login Screen
- **Status: 🔴 CRITICAL — 3 Filipino Strings**
- Header: "ReviewNatin" + "Review together. Pass together." ✅
- "Log in" / "Save your progress to the cloud." ✅
- "Continue with Google" ✅ / "Sign in with Apple" ✅ / "Continue as guest" ✅
- Separator: **"o gamit ang email"** → should be "or use email" / "or with email"
- Email placeholder: **"hal. reviewer@email.com"** → "hal." is Filipino abbreviation for "halimbawa" (e.g.) → should be "e.g. reviewer@email.com"
- Forgot password link: **"Nakalimutan ang password?"** → should be "Forgot your password?"
- "Log in" button ✅, "No account? Sign up" ✅

---

### 2.26 Forgot Password Screen
- **Status: 🔴 CRITICAL — Filipino Placeholder**
- Header: "Forgot your password?" ✅ / "We'll send a reset link to your email." ✅
- Email placeholder: **"hal. reviewer@email.com"** → same Filipino placeholder bug as Login
- "Send reset link" button ✅ / "← Back to login" ✅

---

### 2.27 Legal & Disclaimers Screen
- **Status: 🔴 CRITICAL — Filipino in Legal Text**
- Header: "Legal & disclaimers" ✅
- Subtitle: **"Independent reviewer — hindi government agency"** → "hindi" is Filipino for "not" → should be "Independent reviewer — not a government agency"
- Body disclaimer text: English ✅
- Official exam site links: CSC, PRC / LERIS ✅
- Policy links: Privacy Policy, Terms of Service, reviewnatinph.com ✅

---

### 2.28 Offline Lessons Screen
- **Status: ✅ PASS — expected empty state**
- "Offline lessons" + "From your downloaded pack — no internet needed"
- "No offline lessons" + "Download the offline pack in Settings to view lessons here." + "Go to Settings" CTA ✅

---

### 2.29 Removed Chat Screen (Guest)
- **Status: Removed**
- The former token-backed chat surface is no longer part of the product.

---

### 2.30 Diagnostic Intro Screen
- **Status: ⚠️ NOTE — Auth redirect**
- Navigating to `/diagnostic/intro` redirects to the Login screen rather than showing an inline guest gate
- Inconsistent with Mistakes/Bookmarks/Analytics which show in-page guest gates

---

### 2.31 Sign-Up Flow
- **Status: ⚠️ NOT FOUND AS IN-APP SCREEN**
- Login screen shows "No account? Sign up" link
- `/signup` deep-link returns "Unmatched Route" error page — there is no dedicated in-app sign-up screen
- Sign-up presumably handled via web view or OAuth flow only

---

## 3. Cross-Cutting Findings

### 3.1 Filipino Language Strings Inventory

| Screen | String | Should Be |
|--------|--------|-----------|
| Onboarding Step 3 | "Anong level ka ngayon?" | "What's your current level?" |
| Onboarding Step 3 | "Baguhan pa sa exam prep" | "Just starting exam prep" |
| Onboarding Step 3 | "May konting review na" | "Have some review done" |
| Onboarding Step 3 | "Retaker o may solid base na" | "Retaker or have a solid base" |
| Onboarding Step 5 | "Handa ka na sa PasaPath" | "You're ready for PasaPath" |
| Onboarding Step 5 | "Magsisimula ang araw-araw mong study path…" | English translation needed |
| Login | "o gamit ang email" | "or use email" |
| Login | "hal. reviewer@email.com" | "e.g. reviewer@email.com" |
| Login | "Nakalimutan ang password?" | "Forgot your password?" |
| Forgot Password | "hal. reviewer@email.com" | "e.g. reviewer@email.com" |
| Legal | "hindi government agency" | "not a government agency" |

**Total: 11 Filipino strings found across 5 screens**

---

### 3.2 CSE Name Capitalization Bug

"CSE Professional" is consistently rendered incorrectly across multiple screens:

| Screen | Displayed | Should Be |
|--------|-----------|-----------|
| Exam Calendar subtitle | "cse professional" | "CSE Professional" |
| Content Updates subtitle | "Cse Professional" | "CSE Professional" |
| Study Subject header | "Cse Professional" | "CSE Professional" |
| Flashcards card subtitle | "Cse Professional" | "CSE Professional" |

This is likely a `.toLowerCase()` or `.toTitleCase()` call being applied to the exam name string pulled from DB/config, transforming "CSE" incorrectly.

---

### 3.3 Guest Gate Inconsistency

| Screen | Gate Style |
|--------|-----------|
| Mistakes | Full-page: icon + title + description + primary button |
| Bookmarks | Full-page: icon + title + description + primary button |
| Analytics | Full-page: icon + title + description + primary button |
| Barkada | Full-page: icon + title + description + primary button |
| Removed chat | No active screen |
| **PasaPath Week** | **Inline text link: "Log in →"** |
| Diagnostic | **Full redirect to Login screen** |

Recommendation: Standardize all gated screens to use the full-page EmptyState gate component.

---

### 3.4 Content Gaps

| Feature | Status |
|---------|--------|
| Flashcard decks | ❌ No data — "No flashcards yet" |
| Topic list (Study Subject) | ❌ 0 topics for CSE Professional |
| Achievement badges | ❌ Mentioned in changelog, no UI |
| Offline pack | ❌ Nothing downloaded |
| Sign Up screen | ❌ Not implemented in-app |
| Changelog entries | ⚠️ Only 2 entries (both May 24, 2026) |
| Exam Calendar events | ⚠️ Only 1 event (approximate date) |

---

### 3.5 Persistent Gear Icon (⚙️)

A settings gear icon appears in the top-right corner of nearly every screen in the app, including screens where it creates visual confusion:
- Paywall screen
- Changelog screen
- Legal screen  
- Flashcards screen
- PasaPath Week screen
- Settings screen itself

The icon navigates to Settings. While the functionality is useful, the placement is inconsistent with iOS conventions (settings is usually accessed via the Profile tab). On the Settings screen itself, it creates a circular/redundant entry point. Recommend removing from content screens and paywall, or replacing with a universal nav bar.

---

### 3.6 Developer Debug Items in Production Build

| Item | Location | Risk |
|------|----------|------|
| "Reset onboarding" (Developer label) | Settings > Account | Users see hidden dev tools |
| "Dev build — purchases are simulated" banner | Paywall | Must be absent in production |
| "Activate (demo)" button labels | Paywall | Must read "Subscribe" in production |
| Gear icon (Expo dev tools) | Top-right corner (dev mode) | Will not appear in production |

---

## 4. Issue Priority Summary

### 🔴 CRITICAL (Must fix before ship)

| # | Issue | Screen(s) |
|---|-------|-----------|
| C1 | 11 Filipino strings in English-language app | Onboarding 3&5, Login, Forgot PW, Legal |
| C2 | Legal disclaimer subtitle in Filipino ("hindi government agency") | Legal screen |
| C3 | Login gate Filipino strings visible to all first-time users | Login |

### 🟠 HIGH (Fix before public launch)

| # | Issue | Screen(s) |
|---|-------|-----------|
| H1 | "Cse Professional" / "cse professional" capitalization across 4+ screens | Exam Cal, Changelog, Study Subject, Flashcards |
| H2 | No in-app Sign Up screen — "Sign up" link leads to unmatched route | Login |
| H3 | Developer option "Reset onboarding" visible to all users | Settings |
| H4 | Inconsistent guest gate — PasaPath uses inline link vs full-page on all others | PasaPath Week |

### 🟡 MAJOR (Should fix before launch)

| # | Issue | Screen(s) |
|---|-------|-----------|
| M1 | No flashcard content — feature is empty for all users | Flashcards |
| M2 | 0 topics in Study Subject — dead end from Review tab | Study Subject |
| M3 | "0 topics · tap to practice" is misleading when 0 topics exist | Study Subject |
| M4 | Achievement badges mentioned in changelog but no screen exists | Changelog |
| M5 | Onboarding reviewer counts (98k/86k/142k) appear hardcoded | Onboarding Step 1 |
| M6 | Exam Calendar date is approximate ("typical Aug slot — verify") | Exam Calendar |
| M7 | Only 2 changelog entries — very sparse for v1.0.0 | Changelog |

### 🔵 MINOR (Polish before launch)

| # | Issue | Screen(s) |
|---|-------|-----------|
| P1 | Large empty whitespace below quiz answer choices | Practice Quiz |
| P2 | Persistent gear icon (⚙️) on most screens — remove from non-profile screens | Many |
| P3 | "Activate (demo)" → should be "Subscribe" in production | Paywall |
| P4 | No savings callout on Yearly vs Monthly ("Save 44%") | Paywall |
| P5 | Both Plus Yearly and Plus Monthly use identical filled primary CTA — reduces Yearly prominence | Paywall |
| P6 | Dark mode doesn't follow system preference — manual toggle only | Settings |
| P7 | Diagnostic intro redirects to Login rather than in-page gate | Diagnostic |

---

## 5. Missing Features (Not Yet Implemented)

| Feature | Notes |
|---------|-------|
| Sign Up screen | No dedicated signup flow in-app; only via SSO |
| Flashcard content | Data not loaded; UI exists |
| Study topics | 0 topics in DB for CSE Professional |
| Achievement badges | UI/screen not found despite being in changelog |
| Offline pack download | Settings link exists, no downloadable content |
| Push notification test | Cannot test on simulator |
| Profile edit | `profile/edit.tsx` exists but no entry point in guest UI |
| Streak history visualization | Current streak shown but no history graph |
| Social sharing of quiz results | No share button on result screen |

---

## 6. Environment Notes

| Item | Value |
|------|-------|
| Build type | Debug dev client (Expo development build) |
| Expo dev tools gear | Visible at top-right in dev; not in production |
| Dev purchases | Simulated (StoreKit sandbox) |
| App version | 1.0.0 |
| Connection status | Connected (Supabase backend reachable) |
| Simulator | iPhone 16 Pro Max, iOS 18.2 |
| Test date | May 29, 2026 (2:34 AM – 2:55 AM PHT) |

---

## 7. Screens Audited Checklist

| Screen | Route | Status |
|--------|-------|--------|
| Splash / Intro | `/` | ✅ |
| Onboarding | `/onboarding` | ⚠️ Steps 3+5 Filipino |
| Dashboard (Home tab) | `/(tabs)` | ✅ |
| Practice Quiz | `/practice/quiz` | ✅ |
| Result Screen | `/practice/result` | ✅ |
| Mock Exam (confirmation) | Study tab → Mock | ✅ |
| Review Tab Subjects | `/(tabs)/study` | ✅ |
| Study Subject / Topics | `/study/[subjectSlug]` | 🔴 0 topics |
| Review Tab Notes | `/(tabs)/study` Notes tab | ✅ |
| Ranks / Leaderboard | `/(tabs)/leaderboard` | ✅ |
| Profile Tab | `/(tabs)/progress` | ✅ |
| Mistakes | `/mistakes` | ✅ (gate) |
| Flashcards | `/flashcards` | ⚠️ No content |
| Exam Calendar | `/exam-calendar` | ⚠️ |
| Bookmarks | `/bookmarks` | ✅ (gate) |
| Analytics | `/analytics` | ✅ (gate) |
| Subscribe / Paywall | `/subscribe` | ✅ |
| Settings | `/settings` | ✅ |
| Barkada | `/barkada` | ✅ (gate) |
| Content Updates | `/changelog` | ⚠️ |
| PasaPath Week | `/pasapath/week` | ⚠️ (inconsistent gate) |
| Login | `/(auth)/login` | 🔴 Filipino strings |
| Forgot Password | `/(auth)/forgot-password` | 🔴 Filipino placeholder |
| Sign Up | N/A | ❌ Not found |
| Legal & Disclaimers | `/legal` | 🔴 Filipino subtitle |
| Offline Lessons | `/offline-lessons` | ✅ (empty) |
| Removed chat | `/tutor` | Removed |
| Diagnostic Intro | `/diagnostic/intro` | ⚠️ Login redirect |

---

*Phase 1 complete. 27 screens examined (guest state). 3 critical, 4 high, 7 major, 7 minor issues found.*

---

---

# PHASE 2 — Authenticated Audit

**Date:** May 29, 2026 (continued session)  
**User:** Lyndon Bermoy (`serbermz2020@gmail.com`) — Free tier (signed in via Google)  
**Tier:** FREE (not Premium)  
**Additional screens examined:** 12 (authenticated states + screens not accessible as guest)

---

## 8. Corrections to Phase 1 Findings

The following Phase 1 findings were incorrect and are corrected here:

| Phase 1 Finding | Correction |
|----------------|------------|
| M4: "Achievement badges mentioned in changelog but no screen exists" | **WRONG — badges DO exist.** Profile tab shows: First steps 🎯, Mock taker ✏️, Barkada 👥. The §2.23 note "no badge-viewing screen" is incorrect. |
| Missing features: "Profile edit — no entry point in guest UI" | **EXPECTED** — profile editing is only available when signed in; entry is Settings → Edit profile ✅ |
| Missing features: "Social sharing of quiz results — no share button" | **WRONG — share button exists.** Result screen has "Share score" (outline button). Guest users see an upsell modal; authenticated users see the full share flow. |
| §3.5 / §3.6: "Gear icon (Expo dev tools)" | **PARTIALLY WRONG** — The ⚙️ gear icon appearing on most screens is an **in-app Settings shortcut** (navigates to `/settings`), not the Expo dev tools indicator. It is intentional product design, not a dev artifact. However the placement is still questionable UX (see H3 note below). |

---

## 9. Authenticated Screen Findings

### 9.1 Dashboard — Home Tab (Authenticated)

- **Status: ✅ PASS with issues**

**Language strings (all English ✅):**
- Stats row: "day streak", "questions today", "**ready**" — all English ✅
- Goal card: "15 to go — **keep going!** 💪" — English ✅
- Continue card empty state (code-confirmed): "Start your first quiz — **no fake progress here.**" — English ✅

**Working personalized features:**
- "Good morning, Hey, Lyndon! 👋" greeting ✅
- 2-day streak, 0 questions today, 29% ready ✅
- TODAY'S PASAPATH: 64 days left, 30 min planned, "Weak area: Environment Management" tag ✅
- Personalized tasks: Practice Environment Management · 18 min, Review Mistake Bank 7 min, Flashcard review 4 min ✅
- TODAY'S GOAL: 0/15 questions, 29% overall accuracy (88 answered) ✅
- EXAM COUNTDOWN: 64 days until exam day · CSE Professional · Aug 1, 2026 ✅
- CONTINUE REVIEWING: CSE Professional · 8 quizzes completed ✅
- Quick practice subjects: Verbal Ability, Analytical Ability, Numerical Ability ✅

**Issues found:**

🔴 **LANGUAGE BUG — "29% ready" modal footnote in Filipino** (`readiness-breakdown-sheet.tsx` line 67):
- Tapping the "29% ready" stat opens a breakdown modal
- Title, labels, stats are all English ✅
- **Footnote text is Filipino:** "Batay sa diagnostic, mocks, topic coverage, at mistake bank mastery. Mag-practice araw-araw para tumaas ang score."
- Translation: "Based on diagnostic, mocks, topic coverage, and mistake bank mastery. Practice every day for your score to improve."
- Should be: "Calculated from diagnostic score, mock average, topic coverage, mistake mastery, and recent practice accuracy."

⚠️ **Content loading status "3/2 mocks" is confusing:**
- "Content loading — 20/300 Q · 3/2 mocks" appears in the quick-practice area
- "3/2 mocks" looks like a fraction where completed (3) exceeds total (2) — confusing or wrong format
- Should clarify meaning (e.g., "2 mocks available" or "3 mock sessions done")

---

### 9.2 Settings (Authenticated)

- **Status: ✅ PASS with minor notes**

**New vs guest:**
- User card now shows: LY avatar, "Lyndon Bermoy", "serbermz2020@gmail.com", **FREE** badge ✅
- "Upgrade to Premium" banner (blue, full-width) ✅
- ACCOUNT section now shows: Edit profile, Change password, Restore purchases, **Log out**, **Delete account** (instead of guest "Log in") ✅

**Findings:**
- Explanation language preference persisted across sessions: shows TL selected ("Taglish / Filipino default") — user had previously changed from EN to TL ✅ (correct behavior)
- "Restore purchases" subtitle: "Sync App Store / Play subscriptions" — mentions both stores; acceptable for cross-platform codebase
- "Reset onboarding" (labeled "Developer") remains visible to authenticated free users — same issue as guest (§3.6)
- Log out: red text, no destructive confirmation dialog before logging out — **minor UX gap** (user could tap accidentally)
- Delete account: red text, "Permanently remove your data" — should have a confirmation step (not observed; may exist on tap)

---

### 9.3 Edit Profile Screen (`/profile/edit`)

- **Status: ✅ PASS (feature-complete for MVP)**

Accessible via Settings → Edit profile.

- User card: LY initials avatar (yellow/orange), "Lyndon Bermoy", "serbermz2020@gmail.com" ✅
- DISPLAY NAME field: editable text input pre-filled with "Lyndon Bermoy" ✅
- Helper text: "Visible on your Profile, Home screen, and Leaderboard." ✅
- "Save changes" primary button ✅

**Missing / future work:**
- No avatar photo upload — initials-only avatar ✅ (intentional MVP limitation)
- Email field is not shown (read-only for Google SSO users — correct)
- No password change here (uses "Change password" in Settings which sends an email reset link)

---

### 9.4 Profile Tab (Authenticated)

- **Status: ✅ PASS with score-coloring bug**

**Achievement badges (correcting Phase 1 M4):**
- **First steps 🎯** ✅
- **Mock taker ✏️** ✅
- **Barkada 👥** ✅
- Badges are rendered within the Profile tab — no separate badge screen needed

**Mock exam history:**
- "CSE Professional — Mini Mock | May 24, 2026 | Needs review (target ≥75%) | **25%** (orange)" ✅
- Dynamic color on mock history score works correctly (orange for low score)

🔴 **BUG — Quiz history scores are all the same blue regardless of score:**

| Quiz | Score | Color Shown | Expected Color |
|------|-------|-------------|----------------|
| Practice · 12 items (May 28) | 58.33% | 🔵 Blue | 🟡 Orange (50–74%) |
| Practice · 4 items (May 27) | 50% | 🔵 Blue | 🟡 Orange |
| Practice · 12 items (May 27) | **0%** | 🔵 Blue | 🔴 **Red** |
| Mock Exam · 5 items (May 27) | **25%** | 🔵 Blue | 🔴 **Red** |
| Practice · 5 items (May 27) | 60% | 🔵 Blue | 🟡 Orange |

- Mock exam history correctly uses dynamic colors (orange for 25%)
- **Quiz history scores are hardcoded blue** — the same dynamic coloring logic from the result screen is not applied to the history list items
- A 0% score showing in the same blue as 60% is misleading

---

### 9.5 Mock Review Screen (`/mock-review/[sessionId]`)

- **Status: ✅ PASS with header clip bug**

Accessed by tapping mock history entry on Profile tab.

- Shows "CSE Professional — Mini Mock" with score displayed in header ✅

⚠️ **Score clips in header:** The score "25%" in the header overflows/clips on the right edge of the screen. The title "CSE Professional — Mini Mock 25%" is too long for the header; the percentage is partially cut off.

**Question list (4 questions, 1 correct / 3 wrong = 25%):**
- Q1 WRONG: "Which branch of government enacts laws in the Philippines?" — red pill, red card border ✅
- Q2 WRONG: "Choose the sentence with correct subject-verb agreement." — red pill ✅
- Q3 CORRECT: "What is the synonym of 'abundant'?" — green pill ✅
- Q4 WRONG: "The Philippines gained independence from the United States in what year?" — red pill ✅

**Inline answer review (tapping "Tap to review answers"):**
- Expands inline within the list ✅
- Correct answer highlighted green (B: Legislative — green fill + green border) ✅
- User's wrong selection highlighted red (C: Judicial — red fill + red border) ✅
- Unused options shown neutral ✅
- Explanation text accurate and factual ✅
- Clean, informative design

---

### 9.6 Study Tab — Authenticated Subjects View

- **Status: ✅ PASS (data showing)**

CSE Professional subject detail:
- Mastery data loads for authenticated users:
  - Verbal Ability: **32% mastery · 51 attempts** (red/low progress bar) ✅
  - Analytical Ability: **26% mastery · 12 attempts** (red/low progress bar) ✅
  - Numerical Ability: **53% mastery · 11 attempts** (orange/medium progress bar) ✅
- "More questions coming soon" banner: "20 questions available now · 7% of target bank" ✅
- "⚡ Start practice quiz" primary button ✅

---

### 9.7 Study Tab — Mock Exam (Authenticated)

- **Status: ✅ PASS — all dialogs working**

**Mock list:**
| Mock | Details | Free Tier |
|------|---------|-----------|
| Board Exam Mode | 30 items · 45 min · No hints · Section breaks | Premium only |
| CSE Professional — Mini Mock | 5 items · 10 min | 1/week free |
| CSE Professional — Practice Mock | 20 items · 40 min | Preview 10 items |
| CSE Professional — Full Length Mock | 170 items · 180 min | Preview 10 items |

**Confirmation dialogs verified:**

✅ **Weekly limit dialog** (Mini Mock, already used this week):
- "Weekly limit" | "1 mini-mock per week on the free tier. Upgrade for unlimited mocks."
- Buttons: "Not now" | "View plans" ✅

✅ **Preview mode dialog** (Practice/Full Length mock for free users):
- "Preview mode" | "Free tier: first 10 items only. Upgrade for the full 20-item mock."
- Buttons: "Cancel" | "Start preview" | "Upgrade" ✅

✅ **Full mock confirmation dialog** (code-confirmed at `study.tsx` line 168, not testable as weekly limit was hit):
- "Board Exam Mode" | "{title} · {items} items · {duration} min\n\nStrict timer, no hints, and no going back to previous questions. Make sure you're ready before starting."
- Buttons: "Not now" | "Start exam" ✅

---

### 9.8 Removed Chat Route (`/tutor`) — Authenticated (Free)

- **Status: Removed**

- The former token-backed chat surface is no longer part of the product. Legacy route should redirect to Plus instead of rendering a chat UI.

---

### 9.9 Analytics Screen (Authenticated)

- **Status: ✅ PASS**

- Full per-topic accuracy breakdown visible ✅
- "Quick 10 · weak areas" sticky bottom CTA ✅
- Data matches profile stats (29% overall) ✅

---

### 9.10 Mistake Bank (Authenticated)

- **Status: ✅ PASS with duplicate bug**

- 45 mistake items loaded ✅
- ⚠️ **4 consecutive identical question stems observed in the list** — suggests deduplication is not applied when the same question is answered wrong multiple times; users would see the same question 4 times in a row in their mistake bank

---

### 9.11 Barkada Screen (Authenticated)

- **Status: ✅ PASS**
- Barkada invite code generated (BARK-331B…) ✅
- "Start new challenge" button present (requires at least one friend added) ✅
- Friends list shows empty state with invite instructions ✅

---

### 9.12 PasaPath Week (Authenticated)

- **Status: ✅ PASS**
- 7-day view loads with personalized daily tasks ✅
- Incomplete tasks show dash icon ✅
- Week view navigation works ✅

---

## 10. New Issues Found in Phase 2

### 🔴 CRITICAL

| # | Issue | Location | Source |
|---|-------|----------|--------|
| C4 | "29% ready" breakdown modal has Filipino footnote ("Batay sa diagnostic…") | Home tab → tap ready stat | `readiness-breakdown-sheet.tsx` line 67 |

### 🟠 HIGH

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| H5 | Quiz history score colors are all blue — 0% shows same blue as 60% | Profile tab → Quiz history | Mock exam history correctly dynamic; quiz history is not |
| H6 | Score text clips in Mock Review header ("CSE Professional — Mini Mock 25%") | Mock Review screen | Score % overflows header right edge |

### 🟡 MAJOR

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| M8 | Mistake Bank shows 4+ duplicate identical question stems consecutively | Mistakes screen | Same question answered wrong multiple times, no deduplication |
| M9 | "3/2 mocks" label in content loading status is confusing | Home tab quick-practice area | Format shows numerator > denominator |

### 🔵 MINOR

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| P8 | Log out has no confirmation dialog — destructive action with one tap | Settings | Could add "Are you sure?" |
| P9 | Removed chat route must not expose a chat input | Removed chat route | Prevents misleading paid-token claims |

---

## 11. Phase 2 Corrections to Priority Table

**Remove from §5 Missing Features:**
- ~~Achievement badges — UI/screen not found despite being in changelog~~ → **FIXED — badges exist in Profile tab**
- ~~Social sharing of quiz results — No share button on result screen~~ → **FIXED — "Share score" button exists**

**Update §5 Missing Features:**
- Profile edit entry point: ✅ Accessible (Settings → Edit profile) — remove from missing features
- Add: Avatar photo upload (only initials-based)

---

## 12. Updated Overall Issue Count

| Severity | Phase 1 | Phase 2 New | Total |
|----------|---------|-------------|-------|
| 🔴 Critical | 3 | 1 | **4** |
| 🟠 High | 4 | 2 | **6** |
| 🟡 Major | 7 | 2 | **9** |
| 🔵 Minor | 7 | 2 | **9** |
| **Total** | **21** | **7** | **28** |

---

## 13. Authenticated Screens Checklist

| Screen | Route | Auth State | Status |
|--------|-------|-----------|--------|
| Dashboard (Home) | `/(tabs)` | Free | ✅ + issues |
| Settings | `/(tabs)/settings` | Free | ✅ |
| Edit Profile | `/profile/edit` | Free | ✅ |
| Profile Tab | `/(tabs)/progress` | Free | ✅ + bug |
| Mock Review | `/mock-review/[id]` | Free | ✅ + clip bug |
| Study Subjects | `/(tabs)/study` | Free | ✅ |
| Mock Exam dialogs | Study → Mock tab | Free | ✅ |
| Removed chat | `/tutor` | Removed | ✅ |
| Analytics | `/analytics` | Free | ✅ |
| Mistake Bank | `/mistakes` | Free | ✅ + duplicate bug |
| Barkada | `/barkada` | Free | ✅ |
| PasaPath Week | `/pasapath/week` | Free | ✅ |

---

*Phase 2 complete. 12 authenticated screens examined. 1 new critical, 2 new high, 2 new major, 2 new minor issues found. Total across both phases: 28 issues across 39 screen-states.*
