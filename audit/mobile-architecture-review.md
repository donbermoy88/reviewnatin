# ReviewNatin Mobile — Architecture Review & Refactoring Strategy

_Senior-engineer reverse-engineering pass over `apps/mobile`. Scope: architecture,
data flow, and code-quality risks. Behavior-preserving refactors applied in this
pass are listed in the final section; everything else is a documented
recommendation, not a change._

---

## 1. Reverse-engineered architecture

**Stack:** Expo SDK 56, React 19, React Native 0.85, `expo-router` (file-based
routing), Supabase (`@supabase/supabase-js`) as the single backend, AsyncStorage
for local persistence, Sentry for monitoring, RevenueCat-style IAP via
`react-native-iap` + a Supabase Edge Function verifier.

### Layering (as built)

```
app/                 expo-router screens (the UI + most orchestration logic)
  (auth)/  (tabs)/  practice/  study/  …
components/          presentational + a few "smart" widgets
providers/           React Context: Auth, Entitlements, IAP, Preferences, Onboarding, Font
hooks/               useAppTheme, useNetworkStatus, useUserProfile
lib/
  api/               ~40 data-access modules, one per feature, calling supabase directly
  offline/           answer queue, content-report queue, offline pack, sync status
  cache/             json-cache (TTL + stale-while-revalidate over AsyncStorage)
  iap/               store, SKUs, availability, manage-subscription
  auth/              oauth, validation, errors, post-auth
  monitoring/        sentry wrappers + structured events
  themed-styles.ts   1,782-line stylesheet factory registry
constants/           theme.ts (light), dark-theme.ts, brand.ts
packages/shared/     design tokens, exam catalog constants, DB types (workspace pkg)
```

### Data flow (canonical read path — e.g. Home tab)

```
Screen mounts
  └─ useEffect → load() → Promise.all([... lib/api/* fetchers ...])
        └─ each fetcher: guard isSupabaseConfigured → supabase.from()/rpc()
              └─ (some) wrapped in cachedJson(key, loader, {ttlMs})  ← AsyncStorage
        └─ manual row → camelCase mapping
  └─ setState(...) × N  → render
  └─ pull-to-refresh re-runs load() unconditionally
```

### Data flow (core write path — quiz submission)

```
practice/quiz.tsx (god component, ~1,150 lines)
  └─ load effect: 10 mode branches (practice/timed/mock/board/diagnostic/
        mistake_review/bookmark_review/weak_area/barkada/offline)
  └─ per-answer: checkQuestionAnswer (RPC, server-graded) → recordQuizOutcome
  └─ finishQuiz():
        online + auth  → createQuizSession → saveQuizAnswers → complete_quiz_session (RPC)
                          → awardSessionXp / recordSessionOutcomes / awardUserBadges
        offline + auth → queuePendingSession (AsyncStorage) ── flushed later by
                          OfflineQueueFlusher on reconnect / 60s interval
        guest          → saveGuestQuizSession (AsyncStorage)
        always         → router.replace('/practice/result', {…params…})
```

**Server is the source of truth for grading.** `is_correct`, `score_percent`,
readiness, and XP are computed by Postgres triggers / RPCs; the client never sends
correctness for authenticated sessions. This is a genuinely good decision and
should be preserved.

---

## 2. Clean architecture breakdown (target shape)

The current layering is _conceptually_ sound — `app` → `lib/api` → `supabase`
with providers for cross-cutting state. The gaps are about **consistency and
boundaries**, not a wrong overall shape:

| Layer | Today | Target |
| --- | --- | --- |
| Screens | Hold fetching + orchestration + heavy branching | Thin; delegate to hooks/services |
| Data access (`lib/api`) | 40 modules, each re-implements guards, mapping, error policy | Shared client wrapper + mappers + one error contract |
| Caching/fetching | Manual `useEffect`+`useState` per screen; `cachedJson` used by ~12 of ~40 fetchers | One query layer (dedupe + cache + refetch-on-focus) |
| Offline | Two near-identical queues | One queue primitive + per-feature config _(done — see §6)_ |
| Mode logic | Inlined ternaries duplicated across call sites | Single resolver _(done — see §6)_ |
| Styling | One 1,782-line file of 16 factories + 6 ad-hoc local copies | Co-locate styles with their screen/component |

---

## 3. Critical problem areas

### 3.1 God component: `app/practice/quiz.tsx` (~1,150 lines) — **highest risk**
A single component owns 10 quiz modes, ~25 `useState`/`useRef`, 9 effects (timer,
load, autosave, backgrounding, lang sync, timer-expiry submit…), the offline
fallback, the resume-snapshot machine, the hint economy, and the entire
`finishQuiz` orchestration. It has **no integration tests**. Every feature change
to any mode risks all modes. This is the #1 maintainability and correctness hazard.

### 3.2 Duplicated, drifted "mode → string" mappings
The mode label was hand-written as a ternary chain in **5 places** in
`quiz.tsx` and they had **drifted out of sync**:
- The Sentry telemetry tags (was: `…isTimed ? 'timed' : 'practice'`) collapsed
  `weak_area`, `barkada`, and `bookmark_review` into `'practice'`, silently
  mislabeling those sessions in monitoring.
