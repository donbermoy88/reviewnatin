import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { MasteryBar } from '../../components/mastery-bar';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { fetchTopicAnalytics, type TopicAnalyticsRow } from '../../lib/api/analytics';
import { fetchTopicsBySubjectSlug, fetchTopicQuestionCounts } from '../../lib/api/topics';
import type { TopicRow } from '../../lib/api/topics';
import { fetchSubjectFlashcardCount } from '../../lib/api/flashcards';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TopicListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createSubjectTopicStyles(theme), [theme]);
  const { user } = useAuth();
  const { subjectSlug, examSlug, subjectName: paramSubjectName } = useLocalSearchParams<{ subjectSlug: string; examSlug: string; subjectName?: string }>();
  const slug = examSlug ?? DEFAULT_EXAM_SLUG;
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicAnalytics, setTopicAnalytics] = useState<Map<string, TopicAnalyticsRow>>(new Map());
  const [topicCounts, setTopicCounts] = useState<Map<string, number>>(new Map());
  const [flashcardCount, setFlashcardCount] = useState<number | null>(null);
  // Use the passed subject name (full name from DB), falling back to slug-derived name
  const subjectName = paramSubjectName ?? (subjectSlug ? titleCase(subjectSlug) : 'Subject');

  const load = useCallback(async () => {
    if (!subjectSlug) return;

    try {
      const [topicRows, analytics, counts, cards] = await Promise.all([
        fetchTopicsBySubjectSlug(slug, subjectSlug),
        user ? fetchTopicAnalytics(slug).catch(() => ({ subjects: [], allTopics: [] })) : Promise.resolve({ subjects: [], allTopics: [] }),
        fetchTopicQuestionCounts(slug, subjectSlug),
        fetchSubjectFlashcardCount(slug, subjectSlug).catch(() => null),
      ]);

      setTopics(topicRows);
      setTopicCounts(counts);
      setFlashcardCount(cards);

      const bySlug = new Map<string, TopicAnalyticsRow>();
      for (const t of analytics.allTopics) {
        if (t.subjectName.toLowerCase() === subjectName.toLowerCase()) {
          bySlug.set(t.topicSlug, t);
        }
      }
      setTopicAnalytics(bySlug);
    } finally {
      setLoading(false);
    }
  }, [subjectSlug, slug, user, subjectName]);

  useEffect(() => {
    void load();
  }, [load]);

  const subjectAvg = useMemo(() => {
    const rows = [...topicAnalytics.values()].filter((t) => t.attempts > 0);
    if (rows.length === 0) return null;
    return Math.round(rows.reduce((sum, t) => sum + t.accuracy, 0) / rows.length);
  }, [topicAnalytics]);

  const topicStatus = useMemo(() => {
    if (topics.length === 0) return { ready: 0, comingSoon: 0, fullyCounted: false };
    const fullyCounted = topics.every((t) => topicCounts.has(t.slug));
    if (!fullyCounted) return { ready: topics.length, comingSoon: 0, fullyCounted };
    const ready = topics.filter((t) => (topicCounts.get(t.slug) ?? 0) > 0).length;
    return { ready, comingSoon: topics.length - ready, fullyCounted };
  }, [topics, topicCounts]);

  const headerSub = useMemo(() => {
    if (topics.length === 0) return 'Content coming soon';
    if (topicStatus.fullyCounted && topicStatus.comingSoon > 0) {
      if (topicStatus.ready === 0) return 'Questions coming soon';
      return `${topicStatus.ready} ready · ${topicStatus.comingSoon} coming soon`;
    }
    return `${topics.length} topic${topics.length === 1 ? '' : 's'} · tap to practice`;
  }, [topics.length, topicStatus]);

  const flashcardsDisabled = flashcardCount === 0;
  const flashcardSub =
    flashcardCount == null
      ? `Due cards for ${subjectName}`
      : flashcardCount > 0
        ? `${flashcardCount} card${flashcardCount === 1 ? '' : 's'} for ${subjectName}`
        : 'Flashcards coming soon';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.hero]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTag}>SUBJECT</Text>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <Text style={styles.headerSub}>{headerSub}</Text>
        {subjectAvg != null ? (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLbl}>Subject mastery</Text>
              <Text style={styles.progressPct}>{subjectAvg}%</Text>
            </View>
            <MasteryBar accuracy={subjectAvg} attempts={1} />
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.flashcardRow, flashcardsDisabled && styles.disabledCard]}
          disabled={flashcardsDisabled}
          onPress={() => {
            if (flashcardsDisabled) return;
            router.push({
              pathname: '/flashcards',
              params: { examSlug: slug, subjectSlug },
            });
          }}
          accessibilityRole="button"
          accessibilityState={{ disabled: flashcardsDisabled }}
          accessibilityLabel={`Flashcards for ${subjectName}`}
        >
          <View style={styles.flashcardIcon}>
            <Ionicons name="albums-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.flashcardTitle}>Flashcards</Text>
            <Text style={styles.flashcardSub}>{flashcardSub}</Text>
          </View>
          <Ionicons
            name={flashcardsDisabled ? 'time-outline' : 'chevron-forward'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {topics.length === 0 ? (
          <>
            <EmptyState
              icon={<Ionicons name="list-outline" size={32} color={colors.primary} />}
              title="Topics coming soon"
              description="Topics for this subject are being added. Check back soon or practice with available questions below."
            />
            <Pressable
              style={styles.topicCard}
              onPress={() =>
                router.push({
                  pathname: '/practice/quiz',
                  params: { examSlug: slug },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Start practice quiz for ${subjectName}`}
            >
              <View style={styles.topicIcon}>
                <Ionicons name="play" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicTitle}>Start practice quiz</Text>
                <Text style={styles.topicMeta}>Practice with available questions from your exam track</Text>
              </View>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={14} color="#fff" />
              </View>
            </Pressable>
          </>
        ) : (
          topics.map((t, i) => {
            const analytics = topicAnalytics.get(t.slug);
            const pct = analytics && analytics.attempts > 0 ? Math.round(analytics.accuracy) : 0;
            const qCount = topicCounts.get(t.slug);
            const isEmpty = qCount === 0;
            const meta =
              analytics && analytics.attempts > 0
                ? `${pct}% mastery · ${analytics.attempts} ${analytics.attempts === 1 ? 'try' : 'tries'}`
                : isEmpty
                  ? 'Coming soon'
                  : qCount != null
                    ? `${qCount} question${qCount === 1 ? '' : 's'}`
                    : 'Tap to start practicing';
            return (
              <Pressable
                key={t.id}
                style={[styles.topicCard, isEmpty && styles.topicCardEmpty]}
                disabled={isEmpty}
                onPress={() => {
                  if (isEmpty) return;
                  router.push({
                    pathname: '/practice/quiz',
                    params: { examSlug: slug, topicSlug: t.slug },
                  });
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: isEmpty }}
                accessibilityLabel={isEmpty ? `${t.name} — coming soon` : `Practice topic ${t.name}`}
              >
                <View style={styles.topicIcon}>
                  <Text style={styles.topicNum}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{t.name}</Text>
                  <Text style={styles.topicMeta}>{meta}</Text>
                  {analytics && analytics.attempts > 0 ? (
                    <MasteryBar accuracy={pct} attempts={analytics.attempts} style={{ marginTop: 6 }} />
                  ) : null}
                </View>
                {isEmpty ? (
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                ) : (
                  <View style={styles.playCircle}>
                    <Ionicons name="play" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function createSubjectTopicStyles(theme: AppTheme) {
  const { colors, fonts, radii, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    headerTag: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontFamily: fonts.display,
      fontSize: 26,
      color: '#fff',
      marginTop: spacing.xs,
      lineHeight: 30,
      letterSpacing: -0.6,
    },
    headerSub: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    progressCard: {
      marginTop: spacing.lg,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    progressLbl: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    progressPct: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.accent },
    contentScroll: { flex: 1 },
    body: { padding: spacing.lg, gap: spacing.sm },
    flashcardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabledCard: { opacity: 0.55 },
    flashcardIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flashcardTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    flashcardSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    topicCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topicCardEmpty: { opacity: 0.55 },
    topicIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicNum: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
    topicTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    topicMeta: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    playCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
