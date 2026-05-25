# App Store & production (P2)

Checklist for iOS TestFlight / App Store and deferred Android Play release.

## iOS (primary path)

| Item | Status in repo |
|------|----------------|
| Bundle ID `ph.reviewnatin.app` | `app.config.js` / `app.json` |
| Google OAuth iOS client + URL scheme | `app.config.js` + `npm run supabase:google` |
| Dev client + simulator build | `npm run mobile:ios:dev`, `npm run mobile:ios:build-sim` (local sim only uses `CODE_SIGNING_ALLOWED=NO`) |
| EAS project ID | Run `cd apps/mobile && npm run eas:init` — sets `extra.eas.projectId` (required for production push) |
| Production signing | `eas build --profile production` — **no** `CODE_SIGNING_ALLOWED=NO` (EAS manages certs) |
| `aps-environment: production` | Release/preview profiles in `app.config.js` via `EAS_BUILD_PROFILE` |
| `expo-dev-client` | Dev profiles only (`development`, `development-device`) |
| Sign in with Apple | `usesAppleSignIn` + entitlements in `app.config.js`; enable capability on App ID + provisioning profile in Apple Developer |
| Restore purchases | Settings + Subscribe screens → `lib/iap/store.ts` |
| Delete account | Settings → `delete_user_account` RPC |
| Privacy / Terms URLs | `https://reviewnatinph.com/privacy`, `/terms` |
| Exam disclaimers | In-app `/legal`, marketing `/disclaimers` |

### EAS commands

```bash
cd apps/mobile
npm run eas:init                    # once — links EAS project + projectId
npm run eas:build:ios:dev           # dev client on device
npm run eas:build:ios:preview       # internal / TestFlight candidate
npm run eas:build:ios:prod          # App Store production
```

After `eas:init`, commit the updated `app.json` `extra.eas.projectId`.

### Local simulator (unsigned)

`scripts/build-ios-simulator.mjs` intentionally uses `CODE_SIGNING_ALLOWED=NO` for **local Debug simulator builds only**. Do not use this for TestFlight or release — use EAS profiles above.

## Android (deferred — config ready)

| Item | Location |
|------|----------|
| `android.package` | `ph.reviewnatin.app` in `app.config.js` |
| Google Android OAuth + SHA-1 | `npm run supabase:android` (checklist script) |
| Play internal testing | `eas.json` → `submit.production.android.track: internal` |

```bash
npm run supabase:android            # SHA-1 checklist + env hints
cd apps/mobile && npm run eas:build:android:preview
```

## Legal (OAuth + stores)

- Privacy: [reviewnatinph.com/privacy](https://reviewnatinph.com/privacy) — required for Google OAuth consent screen
- Terms: [reviewnatinph.com/terms](https://reviewnatinph.com/terms)
- Disclaimers: in-app **Settings → Disclaimers & policies** and marketing `/disclaimers`

## Database

Apply account deletion RPC:

```bash
npm run db:push
```

## IAP follow-up (post–TestFlight)

Server receipt verification is implemented via the **`iap-verify`** Edge Function (`supabase/functions/iap-verify`). The mobile app calls it from `apps/mobile/lib/api/iap.ts` after StoreKit / Play Billing purchases.

Before accepting paid traffic:

1. Deploy `iap-verify` with Apple shared secret and Google Play service account credentials in Supabase Edge Function secrets.
2. Confirm sandbox vs production receipt handling matches your App Store Connect / Play Console setup.
3. Restore purchases (`Settings` + `Subscribe`) refreshes entitlements from Supabase after store reconciliation.

## Scheduled jobs (Dashboard)

| Job | Function | Auth |
|-----|----------|------|
| Push re-engage | `push-reengage` | `PUSH_CRON_SECRET` header |
| Readiness batch | `readiness-cron` | `READINESS_CRON_SECRET` or `PUSH_CRON_SECRET` |

Schedule both in Supabase Dashboard → Edge Functions → Cron (CLI `schedule` in `config.toml` is not supported on all CLI versions).
