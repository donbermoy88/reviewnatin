# ReviewNatin PH — Product Experience Audit

**Date:** 2026-06-22  
**Build reference:** Android beta v12+ (Maestro 5/5 on v12)  
**Method:** 12 beta-tester persona simulation + codebase/journey review + competitive benchmark  
**Status:** Approved for implementation — **P0 UX changes landed in this commit cycle**

---

## Executive Summary

ReviewNatin PH is **feature-complete for Phase 1 beta**: practice loop, mocks, flashcards, AI tutor, analytics, gamification (XP, streaks, badges, leaderboard, Barkada), and web checkout are implemented—not stubbed. The product’s biggest risks are **not missing features** but **experience friction**:

1. **Long funnel** — welcome → 6 onboarding steps → optional OTP → dashboard  
2. **Guest vs signed-in split** — many features gated with similar “Mag-log in muna” patterns  
3. **Free-tier caps** — 20 Q/day, mock preview, AI limits — poorly timed messaging hurts F3/F4  
4. **Premium path** — guest → signup → OTP → paywall → browser checkout (high abandonment)  
5. **Settings discoverability** — hidden from tab bar (Profile gear only)  
6. **Content gaps** — empty states when question bank below minimum  

**Competitive edge:** Filipino-first Taglish brand, multi-exam (CSE/LET/PNLE), PasaPath daily plan, Mistake Bank, exam-calendar countdown, GCash/Maya web checkout for PH.

**This audit’s P0 implementation** (already coded):
- `GuestNextStepCard` on dashboard (G1, G2, G4)  
- Tagalog paywall copy + `PremiumLimitPanel` at 20 Q limit  
- PH-first Plus headline + PRC disclaimer on subscribe  
- Settings coach mark on Profile  
- Centralized `lib/product-copy.ts` for conversion copy  
- Tagalog content-gate banner  

---

## Guest User Findings (G1–G4)

| Tester | Profile | Top friction | Drop-off risk | Implemented fix |
|--------|---------|--------------|---------------|-----------------|
| **G1** | First install, curious | 6-step onboarding before value | Step 3–4 account pitch | Guest next-step card → practice in 1 tap |
| **G2** | Free only, avoids signup | Account step feels pushy | Step 3 “I-save ang progress” | “Libre, walang signup” on guest card |
| **G3** | Low-end device, slow net | Heavy hero + charts load | Timeout on first launch | P2: skeleton already exists; defer charts for guest |
| **G4** | Distracted, uninstalls if confused | Settings buried; unclear path | No obvious “start here” | Guest card + Profile settings hint |

**Journey scores (1–5):** Launch 4 · Welcome 4 · Dashboard 3→**4** · Practice 4 · Subscribe N/A · Settings 2→**3**

---

## Free User Findings (F1–F4)

| Tester | Profile | Top friction | Drop-off risk |
|--------|---------|--------------|---------------|
| **F1** | Serious CSE reviewee | OTP before studying; verify-email deeplink | OTP email delay |
| **F2** | LET reviewee | LET major picker in onboarding — easy to miss | Wrong track selected |
| **F3** | Occasional studier | 20 Q/day feels abrupt without warning | Hit limit → leave |
| **F4** | Heavy user, no pay | Ads + limit without “why Plus” story | Churn at day 3–7 |

**Implemented:** Tagalog limit messages, premium value bullets at paywall, “Balik bukas” dismiss path.

**Still manual:** F1 OTP E2E, F3 limit timing (P1: show remaining count on dashboard hero).

---

## Premium User Findings (P1–P4)

| Tester | Profile | Top friction | Expectation gap |
|--------|---------|--------------|-----------------|
| **P1** | Daily active | AI tutor daily cap | “Unlimited” messaging |
| **P2** | Power user | Offline pack buried in Settings | Discoverability |
| **P3** | Paid subscriber | Checkout → browser handoff | Trust / receipt anxiety |
| **P4** | Exam in 30 days | Countdown exists but weak Plus tie-in | Urgency at countdown |

**P1 roadmap:** Exam-countdown → Plus CTA when ≤30 days (copy in `product-copy.ts`, UI P1).

---

## Friction Point Analysis (20 journeys)

