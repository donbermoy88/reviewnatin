import { Platform } from 'react-native';

export type GoogleClientIds = {
  web?: string;
  ios?: string;
  android?: string;
};

export function getGoogleClientIds(): GoogleClientIds {
  return {
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
  };
}

export function getGoogleClientId(): string | undefined {
  const ids = getGoogleClientIds();
  if (Platform.OS === 'ios') return ids.ios ?? ids.web;
  if (Platform.OS === 'android') return ids.android ?? ids.web;
  return ids.web;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleClientIds().web);
}

/** Reversed Google iOS client ID → Info.plist URL scheme prefix */
export function getGoogleIosUrlScheme(iosClientId: string): string | null {
  if (!iosClientId.includes('.apps.googleusercontent.com')) return null;
  const prefix = iosClientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${prefix}`;
}
