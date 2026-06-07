# Engineering quality (P3)

## Tests

```bash
npm run test          # all mobile unit tests (vitest)
npm run mobile:test   # same
npm run content:audit:rules
npm run content:import:rules
npm run content:admin-import:ui
npm run admin:proxy:rules
npm run content:audit:ci
npm run admin:e2e
npm run web:build
```

| Suite | Covers |
|-------|--------|
| `lib/auth/validation.test.ts` | Email/password validation |
| `lib/onboarding-nav.test.ts` | Entry routing, diagnostic redirect |
| `lib/api/goals.test.ts` | Goal merge + LET secondary rules |
| `lib/quiz-grading.test.ts` | Score % + answer grading (mirrors DB trigger) |
| `scripts/lib/question-import.test.mjs` | CSV import validation, grouped errors, `.errors.csv` output |
| `scripts/lib/admin-import-ui.test.mjs` | Admin import preview gate and error download regression guard |
| `scripts/lib/admin-proxy.test.mjs` | Admin `proxy.ts` convention, route protection, and staff-role guard |
| `apps/admin/e2e/content-import.spec.ts` | Browser smoke test for admin CSV import preview, error CSV download, and clean import |

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- **lint-and-test** — ESLint (mobile, admin, marketing), admin proxy guard, and vitest
- **content-quality** — content audit/import rule tests, admin import UI guard, live Supabase content gate when secrets are present
- **admin-e2e** — Playwright Chromium smoke tests for admin workflows with mocked backend responses
- **web-build** — production `next build` for admin and marketing
- **supabase** — local stack, `db reset`, `db lint --local`

For the live content gate, configure GitHub repository secrets:

```
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

`content:audit:ci` fails on `medium`, `high`, or `critical` content defects. Low-severity findings are admin review hints and do not block CI. When the live gate runs, GitHub Actions uploads `content-quality-report` as an artifact containing the Markdown and JSON reports.

Admin e2e tests run with Supabase env vars explicitly blank and mock API responses inside Playwright. This keeps browser tests deterministic without requiring production staff accounts or service-role keys.

`web-build` runs `npm run web:build`, which builds both Next apps from the monorepo root using the same workspace scripts referenced by Vercel.

## Generated DB types

```bash
npm run db:gen-types
```

Writes `packages/shared/src/database.types.ts`. Import from `@reviewnatin/shared`:

```typescript
import type { Database, Tables } from '@reviewnatin/shared';
```

Re-run after every migration.

## Sentry (mobile)

Set in `apps/mobile/.env`:

```
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

Optional for EAS builds: `SENTRY_ORG`, `SENTRY_PROJECT` (upload source maps).

Initialized in `lib/monitoring/sentry-init.ts` — disabled in `__DEV__` and Expo Go.

## Admin app

- **Staff auth** — `/login` with Supabase email/password; `proxy.ts` checks `users.role` ∈ `admin`, `content_reviewer`, `content_author`
- **Import** — `/content/import` (CSV, staff-only)
- **Review** — `/content/review` (drafts + open reports)

Configure `apps/admin/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Promote staff: update `users.role` in Supabase for the account.

Local admin utilities:

```bash
npm run admin:create -- admin@example.com
npm run admin:reset-password -- admin@example.com
```

`admin:reset-password` prompts for the new password without echoing it in the terminal. Use it only for local/admin recovery with the service-role key.

## Marketing site

When `NEXT_PUBLIC_SUPABASE_*` is set, homepage loads **Announcements** and **Content changelog** from Supabase (`announcements`, `content_changelog` tables). Renders nothing extra if unconfigured.
