import type { ReactNode } from 'react';
import { Pressable, Text, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/use-app-theme';

type Props = {
  title: string;
  description?: string;
  leading?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionCard({
  title,
  description,
  leading,
  badge,
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
}: Props) {
  const { colors, radii, spacing, shadows, type, touchTarget } = useAppTheme();
  const interactive = !!onPress && !disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      android_ripple={interactive ? { color: colors.primaryMuted, borderless: false } : undefined}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: touchTarget.min,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
          ...shadows.card,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {leading}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <Text style={[type.label, { fontSize: 15, flexShrink: 1 }]} numberOfLines={2}>
              {title}
            </Text>
            {badge}
          </View>
          {description ? <Text style={[type.subtitle, { marginTop: 2 }]}>{description}</Text> : null}
          {children}
        </View>
        {interactive ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
      </View>
    </Pressable>
  );
}
