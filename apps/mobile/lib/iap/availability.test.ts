/* eslint-disable import/first */
import { describe, expect, it, vi } from 'vitest';

const platformState = vi.hoisted(() => ({ os: 'android', isDevice: true }));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platformState.os;
    },
  },
}));

vi.mock('expo-device', () => ({
  get isDevice() {
    return platformState.isDevice;
  },
}));

import { canUseStorePurchases } from './availability';

describe('iap availability', () => {
  it('enables store purchases on production Android device builds', () => {
    vi.stubGlobal('__DEV__', false);
    platformState.os = 'android';
    platformState.isDevice = true;
    expect(canUseStorePurchases()).toBe(true);
  });

  it('enables store purchases on production iOS device builds', () => {
    vi.stubGlobal('__DEV__', false);
    platformState.os = 'ios';
    platformState.isDevice = true;
    expect(canUseStorePurchases()).toBe(true);
  });

  it('disables store purchases in dev builds', () => {
    vi.stubGlobal('__DEV__', true);
    platformState.os = 'android';
    platformState.isDevice = true;
    expect(canUseStorePurchases()).toBe(false);
  });

  it('disables store purchases on web', () => {
    vi.stubGlobal('__DEV__', false);
    platformState.os = 'web';
    expect(canUseStorePurchases()).toBe(false);
  });

  it('disables store purchases on simulators', () => {
    vi.stubGlobal('__DEV__', false);
    platformState.os = 'android';
    platformState.isDevice = false;
    expect(canUseStorePurchases()).toBe(false);
  });
});
