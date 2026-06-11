# Building ReviewNatin (iOS / Android)

## Native projects are NOT committed (Expo Continuous Native Generation)

`ios/` and `android/` are gitignored (`.gitignore`). They are **generated**, not
authored — the source of truth is `app.json` + `app.config.js`. Never hand-edit a
file under `ios/`/`android/` and expect it to survive; regenerate instead:

```bash
npx expo prebuild --clean
```

A local `ios/` left over from an older prebuild can be **stale** (e.g. missing the
IAP / AdMob / view-shot / Sentry pods if it was generated before those were added).
If a native module "isn't linked," run `expo prebuild --clean && pod install` (or
let EAS do it) rather than debugging the old artifact.

## Prebuild env contract (enforced)

Several native integrations are injected at **prebuild time** from environment
variables. `app.config.js` now **fails the build** when a `production` build is
missing required values, so a release binary can never silently ship without crash
reporting or with a half-configured AdMob (a missing `GADApplicationIdentifier`
crashes the Google Mobile Ads SDK at launch).

Required for `production`:

| Variable | Purpose | Enforcement |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Backend | runtime (`isSupabaseConfigured`) |
| `EXPO_PUBLIC_SENTRY_DSN` | Crash reporting | **prebuild throws if missing** |
| `EXPO_PUBLIC_ADMOB_IOS_APP_ID` + `_ANDROID_APP_ID` | Ads | **prebuild throws if only one is set** |

AdMob, when enabled, also injects `SKAdNetworkItems` and the App Tracking
Transparency usage string (`userTrackingUsageDescription`) via the
`react-native-google-mobile-ads` config plugin. Set these in the EAS build
profile `env` block before building.

## Profiles (`eas.json`)

- `development` / `development-device` — dev client, demo entitlements, no store billing.
- `preview` — internal distribution, production push.
- `production` — store submission; `autoIncrement` bumps the iOS build number.

In-app purchases, restore, push registration, and real ads only work in
store-signed builds (TestFlight / App Store) on a physical device — they are
disabled in dev/simulator by design (`lib/iap/availability.ts`,
`lib/device-capabilities.ts`).
