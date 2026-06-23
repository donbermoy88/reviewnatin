# Phase 5 — Performance, UI Consistency & Subscription Funnel

**Sprint:** Week 5  
**Status:** Code complete (local) — ship on preview build **34+**  
**Ship candidate:** EAS preview build 34 ([PostHog + subscribe gate fixes](../dist/beta/))

Parent program: [android-beta-program.md](./android-beta-program.md)  
Prior: [Phase 4 — Analytics](./android-beta-program-phase-4.md) · Next: [Phase 6 — Play Console migration](./play-console-migration.md)

---

## Goal

Polish performance on low-end Android, consolidate subscription pricing/display, and tighten the web-checkout funnel for APK beta — without blocking Play Console migration (Phase 6).

---

## Deliverables checklist

### 5.1 Performance

| Item | Status | Location |
|------|--------|----------|
| FlatList on long lists (mock-review, leaderboard, mistakes, bookmarks) | ✅ | Verified in prior audit |
| Network offline debounce (2 failures) | ✅ | `hooks/use-network-status.ts` |
| Defer AdMob init after first paint | ✅ | `app/_layout.tsx` + `defer-after-interaction.ts` |
| Defer dashboard chart fetches | ✅ | `(tabs)/index.tsx` — analytics/trend after interaction |
| Memoized Study insights block | ✅ | `components/dashboard/home-study-insights.tsx` |
| Perf catalog + tests | ✅ | `lib/performance/perf-catalog.ts` |

**Target:** cold start feels responsive on 2GB RAM; no false offline flash on launch.

### 5.2 Subscription funnel

| Item | Status | Location |
|------|--------|----------|
| DB-authoritative pricing (no hardcoded map) | ✅ | `lib/api/entitlements.ts`, `lib/subscription/pricing-display.ts` |
| Store price override when Play billing live | ✅ | `resolveProductPrice()` |
| Web checkout beta banners + trial clarity | ✅ | `lib/subscription/checkout-copy.ts`, subscribe screen |
| Free daily limit strip on dashboard (F3) | ✅ | `components/dashboard/free-daily-limit-strip.tsx` |
| Exam countdown → Plus CTA ≤30 days (P4) | ✅ | `components/exam-countdown-card.tsx` |
| Funnel events (`subscription_viewed` → `checkout_started` → `subscription_active`) | ✅ | Phase 4 |

### 5.3 Design consistency

| Item | Status | Notes |
|------|--------|-------|
| Plus Jakarta Sans (canonical) | ✅ | Do not switch to DM Sans without full rebrand |
| Dark mode on auth/onboarding | ✅ | Existing theme tokens |
| Component map | ✅ | See [mobile-design-system.md](./mobile-design-system.md) |

---

## Commands

```bash
npm run beta:phase5:verify
npm run mobile:test -- perf-catalog pricing-display checkout-copy
```

Report: `dist/beta/phase5-verify.json`

---

## Acceptance criteria

- [ ] `npm run beta:phase5:verify` passes
- [ ] Free signed-in user sees remaining daily questions on Home
- [ ] Exam ≤30 days shows Plus CTA on countdown card (non-premium)
- [ ] Subscribe screen shows GCash/Maya + no-trial clarity
- [ ] Dashboard charts load after hero (no blocking cold start)
- [ ] Maestro `premium-subscribe-hint` passes on build 34+

---

## Related

| Doc | Purpose |
|-----|---------|
| [play-console-migration.md](./play-console-migration.md) | Phase 6 Play internal testing |
| [product-experience-audit-2026-06-22.md](./product-experience-audit-2026-06-22.md) | F3/F4/P4 UX rationale |
| [release-readiness-checklist.md](./release-readiness-checklist.md) | Weighted score gates |
