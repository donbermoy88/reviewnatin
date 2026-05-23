# Supabase setup (zero knowledge)

ReviewNatin uses **Supabase** for database, login, and API. You only sign in **once**; a script does the rest.

## Automatic setup (recommended)

```bash
cd /Users/lyndon/reviewnatin
npm run supabase:setup
```

What happens:

1. Opens Supabase in your browser — **sign in** (GitHub or email).
2. Waits for login to finish.
3. Creates project `reviewnatin` (Singapore region).
4. Creates all database tables.
5. Seeds CSE, LET, PNLE exam catalog + demo question.
6. Writes `apps/mobile/.env` and `apps/marketing/.env.local` for you.

Takes about **2–3 minutes** after you sign in.

## If the script stops at "Missing token"

**Option A — CLI login**

```bash
supabase login
```

Complete sign-in in the browser, then:

```bash
npm run supabase:setup
```

**Option B — Manual token**

1. Open https://supabase.com/dashboard/account/tokens
2. Click **Generate new token** → copy it
3. Create file `.env.supabase` in project root:

```
SUPABASE_ACCESS_TOKEN=sbp_paste_your_token_here
```

4. Run `npm run supabase:setup` again

## After setup

```bash
npm run mobile    # Expo app (uses Supabase from .env)
npm run marketing # Website
```

In Supabase Dashboard → **Authentication** → **Providers** → turn **Email** ON.

## Files created

| File | Purpose |
|------|---------|
| `.env.supabase` | Your secrets (gitignored) |
| `apps/mobile/.env` | App connection |
| `apps/marketing/.env.local` | Web connection |

## Dashboard links

- Project: https://supabase.com/dashboard/projects
- SQL Editor: run extra queries manually if needed
- Table Editor: view `exam_types`, `questions`, etc.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `db push` fails | Check project finished provisioning; wait 2 min and retry |
| App says "Not configured" | Restart Expo after `.env` was created |
| Seed duplicate errors | Normal if you run seed twice; ignore or use fresh project |
