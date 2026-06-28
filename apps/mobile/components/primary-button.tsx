import * as Haptics from 'expo-haptics';
import { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAppTheme } from '../hooks/use-app-theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { trackMicrointeraction } from '../lib/analytics/events';
import { createPrimaryButtonStyles } from '../lib/themed-styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Variant = 'primary' | 'accent' | 'outline' | 'white' | 'ghost' | 'success' | 'danger' | 'premium';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  size?: 'md' | 'lg';
  /** Shows a spinner, swaps the label for `loadingLabel`, and blocks presses. */
  loading?: boolean;
  loadingLabel?: string;
  /**
   * Guard against accidental double-taps on important actions. The press is
   * ignored if it lands within `motion.doubleTapGuard` ms of the previous one.
   * Defaults to `true` — pass `false` for rapid-fire controls (e.g. steppers).
   */
  preventDoubleTap?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({
  label,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  size = 'md',
  loading = false,
  loadingLabel,
  preventDoubleTap = true,
  style,
  disabled,
  onPress,
  accessibilityLabel,
  ...rest
}: Props) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createPrimaryButtonStyles(theme), [theme]);
  const lastPressRef = useRef(0);
  const height = size === 'lg' ? 56 : theme.touchTarget.min;
  const isBlocked = !!disabled || loading;
  const iconColor =
    variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : variant === 'white'
        ? theme.colors.primary
        : variant === 'premium'
          ? theme.colors.primaryDark
          : variant === 'accent'
            ? theme.colors.text
            : '#fff';

  const handlePress = (event: GestureResponderEvent) => {
    if (isBlocked) return;
    if (preventDoubleTap) {
      const now = Date.now();
      if (now - lastPressRef.current < theme.motion.doubleTapGuard) return;
      lastPressRef.current = now;
    }
    onPress?.(event);
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => {
        if (!isBlocked) {
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
          variant === 'danger' && styles.danger,
          variant === 'premium' && styles.premium,
          state.pressed && !reduceMotion && styles.pressed,
          state.pressed && reduceMotion && styles.pressedReducedMotion,
          isBlocked && styles.disabled,
        ];
        if (typeof style === 'function') return [...base, style(state)];
        return [...base, style];
      }}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} style={styles.spinner} />
        ) : icon && iconPosition === 'left' ? (
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
            variant === 'premium' && styles.textPremium,
          ]}
        >
          {loading ? loadingLabel ?? label : label}
        </Text>
        {!loading && icon && iconPosition === 'right' ? (
          <Ionicons name={icon} size={20} color={iconColor} style={styles.iconRight} />
        ) : null}
      </View>
    </Pressable>
  );
}
