import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = ScrollViewProps & {
  children: ReactNode;
  padded?: boolean;
};

export function ScreenScroll({ children, padded = true, contentContainerStyle, ...rest }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[padded && styles.padded, contentContainerStyle]}
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
  padded: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
});
