import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAppTheme } from '../hooks/use-app-theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { trackMicrointeraction } from '../lib/analytics/events';
import { createPrimaryButtonStyles } from '../lib/themed-styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'accent' | 'outline' | 'white' | 'ghost' | 'success';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  size?: 'md' | 'lg';
  accessibilityLabel?: string;
};

export function PrimaryButton({
  label,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  size = 'md',
  style,
  disabled,
  accessibilityLabel,
  ...rest
}: Props) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createPrimaryButtonStyles(theme), [theme]);
  const height = size === 'lg' ? 56 : theme.touchTarget.min;
  const iconColor =
    variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : variant === 'white'
        ? theme.colors.primary
        : variant === 'accent'
          ? theme.colors.text
          : '#fff';

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          trackMicrointeraction(accessibilityLabel ?? label, { variant, size });
        }
      }}
      style={(state) => {
        const base: StyleProp<ViewStyle>[] = [
          styles.base,
          { minHeight: height },
          variant === 'primary' && styles.primary,
          variant === 'accent' && styles.accent,
          variant === 'outline' && styles.outline,
          variant === 'white' && styles.white,
          variant === 'ghost' && styles.ghost,
          variant === 'success' && styles.success,
          state.pressed && !reduceMotion && styles.pressed,
          state.pressed && reduceMotion && styles.pressedReducedMotion,
          disabled && styles.disabled,
        ];
        if (typeof style === 'function') return [...base, style(state)];
        return [...base, style];
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      <View style={styles.inner}>
        {icon && iconPosition === 'left' ? (
          <Ionicons name={icon} size={20} color={iconColor} style={styles.iconLeft} />
        ) : null}
        <Text
          style={[
            styles.text,
            size === 'lg' && styles.textLg,
            variant === 'outline' && styles.textOutline,
            variant === 'ghost' && styles.textOutline,
            variant === 'white' && styles.textWhite,
            variant === 'accent' && styles.textAccent,
          ]}
        >
          {label}
        </Text>
        {icon && iconPosition === 'right' ? (
          <Ionicons name={icon} size={20} color={iconColor} style={styles.iconRight} />
        ) : null}
      </View>
    </Pressable>
  );
}
