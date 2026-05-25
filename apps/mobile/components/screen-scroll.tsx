import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/use-app-theme';

import { stackScrollPadding, TAB_BAR_BASE } from '../lib/layout/content-padding';

type Props = ScrollViewProps & {
  children: ReactNode;
  padded?: boolean;
  withTabBar?: boolean;
  safeTop?: boolean;
};

export function ScreenScroll({
  children,
  padded = true,
  withTabBar = false,
  safeTop = false,
  contentContainerStyle,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useAppTheme();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  const bottomPad = withTabBar
    ? TAB_BAR_BASE + bottomInset + spacing.lg
    : spacing.xl * 2 + insets.bottom;

  const topPad = safeTop ? insets.top + spacing.lg : spacing.lg;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        padded && { paddingHorizontal: spacing.lg },
        padded && { paddingTop: topPad, paddingBottom: bottomPad },
        contentContainerStyle,
      ]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});
