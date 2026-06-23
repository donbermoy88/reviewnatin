# Building ReviewNatin (iOS / Android)

**Android beta program:** Phase 0/1 checklists and ship gates live in
[`docs/android-beta-program-phase-0.md`](../../docs/android-beta-program-phase-0.md) and
[`docs/android-beta-program-phase-1.md`](../../docs/android-beta-program-phase-1.md).
From this app: `npm run beta:phase0:verify` · `npm run beta:phase1:verify` ·
`npm run beta:release-notes -- --build N --apk dist/beta/...`.

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

Before building the Android production AAB, run:

```bash
npm run release:check:android
```

This checks the Android package, AAB profile, Google Play product IDs, AdMob app
ID format, Sentry DSN, Supabase public env, and the Play service-account secret
required by `iap-verify`. It prints missing keys only, never secret values.

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

## Android beta builds (direct APK distribution)

For the 12-tester APK beta program (no Play Console yet), use the **`preview`**
profile. It produces an installable APK for internal distribution.

```bash
cd apps/mobile
npm run eas:build:android:preview
# or: eas build --profile preview --platform android
```

Before each beta release:

1. Bump `android.versionCode` in `app.json`.
2. Tag: `git tag beta-v1.0.X`.
3. Record SHA-256 from the EAS artifact in release notes.

**Preview profile env** (EAS dashboard → project → Environment variables →
`preview` profile, or local `.env` for dev client builds):

| Variable | Required | Notes |
|----------|----------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Backend API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `EXPO_PUBLIC_SENTRY_DSN` | Recommended | Crash reporting (optional — preview does not throw like production) |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` | Optional | Ads; Google test app ID OK for beta |
| `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | Phase 1+ | Signup CAPTCHA widget |

Unlike `production`, the `preview` profile does **not** fail prebuild when
Sentry or AdMob are unset — suitable for early beta drops while keys are
being configured.

**APK sideload limitations (12-tester beta):**

- **Google Play Billing / IAP** does not work — Premium testers use **web
  checkout** on the Subscribe screen.
- **FCM remote push** requires Play signing — only **local notification
  scheduling** works during direct APK distribution.
- Testers must enable **Install from unknown sources** for their browser or
  file manager.
- Always publish **SHA-256** checksum with each APK (`npm run beta:release-notes`).

Program SOP: [docs/android-beta-program-phase-0.md](../../docs/android-beta-program-phase-0.md) ·
[docs/android-beta-program.md](../../docs/android-beta-program.md).
