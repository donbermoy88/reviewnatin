# Supabase setup

## 1. Create project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy **Project URL** and **anon public** key

## 2. Run migrations

**Recommended (CLI):**

```bash
npm run supabase:login
npx supabase link --project-ref YOUR_REF
npm run db:push
```

Migrations live in `supabase/migrations/` (timestamped). Core schema starts at `20260523120000_mvp_schema.sql`.

**Manual (SQL Editor):** run each migration file in order, then catalog seed (step 3).

## 3. Catalog seed

**Canonical file:** `supabase/sql/catalog_seed.sql` (idempotent — safe to re-run)

| Environment | How to load |
|-------------|-------------|
| Local `supabase db reset` | Automatic via `supabase/seed/001_catalog.sql` |
| Hosted project | `DATABASE_URL=... npm run db:seed-catalog` or paste SQL in Editor |
| Exam types only (quick fix) | `npm run db:restore-catalog` |

> Migration `20260523120002_seed_catalog.sql` is a no-op kept for history. Do not duplicate catalog SQL elsewhere.

## 4. Enable Auth providers

Authentication → Providers:

- Email (enabled) — run `npm run supabase:auth`
- **Google** — run `npm run supabase:google` (see below)
- Apple (optional on iOS)

### Google Sign-In (mobile)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth consent screen (External)
2. Create **Web** OAuth client — add redirect URIs printed by `npm run supabase:google`
3. Create **iOS** OAuth client (bundle `host.exp.Exponent` for Expo Go)
4. Add to `.env.supabase`:
   ```
   GOOGLE_OAUTH_CLIENT_ID=....apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
   GOOGLE_OAUTH_IOS_CLIENT_ID=....apps.googleusercontent.com
   ```
5. Run `npm run supabase:google` — enables provider + writes `apps/mobile/.env`
6. Restart Expo


## 5. Configure apps

```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 6. Row Level Security

RLS policies are in migrations `20260523120001_auth_and_rls.sql` and `20260523120003_security_rls.sql`.
