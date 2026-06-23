import { describe, expect, it, vi, afterEach } from 'vitest';
import { getAdMobConfig } from './config';

describe('getAdMobConfig', () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it('is disabled when no unit IDs are set', () => {
    delete process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID;
    delete process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID;
    expect(getAdMobConfig().enabled).toBe(false);
  });

  it('enables ads when banner unit ID is set', () => {
    process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID = 'ca-app-pub-test/banner';
    delete process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID;
    const config = getAdMobConfig();
    expect(config.enabled).toBe(true);
    expect(config.bannerUnitId).toBe('ca-app-pub-test/banner');
    expect(config.interstitialUnitId).toBeNull();
  });
});
