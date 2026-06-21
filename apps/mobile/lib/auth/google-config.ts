import { Platform } from 'react-native';
import { getPublicEnv } from '../public-env';

export type GoogleClientIds = {
  web?: string;
  ios?: string;
  android?: string;
};

export function getGoogleClientIds(): GoogleClientIds {
  return {
    web: getPublicEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'googleWebClientId') || undefined,
    ios: getPublicEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'googleIosClientId') || undefined,
    android: getPublicEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'googleAndroidClientId') || undefined,
  };
}

export function getGoogleClientId(): string | undefined {
  const ids = getGoogleClientIds();
  if (Platform.OS === 'ios') return ids.ios ?? ids.web;
  if (Platform.OS === 'android') return ids.android ?? ids.web;
  return ids.web;
}

/** Whether Google Sign-In has a usable client ID for the current platform. */
export function isGoogleSignInConfigured(): boolean {
  const ids = getGoogleClientIds();
  if (Platform.OS === 'android') return Boolean(ids.android);
  return Boolean(ids.web);
}

/** Reversed Google iOS client ID → Info.plist URL scheme prefix */
export function getGoogleIosUrlScheme(iosClientId: string): string | null {
  if (!iosClientId.includes('.apps.googleusercontent.com')) return null;
  const prefix = iosClientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${prefix}`;
}
