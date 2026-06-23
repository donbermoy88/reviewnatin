# Phase 2 — Screen Audit & Critical UX Fixes

**Sprint:** Week 2  
**Status:** Code complete (local) — full Maestro pass on emulator recommended each release  
**Ship candidate:** [Build 28](./beta-distribution-build-28.md)

Parent program: [android-beta-program.md](./android-beta-program.md)  
Prior: [Phase 1](./android-beta-program-phase-1.md) · Next: [Phase 3 — Onboarding redesign](./android-beta-program.md) (Week 3)

---

## Goal

Full QA pass across **36 routes**, standardize **Taglish error copy**, and improve **accessibility** on high-traffic auth, onboarding, quiz, and tab flows.

---

## Deliverables checklist

### 2.1 Screen-by-screen audit matrix

| Item | Status | Location |
|------|--------|----------|
| 36-route matrix (G / F / P columns) | ✅ | [beta-route-audit-matrix.md](./beta-route-audit-matrix.md) |
| Cohort smoke mapping (12 AI personas) | ✅ | [beta-testers.md](./beta-testers.md) + `npm run beta:agents` |
| Deep link regression tests | ✅ | `apps/mobile/lib/deep-link-routes.test.ts` |
| Maestro deeplink flow | ✅ | `apps/mobile/.maestro/flows/deeplink-verify-email.yaml` |

### 2.2 Error handling standardization

| Item | Status | Location |
|------|--------|----------|
| `toUserFacingError()` mapper | ✅ | `apps/mobile/lib/errors/user-facing.ts` |
| Vitest coverage | ✅ | `apps/mobile/lib/errors/user-facing.test.ts` |
| No raw `error.message` in Alert.alert | ✅ | Phase 2 audit (barkada, onboarding fixed) |
| `ErrorState` + retry on data-fetch screens | ✅ | leaderboard, mistakes, bookmarks, mock-review, analytics |
| Offline quiz flusher on submit paths | ✅ | `components/offline-queue-flusher.tsx` + quiz hooks |

### 2.3 Accessibility pass (high-traffic)

| Item | Status | Location |
|------|--------|----------|
| Auth fields — label focus + a11y | ✅ | `components/auth-labeled-field.tsx` |
| Quiz choices — role + label | ✅ | `components/choice-option.tsx` |
| Tab bar — tab a11y labels | ✅ | `app/(tabs)/_layout.tsx` |
| Primary buttons — min touch target | ✅ | `components/primary-button.tsx` (`touchTarget.min`) |
| Onboarding exam cards — a11y | ✅ | `app/onboarding/index.tsx` (Phase 2) |
| Font scaling | ✅ | No `allowFontScaling={false}` in app (RN default on) |
| Gradient header contrast | ✅ | Brand tokens in `packages/shared`; white text on hero gradient |

---

## Commands

```bash
# Phase 2 deliverable + lint checks
npm run beta:phase2:verify

# Targeted unit tests
npm run mobile:test -- user-facing deep-link-routes

# Emulator cohort + deeplink smokes
npm run beta:maestro

# Full 12 AI persona run
npm run beta:agents -- --skip-cloud --apk dist/beta/reviewnatin-beta-v28.apk
```

Report: `dist/beta/phase2-verify.json`

---

## Acceptance criteria

- [ ] `npm run beta:phase2:verify` passes
- [ ] No `Alert.alert(..., error.message)` patterns in `apps/mobile`
- [ ] All data-fetch screens in matrix show `ErrorState` or `ScreenState` with retry
- [ ] Auth, quiz, tab bar have accessibility labels (spot-check TalkBack)
- [ ] Deep link Vitest + Maestro deeplink flow run on release candidate
- [ ] [beta-route-audit-matrix.md](./beta-route-audit-matrix.md) updated for new build

---

## Known gaps (Phase 3+)

| Area | Priority | Target phase |
|------|----------|--------------|
| Onboarding illustrations / hero art | P1 | Phase 3 |
| Subscribe pricing — single DB + store SoT | P1 partial | Ongoing; store wins at runtime |
| Global search | P2 backlog | TBD |
| Analytics charts upgrade | P2 | Phase 4 |
| FCM on sideloaded APK | Document only | Play Console migration |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [beta-audit-matrix.md](./beta-audit-matrix.md) | Flow × cohort behavior (legacy) |
| [release-readiness-checklist.md](./release-readiness-checklist.md) | Release gates |
| [product-experience-audit-2026-06-22.md](./product-experience-audit-2026-06-22.md) | P0–P3 UX audit |
