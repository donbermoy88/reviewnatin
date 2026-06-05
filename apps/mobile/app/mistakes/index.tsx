import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { StackShell } from '../../components/stack-shell';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createListScreenStyles } from '../../lib/themed-styles';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { fetchMistakes, type MistakeItem } from '../../lib/api/mistakes';
import { fetchUsageLimits } from '../../lib/api/iap';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { FREE_MISTAKE_DAYS } from '../../lib/paywall';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';

export default function MistakesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, fonts } = theme;
  const styles = useMemo(() => createListScreenStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [showFreeLimitBanner, setShowFreeLimitBanner] = useState(false);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
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
      <StackShell title="Mistake Bank" subtitle="Every wrong answer, saved to review">
        <EmptyState
          icon={<Ionicons name="alert-circle-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="You need an account to save your Mistake Bank."
          actionLabel="Log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Mistake Bank</Text>
          <Text style={styles.sub}>{mistakes.length} item{mistakes.length === 1 ? '' : 's'} to review</Text>
        </View>

        {!isPremium(examTypeId) && showFreeLimitBanner ? (
          <Pressable
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.sm,
              backgroundColor: colors.warnBg,
              borderRadius: 12,
              padding: spacing.md,
            }}
            onPress={() => router.push('/subscribe')}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
              Full Mistake Bank history is a premium feature
            </Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              Free tier shows last {FREE_MISTAKE_DAYS} days. Upgrade for complete history.
            </Text>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : mistakes.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />}
            title="No mistakes yet"
            description="Questions you get wrong in quizzes will automatically be saved here for review."
            actionLabel="Practice now"
            onAction={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
          />
        ) : (
          <>
            <PrimaryButton
              label="Review mistakes quiz"
              size="lg"
              style={{ margin: spacing.lg }}
              onPress={() =>
                router.push({
                  pathname: '/practice/quiz',
                  params: { examSlug, mode: 'mistake_review' },
                })
              }
            />
            {mistakes.map((m) => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.cardSubject}>
                  {m.subjectName} · {m.topicName}
                </Text>
                <Text style={styles.cardStem} numberOfLines={2}>
                  {m.stem}
                </Text>
                <Text style={styles.cardMeta}>
                  Wrong {m.timesWrong}x · Last {new Date(m.lastWrongAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
