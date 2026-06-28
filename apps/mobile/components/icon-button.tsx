import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAppTheme } from '../hooks/use-app-theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Variant =
  /** No background — a bare tappable glyph (back chevrons, inline actions). */
  | 'plain'
  /** White surface with a hairline border — floating controls over content. */
  | 'surface'
  /** Brand-tinted fill — primary-coloured affordances. */
  | 'tinted'
  /** Translucent white — controls sitting on a gradient/photo header. */
  | 'translucent'
  /** Solid primary — high-emphasis round actions (e.g. send / add). */
  | 'solid';

type Props = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: Variant;
  /** Glyph size. Defaults to 20. */
  size?: number;
  /** Touch-target diameter. Defaults to 44 (accessibility minimum). */
  buttonSize?: number;
  /** Overrides the variant's icon colour. */
  color?: string;
  disabled?: boolean;
  /** Light haptic on press. Defaults to true. */
  haptics?: boolean;
  /** Renders a small notification dot in the top-right corner. */
  showDot?: boolean;
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
};

/**
 * Standard round/square icon button. Centralizes the many ad-hoc
 * `<Pressable style={styles.closeBtn}><Ionicons/></Pressable>` patterns with a
 * consistent 44px touch target, press feedback, and haptics.
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = 20,
  buttonSize = 44,
  color,
  disabled,
  haptics = true,
  showDot,
  dotColor,
  style,
  hitSlop = 6,
}: Props) {
  const theme = useAppTheme();
  const { colors, radii } = theme;
  const reduceMotion = useReducedMotion();

  const variantStyle = useMemo<{ bg: string; border: string; fg: string }>(() => {
    switch (variant) {
      case 'plain':
        return { bg: 'transparent', border: 'transparent', fg: colors.text };
      case 'tinted':
        return { bg: colors.primaryMuted, border: 'transparent', fg: colors.primary };
      case 'translucent':
        return { bg: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.18)', fg: '#fff' };
      case 'solid':
        return { bg: colors.primary, border: 'transparent', fg: '#fff' };
      case 'surface':
      default:
        return { bg: colors.surface, border: colors.border, fg: colors.text };
    }
  }, [variant, colors]);

  const iconColor = color ?? variantStyle.fg;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (!disabled && haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variantStyle.bg,
          borderWidth: variantStyle.border === 'transparent' ? 0 : 1,
          borderColor: variantStyle.border,
        },
        disabled && { opacity: 0.45 },
        pressed && !disabled && (reduceMotion
          ? { opacity: 0.6 }
          : { opacity: 0.85, transform: [{ scale: theme.motion.scale.press }] }),
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
      {showDot ? (
        <View
          style={{
            position: 'absolute',
            top: buttonSize * 0.2,
            right: buttonSize * 0.2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor ?? colors.error,
            borderWidth: 1.5,
            borderColor: variantStyle.bg === 'transparent' ? colors.background : variantStyle.bg,
          }}
        />
      ) : null}
    </Pressable>
  );
}
