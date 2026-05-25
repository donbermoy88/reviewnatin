import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'reviewnatin:pending_checkout_ref';

export async function savePendingCheckoutRef(referenceCode: string): Promise<void> {
  await AsyncStorage.setItem(KEY, referenceCode);
}

export async function getPendingCheckoutRef(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function clearPendingCheckoutRef(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
