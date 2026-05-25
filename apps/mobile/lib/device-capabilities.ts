import Constants from 'expo-constants';
import { requireNativeModule } from 'expo-modules-core';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

function readNativeIsDevice(): boolean | null {
  try {
    const mod = requireNativeModule('ExpoDevice') as { isDevice?: boolean };
    return typeof mod.isDevice === 'boolean' ? mod.isDevice : null;
  } catch {
    return null;
  }
}

function isIosSimulator(): boolean {
  if (Platform.OS !== 'ios') return false;

  const ios = Constants.platform?.ios as { simulator?: boolean } | undefined;
  if (ios?.simulator === true) return true;
  if (ios?.simulator === false) return false;

  const nativeIsDevice = readNativeIsDevice();
  if (nativeIsDevice === false) return true;

  if (Device.modelName?.includes('Simulator')) return true;
  if (!Device.isDevice) return true;

  return false;
}

/** Unsigned simulator builds lack keychain entitlements — use AsyncStorage instead of SecureStore. */
export function canUseSecureKeychain(): boolean {
  if (Platform.OS === 'web') return false;
  if (isIosSimulator()) return false;
  if (!Device.isDevice) return false;
  return true;
}

/** expo-notifications persists registration in Keychain — needs a signed physical device build. */
export function canUseExpoNotifications(): boolean {
  return canUseSecureKeychain();
}

/** Remote push — physical signed device only. */
export function canUseRemotePushNotifications(): boolean {
  return canUseExpoNotifications();
}

/** Local scheduled reminders — physical signed device only (same Keychain requirement). */
export function canUseLocalNotifications(): boolean {
  return canUseExpoNotifications();
}