| # | Journey | G | F | P | Severity | Priority |
|---|---------|---|---|---|----------|----------|
| 1 | First launch | Spinner → onboarding | Same | Same | Medium | P1 |
| 2 | Welcome | Strong brand | — | — | Low | — |
| 3 | Registration | N/A | OTP + Turnstile | — | **High** | P0 doc |
| 4 | Email OTP | N/A | Deeplink cold start | — | **High** | P0 eng |
| 5 | Onboarding | 6 steps long | Same | Same | **High** | P1 |
| 6 | Dashboard | No readiness guest | Good | Good | Medium | **P0 done** |
| 7 | Navigation | Settings hidden | Same | Same | Medium | **P0 hint** |
| 8 | Practice quiz | 20 Q cap | Limit shock | — | **High** | **P0 done** |
| 9 | Mock exam | Login required | Preview limits | Full | Medium | P1 |
| 10 | Flashcards | Empty if no content | Same | Same | Content | P0 content |
| 11 | AI tutor | Signup gate | Daily limit | Cap | Medium | P1 |
| 12 | Analytics | Login gate | Good | Good | Low | — |
| 13 | Progress | Local only guest | Good | Good | Low | — |
| 14 | Leaderboard | No account rank | Good | Good | Low | P2 |
| 15 | Subscribe | Must signup first | Web checkout | Manage | **High** | P0 copy |
| 16 | Notifications | Opt-in only | Same | Same | Medium | P1 |
| 17 | Daily return | No “welcome back” | Streak ok | Streak ok | Medium | P1 |
| 18 | Premium features | N/A | Gates unclear | Expect polish | Medium | P1 |
| 19 | Settings | Hard to find | OK | OK | Medium | **P0 hint** |
| 20 | Account mgmt | N/A | Delete ok | Same | Low | — |

---

## Retention Analysis

### Daily streak system
**Current:** Streak on dashboard + profile; milestone modal at 7/14/30/60/100; streak freeze via XP.  
**Recommendation (P1):** Show “at risk” banner when user hasn’t practiced today after 6 PM; streak freeze prompt before break.

### Achievement system
**Current:** Badges on Profile via RPC; no dedicated screen.  
**Recommendation (P1):** Badge detail sheet; share milestone; tie to exam readiness factors.

### Study milestones
**Current:** Daily goal ring; PasaPath tasks; weekly summary on Profile.  
**Recommendation (P1):** Weekly email/push summary; “You’re 80% to weekly goal.”

### Smart reminders
**Current:** 7 PM daily default; exam reminders 14/7/1 day.  
**Recommendation (P0):** Prompt notification permission after first quiz completion (not onboarding). **P1:** Tagalog notification copy.

### Comeback notifications
| Inactive | Strategy |
|----------|----------|
| 7 days | “Balik tayo — {streak} streak mo sayang” |
| 14 days | Weak topic drill deeplink |
| 30 days | Exam countdown + mock CTA |

**P2:** Implement via Supabase scheduled push + PostHog cohorts.

---

## Conversion Analysis

### Missed upgrade opportunities (before fixes)
- 20 Q limit: English-only, no value bullets  
- Dashboard: generic Plus card  
- Subscribe: English headline  
- Mock preview end: weak CTA  
- AI tutor gate: no trial taste  

### Implemented (P0)
- `PremiumLimitPanel` with 4 value bullets + “Balik bukas”  
- Tagalog `canStartPractice` messages  
- Plus headline: “Lahat ng kailangan mo para makapasa”  
- PRC/CSC disclaimer on paywall  
- Guest subscribe banner → signup (not login only)  

### Paywall improvements (P1)
- Default select 6-month “BEST VALUE”  
- Social proof: “Join thousands of reviewees” (when data exists)  
- Post-checkout in-app confirmation animation  

### Upgrade timing
| Moment | Trigger |
|--------|---------|
| Question 15/20 | Soft banner “5 tanong na lang” |
| Limit hit | **PremiumLimitPanel** ✓ |
| Mock preview end | Full mock unlock CTA |
| 7-day streak | “Protect streak with Plus offline” |
| Exam ≤30 days | Countdown + Plus strip |

---

## UX Analysis

| Area | Score | Notes |
|------|-------|-------|
| Navigation | 3.5/5 | 4 tabs clear; Settings hidden |
| Dashboard | 4/5 | Hero strong; guest path improved |
| Study | 4/5 | Subject/mock tabs work |
| Quiz | 4/5 | EN/TL toggle; haptics |
| Results | 4/5 | Share, review, AI explain |
| Analytics | 3.5/5 | Dense for casual users |
| Paywall | 3.5→4/5 | PH copy improved |

---

## Gamification Analysis