- The DB-enum mapping, guest-history mapping, and result-route mapping each
  listed a _different_ subset of modes.
This is exactly the class of bug that copy-pasted logic produces.

### 3.3 Two near-identical offline queues
`lib/offline/answer-queue.ts` and `lib/offline/content-report-queue.ts` each
carried their own copy of:
- `nextRetryAt()` (byte-for-byte identical exponential backoff),
- `BASE_BACKOFF_MS` / `MAX_BACKOFF_MS` constants, and
- the `read/write/clear` AsyncStorage block with the same `JSON.parse` guard and
  the same `slice(-MAX)` cap.
Any change to the retry policy had to be made twice or the queues diverge.

### 3.4 No shared data-access contract (40× repetition)
Every `lib/api/*` module re-implements:
- the `if (!isSupabaseConfigured) return <empty>` guard,
- a bespoke snake_case → camelCase `.map()` (sometimes named `mapRow`, sometimes
  inline, sometimes with `as Record<string, unknown>` casts), and
- an **inconsistent error policy**: some `throw`, some swallow → `null`/`[]`/`0`
  with no logging, some return `{ ok, error }`, some log-then-null. A caller
  cannot reason about failure without reading each function.

### 3.5 No query layer → N+1 fetches, no dedupe, stale data
Every screen owns a manual `useEffect → Promise.all → setState×N` block
(~25–30 of them). There is **no request deduplication** (two screens mounting
both call `fetchExamBySlug`), **no refetch-on-focus**, and caching is opt-in per
fetcher (only ~12 of ~40 use `cachedJson`). User-specific data (stats, analytics,
leaderboard, mock history) refetches from scratch every visit.

### 3.6 AsyncStorage key sprawl
13+ independent key prefixes are coined ad hoc across 18 modules
(`reviewnatin:cache:v1:`, `reviewnatin:offline:*`, `reviewnatin:prefs`,
`reviewnatin:bookmarks:`, `reviewnatin:exam-resume:`, …). No central registry, no
collision guard, no migration story when a shape changes.

### 3.7 Styling monolith
`lib/themed-styles.ts` is 1,782 lines exporting 16 `createXStyles(theme)`
factories for unrelated screens, while 6 screens (`subscribe`, `onboarding`,
`login`, `signup`, `legal`, `study/[subjectSlug]`) define their _own_ local
`createStyles(theme)` — two conventions for the same problem. Editing the home
screen forces a diff in the same file as the quiz/leaderboard/profile styles.

---

## 4. Performance & scalability risks

- **Quiz timer effect** runs `setElapsed` + `setTimeLeft` every second, each a
  state update that re-renders the whole ~1,150-line component (including the
  options list and `RichText`). Fine today; will get worse as the screen grows.
  _Target:_ isolate the timer into a child component / `useRef`-backed display.
- **`fetchPracticeStats` pulls up to 100 sessions** and recomputes streak,
  accuracy, and today's count on the client (`lib/api/stats.ts`) even though the
  DB already maintains `users.streak_count` and can aggregate. Client-side
  `computeStreak` is also duplicated against the server trigger logic.
- **No request dedupe / cache for user data** means tab-switching re-issues the
  full fetch fan-out each time → redundant Supabase round-trips that scale with
  navigation, not with data change.
- **`offline-queue-flusher` polls every 60s while online** regardless of whether
  anything is queued; cheap now, but it always reads AsyncStorage twice per tick.
- **Guest grading in `finishQuiz`** awaits `checkQuestionAnswer` per answer in a
  `Promise.all` — fine for 30 items, but it's an unbounded fan-out tied to item
  count with no batching RPC.

---

## 5. Maintainability issues (summary)

- God component (3.1) + no component tests on the most complex screen.
- Copy-paste logic that has already drifted (3.2, 3.3).
- No single error/zero-value contract for the data layer (3.4).
- Hand-rolled fetching with no library (3.5) → every screen reinvents
  loading/refreshing/error state.
- Storage-key and styling conventions are decided per-file (3.6, 3.7).
- `mode` is stringly-typed end-to-end (route param → booleans → strings) instead
  of a discriminated union exported from one place.

---

## 6. Refactors applied (behavior-preserving)

Each change below is provably output-identical (or telemetry-only) and is covered
by new unit tests. Full suite: **14 files / 77 tests pass**; `tsc --noEmit` clean;
no new lint errors/warnings.

### 6.1 Unified offline retry policy + queue storage
- **New `lib/offline/retry-policy.ts`** — single home for `nextRetryAt()`,
  `isRetryDue()`, and the backoff constants, with 9 unit tests
  (`retry-policy.test.ts`) pinning the exact schedule (30s → ×2 → cap 30m) and
  the boundary conditions.
- **New `lib/offline/queue-storage.ts`** — `createQueueStorage<T>(key, maxItems)`
  factory that encapsulates the read/write/clear + `JSON.parse` guard + cap.
