import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../constants/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat';
};

export function Card({ children, style, variant = 'default' }: Props) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && shadows.card,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    borderWidth: 0,
    backgroundColor: colors.primaryMuted,
  },
});
