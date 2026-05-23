# Supabase setup

## 1. Create project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy **Project URL** and **anon public** key

## 2. Run migration

In **SQL Editor**, paste and run:

1. `migrations/001_mvp_schema.sql`
2. `seed/001_catalog.sql`

## 3. Enable Auth providers

Authentication → Providers:

- Email (enabled)
- Google (optional for Week 2)
- Apple (optional for iOS)

## 4. Configure apps

```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# apps/marketing/.env.local (if needed later)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 5. Row Level Security (Week 2)

Add RLS policies so users only read published questions and their own progress rows.
