import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

type Props = ScrollViewProps & {
  children: ReactNode;
  padded?: boolean;
  /** Extra bottom padding for screens inside the tab navigator */
  withTabBar?: boolean;
  /** Top inset when stack header is hidden (e.g. Home tab) */
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
  const tabBarHeight = useBottomTabBarHeight();

  const bottomPad = withTabBar
    ? tabBarHeight + spacing.lg
    : spacing.xl * 2 + insets.bottom;

  const topPad = safeTop ? insets.top + spacing.lg : spacing.lg;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        padded && styles.padded,
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
  scroll: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.lg },
});