- `answer-queue.ts` and `content-report-queue.ts` now consume both. The
  content-report module re-exports `nextRetryAt` so its existing importer
  (`lib/api/content-reports.ts`) is untouched. Net: the duplicated backoff/storage
  logic is gone; each queue keeps only its own enqueue semantics.

### 6.2 Canonical quiz-mode resolver — all call sites unified
- **New `lib/quiz-mode.ts`** with two pure functions + unit tests:
  - `resolveQuizMode({ mode, offline })` — the descriptive/result-route label.
  - `toQuizSessionMode({ mode })` — the DB `quiz_sessions.mode` enum value.
- The result screen renders `mistake_review` identically to `practice` in every
  branch, so `mistake_review` is now a first-class resolver value — which let
  **all five** drifted ternaries in `quiz.tsx` collapse onto a single
  `descriptiveMode` constant + the two resolvers, with no behavior change. This
  also fixes the §3.2 Sentry mislabeling (telemetry now reports the true mode for
  `weak_area`/`barkada`/`bookmark_review`/`offline` instead of `practice`).

### 6.3 Central storage-key registry
- **New `lib/storage-keys.ts`** — `StorageKeys`, `StorageKeyPrefix`, and
  `storageKeyFor.*` builders holding the _exact existing_ literal strings (a
  persistence contract — values unchanged).
- Migrated all 15 ad-hoc call sites across `lib/`, `providers/`, and `app/` to
  import from the registry. This removes the real duplication where
  `reviewnatin:prefs` was hard-coded in both `lib/api/preferences.ts` and
  `providers/preferences-provider.tsx`. A grep confirms no `reviewnatin:` storage
  literal remains outside the registry.

### 6.4 Extracted pure quiz-session logic out of the god-function
- **New `lib/quiz-session.ts`** — `finalizeAnswers`, `buildStrictAnswers`, and
  `computeSessionScore`, moved out of `practice/quiz.tsx`'s `finishQuiz` and
  covered by unit tests (the core answer-assembly/scoring path previously had
  none). Screen logic is unchanged; the helpers are byte-equivalent.

### 6.5 Request de-duplication (query-layer foundation)
- **New `lib/data/dedupe.ts`** — `dedupeAsync(key, loader)` coalesces concurrent
  calls that share a key onto one in-flight promise (removed on settle, so it's
  coalescing, not caching), with 4 unit tests covering concurrency, distinct
  keys, post-settle re-run, and shared rejection.
- Wired transparently into `cachedJson` so simultaneous cache-misses for the same
  catalog/config key fire a single network round-trip — directly addressing the
  §3.5 "two screens mounting both call `fetchExamBySlug` → two requests" risk.
  The observable contract is unchanged (same value, same cache write).
- This is the safe, behavior-transparent core of a query layer. A full
  TanStack-Query migration (refetch-on-focus + replacing the ~25 hand-rolled
  fetch effects) remains a follow-up: each screen's `load()` is bespoke
  (multi-state, e.g. leaderboard sets `examSlug` + `entries` from one call), so
  those migrations need component/E2E coverage rather than a `tsc`-only change.

### 6.6 Split the `themed-styles.ts` monolith
- The 1,782-line file (16 unrelated `createXStyles` factories) is now a
  **`lib/themed-styles/` directory** grouped by domain (`components`,
  `navigation`, `dashboard`, `study`, `profile`, `leaderboard`, `quiz`, `lists`,
  `result`, `analytics`) behind an `index.ts` barrel. Every factory body is
  byte-identical; consumers import the same `'../../lib/themed-styles'` path and
  resolve through the barrel, so no call site changed. Editing the home-screen
  styles no longer collides with the quiz/leaderboard/profile styles.

---

## 7. Recommended next steps (need runtime/integration test scaffolding first)

1. **Finish decomposing `quiz.tsx`**: extract `useQuizSession` (load + state
   machine), `useQuizTimer`, `useExamResume`, and `useHints`. The pure helpers
   (§6.4) are step one; the stateful hooks share `timeLeft`/answer state across
   the component, so they should land behind component/E2E tests rather than be
   moved on `tsc` alone.
2. **Complete the query layer**: the de-dup + cache foundation is in place
   (§6.5); the remaining work is refetch-on-focus and replacing the ~25
   hand-rolled fetch effects (TanStack Query is Expo-compatible). Each screen's
   `load()` is bespoke, so migrate them behind component/E2E coverage.
3. **One data-access contract**: a thin `supabase` wrapper + shared `mapRow`
   helpers + a single `Result<T>`/throw policy; migrate `lib/api/*` module by
   module (high churn; each module's bespoke mapping must be diffed carefully).
4. **Type `mode` as a discriminated union** exported from `lib/quiz-mode.ts` and
   thread it through routing instead of stringly-typed params + boolean flags.

### Convention follow-up
Six screens (`subscribe`, `onboarding`, `login`, `signup`, `legal`,
`study/[subjectSlug]`) still define their own local `createStyles(theme)`. With
the registry now split by domain, the cleanest end-state is to co-locate each
screen's styles in its own file and drop the central registry entirely — but that
is a larger move and should follow the screen-by-screen decomposition.
