import { Platform, type ViewStyle } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** Tab bar content area (icon + label + vertical padding), excluding device safe-area
 *  inset. Single source of truth — used by app/(tabs)/_layout.tsx,
 *  components/screen-scroll.tsx, and the helpers below. Sized to fit a 30px iconWrap
 *  + 14px label + vertical padding = 60, rounded up to 68 for comfortable slack on
 *  devices with larger system fonts or nav-bar variations. */
export const TAB_BAR_BASE = 68;

function bottomInset(insets: EdgeInsets): number {
  // Reserve at least 12px on Android even when the system reports 0 — covers
  // 3-button nav bar overlap and gesture indicators on devices that
  // under-report bottom inset.
  return Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);
}

/** Scroll content padding for screens inside the tab navigator */
export function tabScrollPadding(insets: EdgeInsets, extra = 64): ViewStyle {
  return { paddingBottom: TAB_BAR_BASE + bottomInset(insets) + extra };
}

/** Tab screens with a fixed footer CTA above the tab bar */
export function tabScrollPaddingWithFooter(insets: EdgeInsets): ViewStyle {
  // 88 extra to clear the button (56px) + gradient fade area above it
  return { paddingBottom: TAB_BAR_BASE + bottomInset(insets) + 88 };
}

/** Stack / modal screens without tab bar */
export function stackScrollPadding(insets: EdgeInsets, spacingXl = 32): ViewStyle {
  return { paddingBottom: insets.bottom + spacingXl };
}
