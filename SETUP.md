# ReviewNatin — Week 1 setup

## Quick start

```bash
cd /Users/lyndon/reviewnatin
npm install

# Marketing site (reviewnatinph.com)
npm run marketing
# → http://localhost:3000

# Mobile app (Expo SDK 54 — matches Play Store Expo Go)
npm run mobile
# → scan QR with Expo Go on your phone

# Admin (dev)
npm run admin
# → http://localhost:3001 (if port 3000 taken by marketing)
```

## What was built (Week 1)

| Component | Path | Status |
|-----------|------|--------|
| Monorepo | `package.json` workspaces | Done |
| DB migration | `supabase/migrations/001_mvp_schema.sql` | Ready to run |
| Catalog seed | `supabase/seed/001_catalog.sql` | Ready to run |
| Mobile app | `apps/mobile` | Expo Router, onboarding, dashboard shell |
| Marketing | `apps/marketing` | Landing at reviewnatinph.com branding |
| Admin | `apps/admin` | Setup checklist page |
| Shared types | `packages/shared` | Exam slugs, disclaimers |

## Supabase (required for live data)

Follow `supabase/README.md` — without this, mobile runs in local onboarding-only mode.

## Expo Go on Android shows “incompatible version”?

The Play Store **Expo Go** app is still on **SDK 54**. This project was on SDK 56 (too new), which causes that blue error even with the latest Play Store update.

**Fix (already applied in repo):** mobile uses Expo SDK 54. After pulling changes:

```bash
cd /Users/lyndon/reviewnatin
npm install
npm run mobile -- --clear
```

Then on your phone: force-close Expo Go, reopen, scan the QR code again.

**Alternative:** keep SDK 56 and install matching Expo Go from https://expo.dev/go (Android APK), not the Play Store.

## Week 2 preview

- Auth (Supabase email/Google)
- Practice quiz loop
- Admin CSV import UI
- Connect dashboard to real readiness API
