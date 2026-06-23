import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { FREE_DAILY_QUESTIONS, canStartPractice } from '../../lib/paywall';

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
      accessibilityLabel={`${gate.remaining} libreng tanong natitira. Tingnan ang Plus.`}
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
          {gate.remaining > 0
            ? `${gate.remaining}/${FREE_DAILY_QUESTIONS} libreng tanong natitira ngayon`
            : 'Naubos na ang libreng tanong ngayon'}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          Unlimited practice sa Plus · walang ads
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </Pressable>
  );
});
