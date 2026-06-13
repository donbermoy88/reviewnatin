# Building ReviewNatin (iOS / Android)

## Native project ownership

This repo currently includes an iOS project under `ios/` so simulator and native
module QA can run locally. Treat `app.json` + `app.config.js` as the source of
truth for generated native settings, and only hand-edit `ios/` when the change is
intentionally native-only and reviewed as native code.

When native config drifts from Expo config, regenerate instead of debugging a
stale artifact:

```bash
npx expo prebuild --clean
```

An older prebuild can be **stale** (for example missing IAP / AdMob / view-shot /
Sentry pods if it was generated before those were added). If a native module
"isn't linked," run `expo prebuild --clean && pod install` on a review branch, then
commit the resulting native diff intentionally.

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

## iOS submission credentials (no iPhone or Mac required)

You do **not** need an iPhone to set up signing or submit. EAS builds and signs
in the cloud; submission is API-driven. You only need an **Apple Developer
Program** membership (~$99/year). An iPhone is only needed later to *verify*
IAP / push / live ads on hardware (any iPhone via TestFlight works — App Store
reviewers use their own devices).

`eas.json` is configured for the modern **App Store Connect API key** method
(non-interactive, no per-submit Apple ID login):

```jsonc
"submit": { "production": { "ios": {
  "ascAppId": "ASC_APP_ID_HERE",                  // App Store Connect → your app → App Information → "Apple ID" (numeric)
  "ascApiKeyPath": "./credentials/AuthKey.p8",    // downloaded key file (gitignored)
  "ascApiKeyId": "ASC_API_KEY_ID_HERE",           // the Key ID shown next to the key
  "ascApiKeyIssuerId": "ASC_API_KEY_ISSUER_ID_HERE" // Users and Access → Integrations → Issuer ID
}}}
```

One-time setup:

1. Enroll at https://developer.apple.com/programme (gives your **Team ID**).
2. App Store Connect → **Users and Access → Integrations → App Store Connect API**
   → generate a key with **App Manager** role → download the `.p8` **once** →
   put it at `apps/mobile/credentials/AuthKey.p8` (the `credentials/` dir is
   gitignored; never commit the key).
3. Create the app record (App Store Connect → **Apps → +**) to get the numeric
   `ascAppId`.
4. Fill the three `ASC_*` placeholders in `eas.json`.
5. Build + submit entirely in the cloud:

   ```bash
   eas build --profile production --platform ios
   eas submit --profile production --platform ios
   ```

EAS manages the signing certificate and provisioning profile automatically
(`eas credentials` to inspect). Nothing here touches a physical device.

Prefer EAS to hold the key instead of a local file? Store it as an EAS secret
and drop `ascApiKeyPath` — `eas submit` will use the secret.
