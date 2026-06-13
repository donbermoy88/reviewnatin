/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;

const BUNDLE_ID = 'ph.reviewnatin.app';
const ANDROID_PACKAGE = 'ph.reviewnatin.app';

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
  const easProjectId =
    process.env.EAS_PROJECT_ID ?? base.extra?.eas?.projectId ?? undefined;

  // Native config (Sentry, AdMob) is injected at PREBUILD time from env. A
  // release build prebuilt without these silently ships with no crash
  // reporting and a misconfigured AdMob (missing GADApplicationIdentifier can
  // crash the Google Mobile Ads SDK on launch). Fail loudly instead of
  // shipping a broken store binary. Only enforced for store-bound profiles;
  // local `development` builds are unaffected.
  const isStoreBuild = buildProfile === 'production';

  if (isStoreBuild && (!urlIsSet(process.env.EXPO_PUBLIC_SUPABASE_URL) || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required for production builds.'
    );
  }

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

  const admobIos = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
  const admobAndroid = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  if (admobIos || admobAndroid || isStoreBuild) {
    if (!admobIos || !admobAndroid) {
      throw new Error(
        'AdMob is partially configured. Set BOTH EXPO_PUBLIC_ADMOB_IOS_APP_ID and ' +
          'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID for production, or neither for non-store builds — a missing GADApplicationIdentifier ' +
          'crashes the Google Mobile Ads SDK at launch.'
      );
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
  }

  return {
    expo: {
      ...base,
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

function urlIsSet(value) {
  return Boolean(value && !value.includes('YOUR_PROJECT') && !value.includes('placeholder'));
}
