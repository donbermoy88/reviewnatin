# Supabase setup (zero knowledge)

ReviewNatin uses **Supabase** for database, login, and API. You only sign in **once**; a script does the rest.

## Automatic setup (recommended)

```bash
cd /Users/lyndon/reviewnatin
npm run supabase:setup
```

What happens:

1. Opens Supabase in your browser — **sign in** (GitHub or email).
2. You **generate an access token** and paste it into `.env.supabase` (file is created for you).
3. Script detects the saved file and continues automatically.
4. Creates project `reviewnatin` (Singapore region).
4. Creates all database tables.
5. Seeds CSE, LET, PNLE exam catalog + demo question.
6. Writes `apps/mobile/.env` and `apps/marketing/.env.local` for you.

Takes about **2–3 minutes** after you sign in.

## If the script stops at "No token yet"

1. Open https://supabase.com/dashboard/account/tokens
2. **Generate new token** → copy it
3. Edit `.env.supabase` in the project root (replace `sbp_paste_here`) and **Save**
4. Run `npm run supabase:setup` again (or leave it running — it picks up the file within a few seconds)

**Alternative:** In Mac Terminal, run `supabase login`, then `npm run supabase:setup`.

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
