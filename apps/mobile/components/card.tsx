import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat' | 'premium';
  padding?: number;
};

export function Card({ children, style, variant = 'default', padding }: Props) {
  const { colors, radii, shadows, spacing } = useAppTheme();
  const pad = padding ?? spacing.md;
  const isFlat = variant === 'flat';
  const isPremium = variant === 'premium';

  return (
    <View
      style={[
        {
          backgroundColor: isFlat ? colors.primaryMuted : isPremium ? colors.primaryDark : colors.surface,
          borderRadius: radii.xl,
          borderWidth: isFlat ? 0 : 1,
          borderColor: isPremium ? 'rgba(255,255,255,0.14)' : colors.border,
          padding: pad,
        },
        (variant === 'elevated' || variant === 'premium') && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
