import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'flat' | 'premium';
  padding?: number;
  /** When provided, the card becomes tappable with subtle press feedback. */
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function Card({ children, style, variant = 'default', padding, onPress, accessibilityLabel, disabled }: Props) {
  const { colors, radii, shadows, spacing, motion } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const pad = padding ?? spacing.md;
  const isFlat = variant === 'flat';
  const isPremium = variant === 'premium';

  const baseStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: isFlat ? colors.primaryMuted : isPremium ? colors.primaryDark : colors.surface,
      borderRadius: radii.xl,
      borderWidth: isFlat ? 0 : 1,
      borderColor: isPremium ? 'rgba(255,255,255,0.14)' : colors.border,
      padding: pad,
    },
    (variant === 'elevated' || variant === 'premium') && shadows.card,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          baseStyle,
          disabled && { opacity: 0.6 },
          pressed && !disabled && (reduceMotion
            ? { opacity: 0.92 }
            : { opacity: 0.96, transform: [{ scale: motion.scale.cardPress }] }),
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}
