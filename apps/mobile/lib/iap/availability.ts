import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * react-native-iap (NitroModules) is only linked in production EAS builds.
 * Dev/simulator builds use demo entitlements — never import the native IAP module.
 */
export function canUseStorePurchases(): boolean {
  if (Platform.OS === 'web') return false;
  if (__DEV__) return false;
  if (!Device.isDevice) return false;
  return true;
}

/**
 * Android APK beta (sideload) uses web checkout until Play Console billing is live.
 * iOS production builds continue to use App Store billing as the primary path.
 */
export function preferWebCheckout(): boolean {
  return Platform.OS === 'android';
}
