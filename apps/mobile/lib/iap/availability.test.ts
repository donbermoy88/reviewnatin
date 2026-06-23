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
  isDevice: platformState.isDevice,
}));

import { canUseStorePurchases, preferWebCheckout } from './availability';

describe('iap availability', () => {
  it('prefers web checkout on Android APK beta', () => {
    platformState.os = 'android';
    expect(preferWebCheckout()).toBe(true);
  });

  it('does not prefer web checkout on iOS', () => {
    platformState.os = 'ios';
    expect(preferWebCheckout()).toBe(false);
  });

  it('disables store purchases on web', () => {
    platformState.os = 'web';
    expect(canUseStorePurchases()).toBe(false);
  });
});
