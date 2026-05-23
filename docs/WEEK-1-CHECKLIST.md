# Week 1 checklist

Week 1 goal: **foundation** — repo, backend, scaffolds, app runs on your phone. Not a full product yet.

## Done (no action needed)

- [x] Product specs in `docs/`
- [x] Monorepo (`apps/mobile`, `marketing`, `admin`, `packages/shared`)
- [x] Supabase project + database schema + exam catalog seed
- [x] Mobile app runs in Expo Go (SDK 56 from expo.dev/go)
- [x] Onboarding, dashboard shell, tabs
- [x] Marketing landing (local): `npm run marketing`
- [x] Admin checklist page (local): `npm run admin`
- [x] Cursor rules for design + skills (`.cursor/rules/`)

**Bonus already started:** Week 2 mobile features (email auth, practice quiz) — that is ahead of schedule.

---

## Your Week 1 to-do (manual, ~30–60 min)

Do these once if you have not already:

### 1. Supabase Dashboard (5 min)

1. Open [Supabase project](https://supabase.com/dashboard/project/yohewfdafdmwntsbzgxx)
2. **Authentication → Providers → Email** → enable
3. (Optional) Turn off “Confirm email” for faster dev testing

### 2. Security (5 min)

- Regenerate your Supabase **access token** if you ever pasted it in chat
- Keep secrets only in `.env.supabase` (never commit)

### 3. Deploy marketing site (30 min) — optional but “Week 1 complete” for web

1. Push repo to GitHub (if not yet)
2. Connect `apps/marketing` to Vercel or Cloudflare Pages
3. Point **reviewnatinph.com** DNS to the deployment
4. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`

### 4. Daily dev commands

```bash
cd /Users/lyndon/reviewnatin
npm install          # never: npm audit fix --force
npm run mobile:clear # phone: Expo Go from expo.dev/go
npm run marketing    # browser: localhost:3000
```

### 5. Do **not** block Week 1 on

- Hundreds of questions (content sprint later)
- Google/Apple login (Week 2)
- App Store submission
- `admin.reviewnatinph.com` DNS (Week 2+)

---

## When is Week 1 “closed”?

You can call Week 1 **done** when:

1. App opens on your phone via Expo Go  
2. Supabase Email auth works (sign up in app → Settings shows your email)  
3. *(Optional)* reviewnatinph.com shows the landing page  

Then focus Week 2 on: more questions, admin CSV import, PasaPath logic, readiness score.
