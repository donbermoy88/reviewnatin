import { getAdMobConfig } from './config';

let initialized = false;

/** Initialize Google Mobile Ads when unit IDs are configured (EAS / dev client builds). */
export async function initializeMobileAds(): Promise<void> {
  const config = getAdMobConfig();
  if (!config.enabled || initialized) return;

  try {
    const { default: mobileAds } = await import('react-native-google-mobile-ads');
    await mobileAds().initialize();
    initialized = true;
  } catch {
    /* Expo Go or builds without native module */
  }
}

export function isMobileAdsInitialized(): boolean {
  return initialized;
}
