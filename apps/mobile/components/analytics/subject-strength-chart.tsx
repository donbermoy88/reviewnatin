import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import type { SubjectAnalytics } from '../../lib/api/analytics';

type Props = {
  subjects: SubjectAnalytics[];
  mode?: 'weak' | 'strong' | 'both';
  limit?: number;
};

function barColor(pct: number, colors: ReturnType<typeof useAppTheme>['colors']): string {
  if (pct >= 75) return colors.success;
  if (pct >= 50) return colors.accentDark;
  return colors.error;
}

export function SubjectStrengthChart({ subjects, mode = 'both', limit = 4 }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts, spacing, radii), [colors, fonts, spacing, radii]);

  const withData = subjects.filter((s) => s.topics.some((t) => t.attempts > 0));
  const sorted =
    mode === 'strong'
      ? [...withData].sort((a, b) => b.averageAccuracy - a.averageAccuracy)
      : [...withData].sort((a, b) => a.averageAccuracy - b.averageAccuracy);

  const rows = sorted.slice(0, limit);
  if (rows.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Subject mastery</Text>
        <Text style={styles.empty}>Complete quizzes to see weak and strong subjects.</Text>
      </View>
    );
  }

  const title =
    mode === 'weak' ? 'Weakest subjects' : mode === 'strong' ? 'Strongest subjects' : 'Subject mastery';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {rows.map((subject) => {
          const pct = Math.round(subject.averageAccuracy);
          const fill = barColor(pct, colors);
          return (
            <View key={subject.subjectName} style={styles.row}>
              <View style={styles.rowHead}>
                <Text style={styles.name} numberOfLines={1}>
                  {subject.subjectName}
                </Text>
                <Text style={[styles.pct, { color: fill }]}>{pct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fill }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

type InsightProps = {
  insights: {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    tone: 'primary' | 'success' | 'warn' | 'neutral';
  }[];
};

export function AnalyticsInsightCards({ insights }: InsightProps) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const styles = useMemo(() => createInsightStyles(colors, fonts, spacing, radii), [colors, fonts, spacing, radii]);

  if (insights.length === 0) return null;

  const toneMap = {
    primary: { bg: colors.primaryMuted, icon: colors.primary, border: colors.primary },
    success: { bg: colors.successBg, icon: colors.success, border: 'rgba(34,197,94,0.25)' },
    warn: { bg: colors.warnBg, icon: colors.error, border: colors.warnBorder },
    neutral: { bg: colors.surface, icon: colors.textMuted, border: colors.border },
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Insights</Text>
      {insights.map((insight) => {
        const tone = toneMap[insight.tone];
        return (
          <View key={insight.id} style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
              <Ionicons name={insight.icon} size={18} color={tone.icon} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{insight.title}</Text>
              <Text style={styles.subtitle}>{insight.subtitle}</Text>
            </View>
          </View>
        );
      })}
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
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    empty: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    list: { gap: spacing.sm },
    row: { gap: 6 },
    rowHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    name: {
      flex: 1,
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      color: colors.text,
    },
    pct: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
    },
    track: {
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.primaryMuted,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: radii.full,
    },
  });
}

function createInsightStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
  spacing: ReturnType<typeof useAppTheme>['spacing'],
  radii: ReturnType<typeof useAppTheme>['radii']
) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    sectionTitle: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      color: colors.text,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, gap: 2 },
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      color: colors.text,
      lineHeight: 19,
    },
    subtitle: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
    },
  });
}
