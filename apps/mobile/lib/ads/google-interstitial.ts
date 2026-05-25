import { getAdMobConfig } from './config';

type GoogleAdsModule = typeof import('react-native-google-mobile-ads');

async function loadGoogleAds(): Promise<GoogleAdsModule | null> {
  try {
    return await import('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

/** Load and show a Google interstitial; resolves true if an ad was shown and closed. */
export async function showGoogleInterstitial(): Promise<boolean> {
  const config = getAdMobConfig();
  if (!config.interstitialUnitId) return false;

  const ads = await loadGoogleAds();
  if (!ads) return false;

  const { InterstitialAd, AdEventType } = ads;

  return new Promise((resolve) => {
    const ad = InterstitialAd.createForAdRequest(config.interstitialUnitId!);
    let settled = false;

    const finish = (shown: boolean) => {
      if (settled) return;
      settled = true;
      unsubLoaded();
      unsubClosed();
      unsubError();
      resolve(shown);
    };

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show().catch(() => finish(false));
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));

    ad.load();

    setTimeout(() => finish(false), 12_000);
  });
}
