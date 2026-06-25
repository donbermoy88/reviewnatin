import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import type { AnalyticsInsight } from '../../lib/analytics/insights';
import type { DailyStudyPoint } from '../../lib/api/study-trend';
import type { SubjectAnalytics } from '../../lib/api/analytics';
import { StudyTrendChart } from '../analytics/study-trend-chart';
import { AnalyticsInsightCards, SubjectStrengthChart } from '../analytics/subject-strength-chart';

type Props = {
  studyTrend: DailyStudyPoint[];
  subjectAnalytics: SubjectAnalytics[];
  insights: AnalyticsInsight[];
  onOpenAnalytics: () => void;
};

/** Memoized chart block — avoids re-render when unrelated dashboard state changes. */
export const HomeStudyInsights = memo(function HomeStudyInsights({
  studyTrend,
  subjectAnalytics,
  insights,
  onOpenAnalytics,
}: Props) {
  const theme = useAppTheme();
  const { colors, spacing } = theme;

  return (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 18, color: colors.text }}>
            Study insights
          </Text>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
            7-day trend, accuracy, and weak areas.
          </Text>
        </View>
        <Pressable
          onPress={onOpenAnalytics}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open full analytics"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 13, color: colors.primary }}>Details</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </Pressable>
      </View>
      <StudyTrendChart
        points={
          studyTrend.length > 0
            ? studyTrend
            : Array.from({ length: 7 }, (_, i) => ({
                // Unique per index — the chart only uses `date` as a React key
                // (dayLabel is what's displayed), and dayLabel itself repeats
                // ('T' and 'S' appear twice), so it can't double as the key.
                date: `placeholder-day-${i}`,
                dayLabel: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
                questions: 0,
                sessions: 0,
              }))
        }
      />
      <SubjectStrengthChart subjects={subjectAnalytics} mode="both" limit={4} />
      <AnalyticsInsightCards insights={insights} />
    </View>
  );
});
