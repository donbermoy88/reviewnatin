import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { ErrorState } from '../../components/error-state';
import { StackShell } from '../../components/stack-shell';
import { PrimaryButton } from '../../components/primary-button';
import { PremiumLock } from '../../components/premium-lock';
import { ReportContentButton } from '../../components/report-content-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createListScreenStyles } from '../../lib/themed-styles';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { fetchMistakes, type MistakeItem } from '../../lib/api/mistakes';
import { fetchUsageLimits } from '../../lib/api/iap';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { FREE_MISTAKE_DAYS } from '../../lib/paywall';
import { trackEvent } from '../../lib/analytics/events';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';

export default function MistakesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createListScreenStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [showFreeLimitBanner, setShowFreeLimitBanner] = useState(false);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const goal = await resolveOnboardingGoal(user?.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      const exam = await fetchExamBySlug(slug);
      if (exam) setExamTypeId(exam.id);

      if (!user) {
        setMistakes([]);
        setShowFreeLimitBanner(false);
        return;
      }

      const premium = isPremium(exam?.id);
      const visible = await fetchMistakes(slug, 50);
      setMistakes(visible);
      if (!premium) {
        const limits = await fetchUsageLimits(slug);
        setShowFreeLimitBanner(!limits?.isPremium);
      } else {
        setShowFreeLimitBanner(false);
      }
    } catch (err) {
      setLoadError(toUserFacingError(err));
      setMistakes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isPremium]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (!user) {
    return (
      <StackShell title="Mistake Bank" subtitle="Bawat maling sagot, naka-save para i-review">
        <EmptyState
          icon={<Ionicons name="alert-circle-outline" size={32} color={colors.primary} />}
          title="Mag-log in muna"
          description="Kailangan mo ng account para sa Mistake Bank mo."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  const ListHeader = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Mistake Bank</Text>
        <Text style={styles.sub}>{mistakes.length} item{mistakes.length === 1 ? '' : 's'} to review</Text>
      </View>

      {!isPremium(examTypeId) && showFreeLimitBanner ? (
        <PremiumLock
          title="Buong Mistake Bank history"
          description={`Free tier: huling ${FREE_MISTAKE_DAYS} araw lang. I-unlock ang kumpletong history.`}
          style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}
          onPress={() => {
            trackEvent('subscription_viewed', { source: 'mistake_bank' });
            router.push('/subscribe');
          }}
        />
      ) : null}

      {!loading && mistakes.length > 0 ? (
        <PrimaryButton
          label="Quiz ng mga mali"
          size="lg"
          style={{ margin: spacing.lg }}
          onPress={() =>
            router.push({
              pathname: '/practice/quiz',
              params: { examSlug, mode: 'mistake_review' },
            })
          }
        />
      ) : null}
    </>
  );

  const ListEmpty = loading ? (
    <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
  ) : loadError ? (
    <ErrorState description={loadError} onRetry={() => { setLoading(true); void load(); }} />
  ) : (
    <EmptyState
      icon={<Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />}
      title="Wala pang mali"
      description="Awtomatikong masa-save dito ang mga maling sagot mo sa quiz para i-review."
      actionLabel="Mag-practice na"
      onAction={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
    />
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={loading ? [] : mistakes}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        initialNumToRender={10}
        windowSize={11}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        renderItem={({ item: m }) => (
          <View style={styles.card}>
            <Text style={styles.cardSubject}>
              {m.subjectName} · {m.topicName}
            </Text>
            <Text style={styles.cardStem} numberOfLines={2}>
              {m.stem}
            </Text>
            <Text style={styles.cardMeta}>
              Wrong {m.timesWrong}x · Last {new Date(m.lastWrongAt).toLocaleDateString()}
            </Text>
            <ReportContentButton
              contentType="question"
              contentId={m.questionId}
              label="Flag question"
              compact
              style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}
