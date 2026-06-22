import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useAppTheme } from '../../hooks/use-app-theme';
import type { DailyStudyPoint } from '../../lib/api/study-trend';

type Props = {
  points: DailyStudyPoint[];
  height?: number;
};

export function StudyTrendChart({ points, height = 120 }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts, spacing, radii), [colors, fonts, spacing, radii]);

  const maxQuestions = Math.max(...points.map((p) => p.questions), 1);
  const totalQuestions = points.reduce((sum, p) => sum + p.questions, 0);
  const chartWidth = 280;
  const barGap = 8;
  const barWidth = (chartWidth - barGap * (points.length - 1)) / points.length;
  const chartInnerHeight = height - 48;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>7-day study trend</Text>
        <Text style={styles.meta}>{totalQuestions} questions</Text>
      </View>
      <View style={styles.chartRow}>
        <Svg width={chartWidth} height={chartInnerHeight}>
          {points.map((point, index) => {
            const barHeight = Math.max(4, (point.questions / maxQuestions) * (chartInnerHeight - 8));
            const x = index * (barWidth + barGap);
            const y = chartInnerHeight - barHeight;
            const isToday = index === points.length - 1;
            return (
              <Rect
                key={point.date}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill={isToday ? colors.primary : point.questions > 0 ? colors.accent : colors.border}
                opacity={point.questions > 0 ? 1 : 0.55}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.labels}>
        {points.map((point) => (
          <Text key={`label-${point.date}`} style={styles.label}>
            {point.dayLabel}
          </Text>
        ))}
      </View>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
  spacing: ReturnType<typeof useAppTheme>['spacing'],
  radii: ReturnType<typeof useAppTheme>['radii']
) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    head: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      color: colors.text,
    },
    meta: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.textMuted,
    },
    chartRow: {
      alignItems: 'center',
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      paddingHorizontal: 2,
    },
    label: {
      flex: 1,
      textAlign: 'center',
      fontFamily: fonts.bodySemiBold,
      fontSize: 11,
      color: colors.textLight,
    },
  });
}
