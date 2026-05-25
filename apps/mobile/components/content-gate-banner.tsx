import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { ContentGateStatus } from '../lib/content-gate';
import type { AppTheme } from '../hooks/use-app-theme';

type Props = {
  theme: AppTheme;
  status: ContentGateStatus;
  compact?: boolean;
};

export function ContentGateBanner({ theme, status, compact = false }: Props) {
  if (status.meetsMinimum) return null;

  const { colors, spacing, radii, fonts } = theme;

  if (compact) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginBottom: spacing.sm,
          paddingVertical: spacing.xs,
        }}
      >
        <Ionicons name="construct-outline" size={14} color={colors.accentDark} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, flex: 1 }}>
          Content loading — {status.counts.questions}/{status.minimum.questions} Q · {status.counts.mockExams}/
          {status.minimum.mockExams} mocks
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.accentLight,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.25)',
        flexDirection: 'row',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="construct-outline" size={20} color={colors.accentDark} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
          Content still loading in
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
          Questions {status.counts.questions}/{status.minimum.questions} ({status.questionPct}%) · Mocks{' '}
          {status.counts.mockExams}/{status.minimum.mockExams} ({status.mockPct}%)
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
          More items are being imported — practice what&apos;s available while we fill the bank.
        </Text>
      </View>
    </View>
  );
}
