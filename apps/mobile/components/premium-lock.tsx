import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { PREMIUM_LOCK_BODY, PREMIUM_LOCK_CTA, PREMIUM_LOCK_TITLE } from '../lib/subscription/paywall-copy';

const INK_ON_ACCENT = '#0E1B3D';

type Props = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onPress: () => void;
  variant?: 'card' | 'inline' | 'overlay';
  style?: ViewStyle;
};

/**
 * Reusable premium-gate UI. Pure presentation — entitlement is still enforced
 * server-side; this only communicates a locked feature and routes to /subscribe.
 *
 * - card:    navy/gold upsell strip for empty/gated sections
 * - inline:  compact lock chip to sit beside a locked control
 * - overlay: absolute-fill scrim over gated content (parent must be positioned)
 */
export function PremiumLock({
  title = PREMIUM_LOCK_TITLE,
  description = PREMIUM_LOCK_BODY,
  ctaLabel = PREMIUM_LOCK_CTA,
  onPress,
  variant = 'card',
  style,
}: Props) {
  const { colors, radii, spacing, fonts, isDark, shadows } = useAppTheme();

  if (variant === 'inline') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${ctaLabel}`}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            backgroundColor: colors.accentLight,
            paddingHorizontal: spacing.sm,
            paddingVertical: 5,
            borderRadius: radii.sm,
            borderWidth: 1,
            borderColor: 'rgba(245,166,35,0.25)',
          },
          style,
        ]}
      >
        <Ionicons name="lock-closed" size={12} color={colors.accentDark} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.accentDark, letterSpacing: 0.2 }}>
          Plus
        </Text>
      </Pressable>
    );
  }

  if (variant === 'overlay') {
    return (
      <View
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: isDark ? 'rgba(11,18,32,0.76)' : 'rgba(244,247,252,0.86)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.lg,
            gap: spacing.sm,
            borderRadius: radii.xl,
          },
          style,
        ]}
      >
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: radii.lg,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="lock-closed" size={22} color={INK_ON_ACCENT} />
        </View>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, textAlign: 'center' }}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
          {description}
        </Text>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={{
            marginTop: spacing.xs,
            backgroundColor: colors.accent,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: radii.lg,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: INK_ON_ACCENT }}>{ctaLabel}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}. ${ctaLabel}`}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primaryDark,
          borderRadius: radii.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          opacity: pressed ? 0.92 : 1,
          ...shadows.card,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radii.lg,
          backgroundColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="lock-open" size={19} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' }}>{title}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>
          {description}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.accent,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radii.lg,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: INK_ON_ACCENT }}>{ctaLabel}</Text>
      </View>
    </Pressable>
  );
}
