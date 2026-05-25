import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../constants/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: number;
};

export function Card({ children, style, variant = 'default', padding = spacing.lg }: Props) {
  return (
    <View
      style={[
        styles.card,
        { padding },
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
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  flat: {
    borderWidth: 0,
    backgroundColor: colors.primaryMuted,
  },
});
