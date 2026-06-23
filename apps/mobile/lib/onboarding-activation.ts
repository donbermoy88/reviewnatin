import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVATION_KEY = 'reviewnatin:onboarding_activation_pending';
const PASAPATH_COACH_MARK_KEY = '@reviewnatin/coach_pasapath_v1';

/** Call when onboarding finishes — triggers first-run dashboard coach / activation UX. */
export async function markOnboardingActivationPending(): Promise<void> {
  await AsyncStorage.setItem(ACTIVATION_KEY, '1');
  await AsyncStorage.removeItem(PASAPATH_COACH_MARK_KEY).catch(() => {});
}

export async function isOnboardingActivationPending(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ACTIVATION_KEY)) === '1';
  } catch {
    return false;
  }
}

/** Read and clear the pending flag (once per onboarding completion). */
export async function consumeOnboardingActivationPending(): Promise<boolean> {
  try {
    const pending = (await AsyncStorage.getItem(ACTIVATION_KEY)) === '1';
    if (pending) await AsyncStorage.removeItem(ACTIVATION_KEY);
    return pending;
  } catch {
    return false;
  }
}
