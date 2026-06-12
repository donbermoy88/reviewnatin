import AsyncStorage from '@react-native-async-storage/async-storage';
import { showGoogleInterstitial } from './google-interstitial';

const INTERSTITIAL_KEY = 'reviewnatin:last-interstitial';
const COOLDOWN_MS = 30 * 60 * 1000;

export type SessionInterstitialOutcome = 'shown' | 'fallback' | 'skipped';

export async function shouldShowSessionInterstitial(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(INTERSTITIAL_KEY);
    if (!raw) return true;
    const last = Number(raw);
    return Number.isFinite(last) && Date.now() - last >= COOLDOWN_MS;
  } catch {
    return false;
  }
}

export async function markSessionInterstitialShown(): Promise<void> {
  await AsyncStorage.setItem(INTERSTITIAL_KEY, String(Date.now()));
}

/** Try Google interstitial first; fall back to in-app promo modal when ads are off or fail. */
export async function tryShowSessionInterstitial(
  isPremium: boolean,
  duringQuiz: boolean
): Promise<SessionInterstitialOutcome> {
  if (isPremium || duringQuiz) return 'skipped';
  if (!(await shouldShowSessionInterstitial())) return 'skipped';

  await markSessionInterstitialShown();

  const googleShown = await showGoogleInterstitial();
  if (googleShown) return 'shown';

  return 'fallback';
}
