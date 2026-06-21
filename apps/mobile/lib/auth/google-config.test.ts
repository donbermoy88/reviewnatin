import { afterEach, describe, expect, it, vi } from 'vitest';

let platformOS = 'android';

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platformOS;
    },
  },
}));

vi.mock('../public-env', () => ({
  getPublicEnv: (processKey: string) => process.env[processKey]?.trim() ?? '',
}));

async function loadModule() {
  vi.resetModules();
  return import('./google-config');
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  delete process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
});

describe('isGoogleSignInConfigured on Android', () => {
  it('is false when only the Web client id is set (no fallback on Android)', async () => {
    platformOS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-id.apps.googleusercontent.com';
    const { isGoogleSignInConfigured } = await loadModule();
    expect(isGoogleSignInConfigured()).toBe(false);
  });

  it('is true once an Android client id is set', async () => {
    platformOS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-id.apps.googleusercontent.com';
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = 'android-id.apps.googleusercontent.com';
    const { isGoogleSignInConfigured } = await loadModule();
    expect(isGoogleSignInConfigured()).toBe(true);
  });
});

describe('isGoogleSignInConfigured on iOS', () => {
  it('falls back to the Web client id when no iOS client id is set', async () => {
    platformOS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-id.apps.googleusercontent.com';
    const { isGoogleSignInConfigured } = await loadModule();
    expect(isGoogleSignInConfigured()).toBe(true);
  });
});

describe('getGoogleClientId', () => {
  it('prefers the Android id over the Web id on Android', async () => {
    platformOS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-id.apps.googleusercontent.com';
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = 'android-id.apps.googleusercontent.com';
    const { getGoogleClientId } = await loadModule();
    expect(getGoogleClientId()).toBe('android-id.apps.googleusercontent.com');
  });

  it('prefers the iOS id over the Web id on iOS', async () => {
    platformOS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-id.apps.googleusercontent.com';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'ios-id.apps.googleusercontent.com';
    const { getGoogleClientId } = await loadModule();
    expect(getGoogleClientId()).toBe('ios-id.apps.googleusercontent.com');
  });
});

describe('getGoogleIosUrlScheme', () => {
  it('reverses a Google client id into the Info.plist URL scheme', async () => {
    const { getGoogleIosUrlScheme } = await loadModule();
    expect(getGoogleIosUrlScheme('12345-abc.apps.googleusercontent.com')).toBe(
      'com.googleusercontent.apps.12345-abc'
    );
  });

  it('returns null for non-Google client ids', async () => {
    const { getGoogleIosUrlScheme } = await loadModule();
    expect(getGoogleIosUrlScheme('not-a-google-client-id')).toBeNull();
  });
});
