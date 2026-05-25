import AsyncStorage from '@react-native-async-storage/async-storage';
import { canUseSecureKeychain } from './device-capabilities';

const prefix = 'reviewnatin:secure:';

export async function getSecureItem(key: string): Promise<string | null> {
  if (canUseSecureKeychain()) {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch {
      /* fall back to AsyncStorage */
    }
  }
  return AsyncStorage.getItem(`${prefix}${key}`);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (canUseSecureKeychain()) {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      /* fall back */
    }
  }
  await AsyncStorage.setItem(`${prefix}${key}`, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (canUseSecureKeychain()) {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* fall back */
    }
  }
  await AsyncStorage.removeItem(`${prefix}${key}`);
}
