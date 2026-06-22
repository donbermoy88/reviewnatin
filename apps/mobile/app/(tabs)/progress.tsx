import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { ProfileSettingsHint } from '../../components/profile-settings-hint';
import { ErrorBoundary } from '../../components/error-boundary';
import { PrimaryButton } from '../../components/primary-button';
import { SparkleStar } from '../../components/sparkle-star';
import { StreakWeek } from '../../components/streak-week';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createProfileStyles } from '../../lib/themed-styles';
import { fetchRecentSessions } from '../../lib/api/quiz';
import { fetchPracticeStats } from '../../lib/api/stats';
import { fetchGuestPracticeStats, fetchGuestRecentSessions } from '../../lib/guest-quiz-history';
import { fetchUserBadges, type UserBadge } from '../../lib/api/achievements';
import { fetchMockExamHistory, fetchMockSubjectTrends, MOCK_PASS_THRESHOLD, type MockExamHistoryRow, type SubjectTrend } from '../../lib/api/mock-history';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { fetchWeeklySummary, type WeeklySummary } from '../../lib/api/weekly-summary';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useUserProfile } from '../../hooks/use-user-profile';

function dailyQuestionTarget(dailyMinutes: number): number {
  const map: Record<number, number> = { 15: 5, 30: 15, 45: 30, 60: 60 };
  return map[dailyMinutes] ?? 15;
}

function sessionModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    practice: 'Practice',
    mock: 'Mock Exam',
    timed: 'Timed',
    board: 'Board Exam',
    mistake_review: 'Mistakes',
    weak_area: 'Quick 10',
    barkada: 'Barkada',
    diagnostic: 'Diagnostic',
    offline: 'Offline',
  };
  return labels[mode] ?? mode;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Derives a 7-element boolean array (Mon–Sun) from a streak count.
 * Marks the most recent `streakDays` days up to and including today as complete.
 */
function buildCompletedDays(streakDays: number): boolean[] {
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat → convert to Mon=0..Sun=6
  const jsDay = new Date().getDay();
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
  const days: boolean[] = [false, false, false, false, false, false, false];
  const count = Math.min(streakDays, 7);
  for (let i = 0; i < count; i++) {
    const idx = (todayIdx - i + 7) % 7;
    days[idx] = true;
  }
  return days;
}

function scoreColor(
  score: number | null | undefined,
  palette: { success: string; flame: string; error: string; textMuted: string }
): string {
  if (score == null) return palette.textMuted;
  if (score >= 75) return palette.success;
  if (score >= 50) return palette.flame;
  return palette.error;
}

function formatScore(score: number | null | undefined): string {
  return score == null ? '—' : `${score}%`;
}

function ProfileScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createProfileStyles(theme), [theme]);
  const { user } = useAuth();
  const { displayName, initials } = useUserProfile('Guest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    streakDays: 0,
    totalAnswered: 0,
    accuracyPercent: null as number | null,
    sessionCount: 0,
  });
  const [sessions, setSessions] = useState<
    { id: string; score_percent: number | null; item_count: number; completed_at: string | null; mode: string }[]
  >([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [mockHistory, setMockHistory] = useState<MockExamHistoryRow[]>([]);
  const [subjectTrends, setSubjectTrends] = useState<SubjectTrend[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);

  // Overall mock-score trend (derived from mock history; no extra fetch).
  const overallTrend = useMemo(() => {
    if (mockHistory.length < 2) return null;
    const points = [...mockHistory]
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .map((m) => Math.round(m.scorePercent));
    return {
      points,
      first: points[0],
      latest: points[points.length - 1],
      delta: points[points.length - 1] - points[0],
    };
  }, [mockHistory]);

  const load = useCallback(async () => {
    try {
      const goal = await resolveOnboardingGoal(user?.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      const target = dailyQuestionTarget(goal?.dailyMinutes ?? 30);

      if (!user) {
        try {
          const [guestSessions, guestStats] = await Promise.all([
            fetchGuestRecentSessions(slug),
            fetchGuestPracticeStats(slug, target),
          ]);
          setSessions(guestSessions);
          setStats(guestStats);
        } catch {
          setSessions([]);
          setStats({ streakDays: 0, totalAnswered: 0, accuracyPercent: null, sessionCount: 0 });
        }
        return;
      }

      try {
        const [data, practiceStats, userBadges, mocks, weekly, trends] = await Promise.all([
          fetchRecentSessions(user.id, 5, slug),
          fetchPracticeStats(user.id, target, slug),
          fetchUserBadges(),
          fetchMockExamHistory(slug),
          fetchWeeklySummary(slug),
          fetchMockSubjectTrends(slug).catch(() => []),
        ]);
        setSessions(data);
        setStats(practiceStats);
        setBadges(userBadges);
        setMockHistory(mocks);
        setWeeklySummary(weekly);
        setSubjectTrends(trends);
      } catch {
        setSessions([]);
      }
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const hasActivity = stats.sessionCount > 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={tabScrollPadding(insets)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.sparkle}>
            <SparkleStar size={80} opacity={0.1} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable
              style={styles.settingsBtn}
              onPress={() => router.push('/(tabs)/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
          </View>

          <Pressable
            style={styles.avatarRow}
            onPress={user ? () => router.push('/profile/edit') : undefined}
            disabled={!user}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userSub}>
                {user ? user.email : 'Log in to save your progress'}
              </Text>
            </View>
          </Pressable>
        </LinearGradient>

        <View style={[styles.statsCard, { marginTop: -46 }]}>
          {[
            { v: hasActivity ? String(stats.streakDays) : '0', l: 'Day streak', c: colors.flame },
            { v: hasActivity ? String(stats.totalAnswered) : '0', l: 'Answered', c: colors.primary },
            {
              v: stats.accuracyPercent != null ? `${stats.accuracyPercent}%` : '—',
              l: 'Accuracy',
              c: colors.success,
            },
          ].map((s) => (
            <View key={s.l} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.c }]}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <ProfileSettingsHint />
        </View>

        {user && weeklySummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This week</Text>
            <LinearGradient
              colors={[...gradients.hero]}
              style={{
                borderRadius: 16,
                padding: spacing.md,
                marginTop: spacing.sm,
              }}
            >
              <StreakWeek completedDays={buildCompletedDays(weeklySummary.streakDays)} />
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 15, color: '#fff', marginTop: spacing.xs }}>
                {weeklySummary.questionsAnswered} questions · {weeklySummary.sessionsCompleted} sessions
              </Text>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {weeklySummary.accuracyPercent != null
                  ? `${weeklySummary.accuracyPercent}% accuracy`
                  : 'Accuracy —'}{' '}
                · {weeklySummary.streakDays}-day streak
              </Text>
            </LinearGradient>
          </View>
        ) : null}

        <View style={styles.section}>
          <PrimaryButton
            label={user ? 'View analytics' : 'Log in for analytics'}
            variant="outline"
            icon="analytics-outline"
            iconPosition="left"
            size="lg"
            onPress={() => router.push('/analytics')}
          />
        </View>

        {user && badges.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {badges.map((b) => (
                <View
                  key={b.slug}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: spacing.sm,
                    minWidth: '30%',
                    flexGrow: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 13, color: colors.text, marginTop: 4 }}>
                    {b.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {user && mockHistory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mock exam history</Text>
            {mockHistory.map((m) => (
              <Pressable
                key={m.sessionId}
                style={styles.sessionCard}
                onPress={() =>
                  router.push({
                    pathname: '/mock-review/[sessionId]',
                    params: {
                      sessionId: m.sessionId,
                      score: String(m.scorePercent),
                      title: m.mockTitle,
                    },
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{m.mockTitle}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(m.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {m.passed ? '✓ Passed' : 'Needs review'} (target ≥{MOCK_PASS_THRESHOLD}%)
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sessionScore,
                    { color: m.passed ? colors.success : colors.flame },
                  ]}
                >
                  {Math.round(m.scorePercent)}%
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {user && (subjectTrends.length > 0 || overallTrend) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject trends</Text>
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm }}>
              Your mock scores across recent attempts.
            </Text>
            {overallTrend ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 14, color: colors.text }}>Overall</Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyMedium,
                      fontSize: 12,
                      marginTop: 2,
                      color:
                        overallTrend.latest >= 75 ? colors.success : overallTrend.latest >= 50 ? colors.flame : colors.error,
                    }}
                  >
                    {overallTrend.first}% → {overallTrend.latest}%{'  '}
                    {overallTrend.delta > 0
                      ? `↑ +${overallTrend.delta}`
                      : overallTrend.delta < 0
                        ? `↓ ${Math.abs(overallTrend.delta)}`
                        : '— no change'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28 }}>
                  {overallTrend.points.map((p, i) => (
                    <View
                      key={i}
                      style={{
                        width: 6,
                        height: Math.max(3, Math.round((p / 100) * 28)),
                        borderRadius: 2,
                        backgroundColor: p >= 75 ? colors.success : p >= 50 ? colors.flame : colors.error,
                        opacity: i === overallTrend.points.length - 1 ? 1 : 0.5,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {subjectTrends.map((t) => {
              const band = (p: number) => (p >= 75 ? colors.success : p >= 50 ? colors.flame : colors.error);
              const trendLabel = t.delta > 0 ? `↑ +${t.delta}` : t.delta < 0 ? `↓ ${Math.abs(t.delta)}` : '— no change';
              return (
                <View
                  key={t.subjectName}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingVertical: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 14, color: colors.text }} numberOfLines={1}>
                      {t.subjectName}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, color: band(t.latestPct), marginTop: 2 }}>
                      {t.firstPct}% → {t.latestPct}%  {trendLabel}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28 }}>
                    {t.points.map((pt, i) => (
                      <View
                        key={i}
                        style={{
                          width: 6,
                          height: Math.max(3, Math.round((pt.pct / 100) * 28)),
                          borderRadius: 2,
                          backgroundColor: band(pt.pct),
                          opacity: i === t.points.length - 1 ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {!user ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz history (on this device)</Text>
            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
            {!loading && sessions.length === 0 && (
              <EmptyState
                icon={<Ionicons name="person-outline" size={32} color={colors.primary} />}
                title="Guest mode"
                description="Quiz results are saved on this device. Sign up to sync across devices."
                actionLabel="Log in"
                onAction={() => router.push('/(auth)/login')}
              />
            )}
            {!loading &&
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <View>
                    <Text style={styles.sessionTitle}>
                      {sessionModeLabel(s.mode)} · {s.item_count} items
                    </Text>
                    <Text style={styles.sessionDate}>
                      {s.completed_at ? formatSessionDate(s.completed_at) : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sessionScore,
                      { color: scoreColor(s.score_percent, colors) },
                    ]}
                  >
                    {formatScore(s.score_percent)}
                  </Text>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz history</Text>
            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
            {!loading && sessions.length === 0 && (
              <EmptyState
                icon={<Ionicons name="stats-chart-outline" size={32} color={colors.primary} />}
                title="No quizzes yet"
                description="Start practicing from the Home tab."
                actionLabel="Start practicing"
                onAction={() => router.push('/practice/quiz')}
              />
            )}
            {!loading &&
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <View>
                    <Text style={styles.sessionTitle}>
                      {sessionModeLabel(s.mode)} · {s.item_count} items
                    </Text>
                    <Text style={styles.sessionDate}>
                      {s.completed_at ? formatSessionDate(s.completed_at) : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sessionScore,
                      { color: scoreColor(s.score_percent, colors) },
                    ]}
                  >
                    {formatScore(s.score_percent)}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <ErrorBoundary>
      <ProfileScreenContent />
    </ErrorBoundary>
  );
}
