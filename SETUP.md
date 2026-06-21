# ReviewNatin — Week 1 setup

## Quick start

```bash
cd /Users/lyndon/reviewnatin
npm install

# Marketing site (reviewnatinph.com)
npm run marketing
# → http://localhost:3000

# Mobile app (Expo SDK 56 — matches Expo Go from https://expo.dev/go)
npm run mobile
# → scan QR with Expo Go on your phone

# Mobile quality checks
npm run mobile:lint
npm run mobile:test

# Admin (dev)
npm run admin
# → http://localhost:3001 (if port 3000 taken by marketing)
```

## What was built (Week 1)

| Component | Path | Status |
|-----------|------|--------|
| Monorepo | `package.json` workspaces | Done |
| DB migrations | `supabase/migrations/20260523120000_mvp_schema.sql` (+ later timestamped files) | Run via `npm run db:push` |
| Catalog seed | `supabase/sql/catalog_seed.sql` | Local reset or `npm run db:seed-catalog` |
| Mobile app | `apps/mobile` | Expo Router, onboarding, dashboard shell |
| Marketing | `apps/marketing` | Landing at reviewnatinph.com branding |
| Admin | `apps/admin` | Setup checklist page |
| Shared types | `packages/shared` | Exam slugs, disclaimers |

## Supabase (required for live data)

Follow `supabase/README.md` — without this, mobile runs in local onboarding-only mode.

## Database scripts

| Command | Purpose |
|---------|---------|
| `npm run db:push` | Apply migrations to linked Supabase |
| `npm run db:seed-catalog` | Apply full catalog seed (`supabase/sql/catalog_seed.sql`) |
| `npm run db:restore-catalog` | Quick fix: exam categories + types only |
| `npm run db:seed-questions` | Demo practice questions per exam |

## Do not run `npm audit fix --force`

That command **breaks this repo**: it downgrades Next.js to v9 and upgrades Expo to SDK 56, which causes bundler crashes and Expo Go mismatch. Use `npm install` only. Moderate audit warnings in dev dependencies are expected and safe to ignore.

## Expo Go “incompatible version” on Android

**Expo Go and the project must use the same SDK.** They are often different depending on where you installed Expo Go:

| Where you installed Expo Go | SDK version |
|----------------------------|-------------|
| [expo.dev/go](https://expo.dev/go) (official site APK) | **56** (current) |
| Google Play Store | Often still **54** |

This repo’s mobile app uses **SDK 56** (matches Expo Go from expo.dev/go).

If you see “project uses SDK 54” but Expo Go is 56: run `git pull`, then `npm install` and `npm run mobile:clear`.

If you see “project uses SDK 56” but Expo Go is 54 (Play Store only): either install Expo Go from [expo.dev/go?sdkVersion=56](https://expo.dev/go?sdkVersion=56&platform=android&device=true), or install SDK 54 Expo Go from [expo.dev/go?sdkVersion=54](https://expo.dev/go?sdkVersion=54&platform=android&device=true) and ask us to pin the project to 54 again.

After any change: force-close Expo Go, reopen, scan a fresh QR code.

## Design system (mobile)

- Shared tokens: `packages/shared/src/tokens.ts`
- Fonts: Plus Jakarta Sans (mobile); Syne + DM Sans (marketing site)
- Components: `apps/mobile/components/`
- Run: `npm run mobile:clear`

## Week 2 (in progress — mobile app)

- [x] Email sign-up / sign-in (Supabase Auth)
- [x] Onboarding with optional account step
- [x] Practice quiz with EN + Taglish explanations
- [x] Quiz scores saved when logged in
- [x] Study tab — subject list from Supabase
- [x] Progress tab — recent sessions
- [x] Apple sign-in (iOS)
- [x] Google sign-in (code complete — needs OAuth client IDs: `npm run supabase:google`, `npm run supabase:android`)
- [ ] Admin CSV import UI
- [ ] PasaPath engine + readiness score