| System | Keep? | Rationale |
|--------|-------|-----------|
| Streaks | **Yes** | Proven retention; already built |
| XP + Leaderboard | **Yes** | Social proof for barkada |
| Badges | **Yes** | Milestone motivation; needs UI polish |
| PasaPath daily tasks | **Yes** | Core differentiator |
| Readiness score | **Yes** | Exam outcome focus |
| Levels/XP avatar | **No** | Gimmick vs exam prep |
| Random challenges | **P2** | Only if tied to weak topics |

---

## Design Analysis

**Strengths:** Brand gradient hero, Ionicons, DM Sans, goal rings, Taglish voice.  
**Gaps:** Mixed EN/TL on same screen; ad placeholder breaks premium feel; some empty states English-only.

**P1 polish:** Unified Taglish for gates; loading skeletons on Study tab; success confetti on quiz pass (already partial).

---

## Competitive Analysis

| Competitor | Their strength | ReviewNatin gap | Our advantage |
|------------|----------------|-----------------|---------------|
| Quizlet | UGC decks, brand | Content volume | Exam-aligned bank, PRC disclaimer |
| Duolingo | Streak + UX | Gamification polish | Real exam mocks |
| Khan Academy | Free depth | Video lessons | Quiz-first, Filipino exams |
| Coursera/Udemy | Courses | Long-form | Bite-size daily |
| PH reviewer apps | Local exams | Marketing reach | Modern app, web pay GCash/Maya |

**Unique opportunities:** PasaPath + Mistake Bank + readiness in one app; Barkada cohort challenges; AI tutor in Tagalog.

---

## P0 Recommendations (Critical — largely implemented)

| # | Recommendation | Status |
|---|----------------|--------|
| 1 | Guest “start here” on dashboard | **Done** — `GuestNextStepCard` |
| 2 | Tagalog 20 Q limit + value props | **Done** — `PremiumLimitPanel`, `paywall.ts` |
| 3 | PH Plus headline + disclaimer | **Done** — `subscribe/index.tsx` |
| 4 | Settings discoverability hint | **Done** — `ProfileSettingsHint` |
| 5 | Centralized product copy | **Done** — `lib/product-copy.ts` |
| 6 | Verify-email cold deeplink | **Eng in progress** — build 13+ |
| 7 | Content bank minimum | **Ops** — seed pipeline |

---

## P1 Recommendations (High impact — next sprint)

1. Shorten onboarding: merge steps 2–3; default guest skip account step  
2. Remaining-questions chip on dashboard hero (F3)  
3. Exam countdown → Plus strip when ≤30 days (P4)  
4. Notification permission after first quiz  
5. Mock preview end screen → subscribe CTA  
6. Badge detail + share  
7. PostHog funnels for limit → subscribe  
8. Tagalog push notification templates  

---

## P2 Recommendations (Nice to have)

1. Welcome-back banner (daily return)  
2. Leaderboard friend invite deeplink  
3. Quiz pass micro-animation  
4. Analytics “explain this chart” tooltips  
5. 7/14/30-day comeback push campaigns  

---

## P3 Recommendations (Future roadmap)

1. Spaced repetition scheduler UI  
2. Parent/mentor progress share  
3. Live proctor mock mode  
4. Community study rooms  
5. Certificate PDF export  

---

## 30-Day Roadmap

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | **P0 ship** | Guest card, paywall panel, copy, settings hint, Maestro green |
| 2 | **P1 onboarding** | Compress steps; post-quiz notification ask |
| 3 | **P1 conversion** | Countdown Plus strip; mock end CTA; PostHog dashboards |
| 4 | **Beta scale** | 12 testers full matrix; content seed sprint |

---

## 90-Day Roadmap

| Month | Theme |
|-------|-------|
| 1 | Launch readiness — P0/P1 UX, checkout E2E, content bank |
| 2 | Retention — push campaigns, badges, weekly summaries |
| 3 | Growth — ASO, referral/Barkada, LET/PNLE marketing |

---

## Estimated Impact

| Metric | P0 alone | P0 + P1 (90d) |
|--------|----------|---------------|
| D1 retention | +5–8% | +12–18% |
| DAU | +3–5% | +10–15% |
| Session duration | +2 min | +5–8 min |
| Subscribe conversion | +0.5–1.0 pp | +2–4 pp |
| Learning effectiveness | Neutral | +8–12% completion rate |

*Estimates based on funnel friction removal and PH edtech benchmarks; validate with PostHog after v13 ship.*

---

## Appendix: Tester journey checklist

See [beta-audit-matrix.md](./beta-audit-matrix.md) for cohort × screen matrix.  
Automated: `npm run beta:maestro` · Full: `npm run beta:force`
