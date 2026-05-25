# Engineering quality (P3)

## Tests

```bash
npm run test          # all mobile unit tests (vitest)
npm run mobile:test   # same
```

| Suite | Covers |
|-------|--------|
| `lib/auth/validation.test.ts` | Email/password validation |
| `lib/onboarding-nav.test.ts` | Entry routing, diagnostic redirect |
| `lib/api/goals.test.ts` | Goal merge + LET secondary rules |
| `lib/quiz-grading.test.ts` | Score % + answer grading (mirrors DB trigger) |

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- **lint-and-test** — ESLint (mobile, admin, marketing) + vitest
- **supabase** — local stack, `db reset`, `db lint --local`

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

- **Staff auth** — `/login` with Supabase email/password; middleware checks `users.role` ∈ `admin`, `content_reviewer`, `content_author`
- **Import** — `/content/import` (CSV, staff-only)
- **Review** — `/content/review` (drafts + open reports)

Configure `apps/admin/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Promote staff: update `users.role` in Supabase for the account.

## Marketing site

When `NEXT_PUBLIC_SUPABASE_*` is set, homepage loads **Announcements** and **Content changelog** from Supabase (`announcements`, `content_changelog` tables). Renders nothing extra if unconfigured.
