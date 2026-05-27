import { Platform, type ViewStyle } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** Must match TAB_BAR_BASE in app/(tabs)/_layout.tsx and components/screen-scroll.tsx */
export const TAB_BAR_BASE = 52;

function bottomInset(insets: EdgeInsets): number {
  return Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
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
