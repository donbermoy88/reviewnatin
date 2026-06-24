import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { PREMIUM_ACTIVE } from '../../lib/subscription/paywall-copy';

type Props = {
  onManage: () => void;
};

/** Signed-in Plus users see active entitlement benefits on Home (P3). */
export const PremiumActiveStrip = memo(function PremiumActiveStrip({ onManage }: Props) {
  const theme = useAppTheme();
  const { colors, spacing, radii, fonts } = theme;

  return (
    <Pressable
      onPress={onManage}
      accessibilityRole="button"
      accessibilityLabel={PREMIUM_ACTIVE.accessibilityLabel}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.successBg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.18)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Ionicons name="sparkles" size={18} color={colors.success} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
          {PREMIUM_ACTIVE.title}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          {PREMIUM_ACTIVE.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.success} />
    </Pressable>
  );
});
