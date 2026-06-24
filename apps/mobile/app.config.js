/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;
const fs = require('fs');

const BUNDLE_ID = 'ph.reviewnatin.app';
const ANDROID_PACKAGE = 'ph.reviewnatin.app';

/**
 * FCM credentials for remote push. Prefer an explicit env path (CI/EAS secret
 * file), else fall back to a committed-out local file if present. Only set when
 * the file actually exists so prebuild never fails on a missing path.
 */
function resolveGoogleServicesFile() {
  const fromEnv = process.env.GOOGLE_SERVICES_JSON;
  const candidate = fromEnv || './google-services.json';
  try {
    return fs.existsSync(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

/** EAS_BUILD_PROFILE is set automatically on EAS Build; APP_VARIANT mirrors it locally. */
const buildProfile = process.env.EAS_BUILD_PROFILE ?? process.env.APP_VARIANT ?? 'development';
const isDevClient = buildProfile === 'development' || buildProfile === 'development-device';
const isProductionPush = buildProfile === 'production' || buildProfile === 'preview';

/** Google iOS OAuth requires this URL scheme in Info.plist (reversed client ID). */
function googleIosUrlScheme(clientId) {
  if (!clientId?.includes('.apps.googleusercontent.com')) return null;
  const prefix = clientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${prefix}`;
}

module.exports = () => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const googleScheme = googleIosUrlScheme(iosClientId);
  const urlSchemes = ['reviewnatin', googleScheme].filter(Boolean);
  const publicAuthExtra = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: iosClientId,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  };
  const easProjectId =
    process.env.EAS_PROJECT_ID ?? base.extra?.eas?.projectId ?? undefined;
  const googleServicesFile = resolveGoogleServicesFile();

  // Native config (Sentry, AdMob) is injected at PREBUILD time from env. A
  // release build prebuilt without these silently ships with no crash
  // reporting and a misconfigured AdMob (missing GADApplicationIdentifier can
  // crash the Google Mobile Ads SDK on launch). Fail loudly instead of
  // shipping a broken store binary. Only enforced for store-bound profiles;
  // local `development` builds are unaffected.
  const isStoreBuild = buildProfile === 'production';

  const plugins = [...(base.plugins ?? [])];
  if (isDevClient) {
    plugins.push('expo-dev-client');
  }

  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    plugins.push([
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ]);
  } else if (isStoreBuild) {
    throw new Error(
      'EXPO_PUBLIC_SENTRY_DSN is required for production builds (crash reporting). ' +
        'Set it in the EAS build profile env before prebuild.'
    );
  }

  // react-native-google-mobile-ads is always autolinked, and its
  // MobileAdsInitProvider crashes the app at process start if the manifest has
  // no GADApplicationIdentifier / com.google.android.gms.ads.APPLICATION_ID. So
  // we ALWAYS inject the plugin with a valid app ID. Production must supply the
  // REAL ids (test ids would serve test ads / violate AdMob policy); non-store
  // builds fall back to Google's official public TEST app ids so no dev/preview
  // build can ever crash on launch. (Ad *unit* ids are separate — ads stay off
  // until EXPO_PUBLIC_ADMOB_*_UNIT_ID are set; see lib/ads/config.ts.)
  const ADMOB_TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
  const ADMOB_TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
  let admobAndroid = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  let admobIos = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
  if (isStoreBuild) {
    if (!admobAndroid || !admobIos) {
      throw new Error(
        'Both EXPO_PUBLIC_ADMOB_ANDROID_APP_ID and EXPO_PUBLIC_ADMOB_IOS_APP_ID are ' +
          'required for production builds. Set your REAL AdMob app ids in the EAS ' +
          'production profile env — test ids must never ship to the store.'
      );
    }
  } else {
    admobAndroid = admobAndroid || ADMOB_TEST_ANDROID_APP_ID;
    admobIos = admobIos || ADMOB_TEST_IOS_APP_ID;
  }
  plugins.push([
    'react-native-google-mobile-ads',
    {
      androidAppId: admobAndroid,
      iosAppId: admobIos,
      // Required by Apple when the App Tracking Transparency prompt may show.
      userTrackingUsageDescription:
        'This identifier is used to deliver and measure relevant ads. You can keep using ReviewNatin without allowing tracking.',
    },
  ]);

  return {
    expo: {
      ...base,
      scheme: ['reviewnatin', ANDROID_PACKAGE],
      ios: {
        ...base.ios,
        bundleIdentifier: BUNDLE_ID,
        buildNumber: base.ios?.buildNumber ?? '1',
        associatedDomains: ['applinks:reviewnatinph.com', 'applinks:www.reviewnatinph.com'],
        infoPlist: {
          ...(base.ios?.infoPlist ?? {}),
          CFBundleURLTypes: [{ CFBundleURLSchemes: urlSchemes }],
          ITSAppUsesNonExemptEncryption: false,
          UIBackgroundModes: ['fetch', 'remote-notification'],
        },
        entitlements: {
          'aps-environment': isProductionPush ? 'production' : 'development',
          'com.apple.developer.applesignin': ['Default'],
          'keychain-access-groups': [`$(AppIdentifierPrefix)${BUNDLE_ID}`],
        },
      },
      android: {
        ...base.android,
        package: ANDROID_PACKAGE,
        ...(googleServicesFile ? { googleServicesFile } : {}),
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              { scheme: 'https', host: 'reviewnatinph.com', pathPrefix: '/' },
              { scheme: 'https', host: 'www.reviewnatinph.com', pathPrefix: '/' },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
      },
      extra: {
        ...(base.extra ?? {}),
        ...publicAuthExtra,
        eas: {
          ...(base.extra?.eas ?? {}),
          ...(easProjectId ? { projectId: easProjectId } : {}),
        },
        appVariant: buildProfile,
      },
      plugins,
    },
  };
};
