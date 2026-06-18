import AsyncStorage from '@react-native-async-storage/async-storage';
import { canUseSecureKeychain } from './device-capabilities';
import { addAppBreadcrumb } from './monitoring/events';
import { StorageKeyPrefix } from './storage-keys';

const prefix = StorageKeyPrefix.secure;

// On a device that should support the keychain, a SecureStore failure silently
// downgrades sensitive values to plain AsyncStorage. Surface it once so the
// downgrade is visible in crash breadcrumbs instead of being invisible.
let downgradeLogged = false;
function noteKeychainDowngrade(op: string, error: unknown): void {
  if (downgradeLogged) return;
  downgradeLogged = true;
  addAppBreadcrumb(
    'secure_storage',
    'SecureStore unavailable — falling back to AsyncStorage',
    { op, reason: error instanceof Error ? error.message : String(error) },
    'warning'
  );
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (canUseSecureKeychain()) {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      noteKeychainDowngrade('get', error);
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
    } catch (error) {
      noteKeychainDowngrade('set', error);
    }
  }
  await AsyncStorage.setItem(`${prefix}${key}`, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (canUseSecureKeychain()) {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      noteKeychainDowngrade('delete', error);
    }
  }
  await AsyncStorage.removeItem(`${prefix}${key}`);
}
