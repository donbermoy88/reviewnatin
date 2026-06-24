import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { canStartPractice } from '../../lib/paywall';
import { FREE_DAILY_STATUS } from '../../lib/product-copy';

type Props = {
  questionsToday: number;
  onUpgrade: () => void;
};

/** Signed-in free users see remaining daily questions before hitting the limit (F3). */
export const FreeDailyLimitStrip = memo(function FreeDailyLimitStrip({
  questionsToday,
  onUpgrade,
}: Props) {
  const theme = useAppTheme();
  const { colors, spacing, radii, fonts } = theme;
  const gate = canStartPractice(questionsToday, false);

  return (
    <Pressable
      onPress={onUpgrade}
      accessibilityRole="button"
      accessibilityLabel={FREE_DAILY_STATUS.accessibilityLabel(gate.remaining)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primaryLight,
        borderRadius: radii.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
          {FREE_DAILY_STATUS.title(gate.remaining)}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          {FREE_DAILY_STATUS.subtitle(gate.remaining)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </Pressable>
  );
});
