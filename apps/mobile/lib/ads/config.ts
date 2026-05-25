/** AdMob unit IDs — set EXPO_PUBLIC_ADMOB_* in .env for production ads. */
export type AdMobConfig = {
  enabled: boolean;
  bannerUnitId: string | null;
  interstitialUnitId: string | null;
};

export function getAdMobConfig(): AdMobConfig {
  const bannerUnitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID?.trim() || null;
  const interstitialUnitId = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID?.trim() || null;

  return {
    enabled: !!(bannerUnitId || interstitialUnitId),
    bannerUnitId,
    interstitialUnitId,
  };
}
