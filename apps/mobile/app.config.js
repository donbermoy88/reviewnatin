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
  }

  if (process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID && process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID) {
    plugins.push([
      'react-native-google-mobile-ads',
      {
        androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
        iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
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
