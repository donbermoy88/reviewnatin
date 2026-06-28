import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/badge';
import { PrimaryButton } from '../../components/primary-button';
import { SparkleStar } from '../../components/sparkle-star';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createStudyStyles } from '../../lib/themed-styles';
import { tabScrollPaddingWithFooter } from '../../lib/layout/content-padding';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchMockExams, type MockExam } from '../../lib/api/mock-exams';
import { MOCK_PASS_THRESHOLD } from '../../lib/api/mock-history';
import { PREMIUM_LOCK_CTA, PREMIUM_LOCK_TITLE } from '../../lib/subscription/paywall-copy';
import {
  FREE_MOCK_PREVIEW_ITEMS,
  getMockAccess,
  isMiniMock,
  isMiniMockAvailable,
} from '../../lib/paywall';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { DEFAULT_EXAM_SLUG, getExamCategoryLabel } from '@reviewnatin/shared';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { FREE_MOCK_PREVIEW } from '../../lib/product-copy';
import { ActionCard, IconTile, InfoTile, LoadingState, ScreenState, SectionBlock } from '../../components/ui';
import { ErrorBoundary } from '../../components/error-boundary';

function cleanExamName(name: string): string {
  return name
    .replace(/CSE[\s\u200B-\u200D\uFEFF]*Professional/gi, 'CSE Professional')
    .replace(/\b([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bCse\b/g, 'CSE')
    .replace(/\bPnle\b/g, 'PNLE')
    .replace(/\s+/g, ' ')
    .trim();
}

function MockExamScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing, fonts, radii } = theme;
  const styles = useMemo(() => createStudyStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examName, setExamName] = useState('');
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const displayExamName = useMemo(
    () => cleanExamName(examName || examSlug || 'Your exam'),
    [examName, examSlug]
  );

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const goal = await resolveOnboardingGoal(user?.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      const exam = await fetchExamBySlug(slug);
      if (!exam) {
        setLoadError('We could not find this exam track. Try again or choose another exam in Settings.');
        return;
      }
      setExamName(exam.name);
      setExamTypeId(exam.id);
      setMockExams(await fetchMockExams(slug));
    } catch (err) {
      setLoadError(toUserFacingError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const launchBoardExam = () => {
    if (!isPremium(examTypeId)) {
      Alert.alert('Board Exam Mode', PREMIUM_LOCK_TITLE, [
        { text: 'Not now', style: 'cancel' },
        { text: PREMIUM_LOCK_CTA, onPress: () => router.push('/subscribe') },
      ]);
      return;
    }
    router.push({
      pathname: '/practice/quiz',
      params: { examSlug, mode: 'board' },
    });
  };

  const launchMock = async (mock: MockExam) => {
    if (!user) {
      Alert.alert(
        FREE_MOCK_PREVIEW.loginAlertTitle,
        FREE_MOCK_PREVIEW.loginAlertBody,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Log in', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    const premium = isPremium(examTypeId);
    const access = getMockAccess(mock, premium);

    if (access === 'weekly_limit' && !(await isMiniMockAvailable(examSlug))) {
      Alert.alert(
        FREE_MOCK_PREVIEW.weeklyLimitTitle,
        FREE_MOCK_PREVIEW.weeklyLimitBody,
        [
          { text: 'Not now', style: 'cancel' },
          { text: PREMIUM_LOCK_CTA, onPress: () => router.push('/subscribe') },
        ]
      );
      return;
    }

    if (access === 'preview') {
      Alert.alert(
        FREE_MOCK_PREVIEW.previewAlertTitle,
        FREE_MOCK_PREVIEW.previewAlertBody(mock.itemCount, FREE_MOCK_PREVIEW_ITEMS),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: FREE_MOCK_PREVIEW.previewStartCta,
            onPress: () =>
              router.push({
                pathname: '/practice/quiz',
                params: {
                  examSlug,
                  mode: 'mock',
                  mockExamId: mock.id,
                  durationSeconds: String(Math.min(mock.durationSeconds, 900)),
                  previewLimit: String(FREE_MOCK_PREVIEW_ITEMS),
                },
              }),
          },
          { text: PREMIUM_LOCK_CTA, onPress: () => router.push('/subscribe') },
        ]
      );
      return;
    }

    const durationMin = Math.round(mock.durationSeconds / 60);
    Alert.alert(
      'Start mock exam',
      `${mock.title} · ${mock.itemCount} items · ${durationMin} min\n\nStrict timer, no hints, and no going back to previous questions. Make sure you're ready before starting.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Start exam',
          onPress: () =>
            router.push({
              pathname: '/practice/quiz',
              params: {
                examSlug,
                mode: 'mock',
                mockExamId: mock.id,
                durationSeconds: String(mock.durationSeconds),
              },
            }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={tabScrollPaddingWithFooter(insets)}>
          <LoadingState
            title="Loading mock exams"
            description="Fetching timed exam simulations for your exam."
            cards={4}
            style={{ paddingTop: insets.top + spacing.xl }}
          />
        </ScrollView>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={tabScrollPaddingWithFooter(insets)}>
          <ScreenState
            icon="cloud-offline-outline"
            tone="error"
            title="Mock exams unavailable"
            description={loadError}
            action={{ label: 'Try again', onPress: load, variant: 'outline' }}
            style={{ paddingTop: insets.top + spacing.xxl }}
          />
        </ScrollView>
      </View>
    );
  }

  const freeUser = Boolean(user && !isPremium(examTypeId));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={tabScrollPaddingWithFooter(insets)}
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
            <SparkleStar size={80} opacity={0.12} />
          </View>
          <View style={styles.headerNav}>
            <Text style={styles.headerTag}>{getExamCategoryLabel(examSlug)}</Text>
          </View>
          <Text style={styles.headerTitle}>{displayExamName}</Text>
          <Text style={styles.headerSub}>
            {mockExams.length} mock exam{mockExams.length === 1 ? '' : 's'} available
          </Text>
          <View style={styles.heroStats}>
            <InfoTile label="Mocks" value={String(mockExams.length)} />
            <InfoTile label="Pasang marka" value={`${MOCK_PASS_THRESHOLD}%`} />
            <InfoTile label="Access" value={isPremium(examTypeId) ? 'Plus' : 'Free'} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {mockExams.length === 0 ? (
            <SectionBlock title="Mock exams" subtitle="Timed exam simulations will appear here when available.">
              <ScreenState
                icon="timer-outline"
                tone="primary"
                title="No mock exams yet"
                description="Full and mini mocks will appear here as we add content for your exam."
              />
            </SectionBlock>
          ) : (
            <SectionBlock
              title="Mock exams"
              subtitle={
                !user
                  ? FREE_MOCK_PREVIEW.guestMocksSubtitle
                  : freeUser
                    ? FREE_MOCK_PREVIEW.freeMocksSubtitle
                    : FREE_MOCK_PREVIEW.premiumMocksSubtitle
              }
            >
              {freeUser ? (
                <Pressable
                  onPress={() => router.push('/subscribe')}
                  accessibilityRole="button"
                  accessibilityLabel="Learn about free mock previews and Plus upgrades"
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                    borderRadius: radii.lg,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 1,
                    borderColor: 'rgba(30,79,217,0.14)',
                    padding: spacing.sm,
                    marginBottom: spacing.md,
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
                      {FREE_MOCK_PREVIEW.hintTitle}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.bodyMedium,
                        fontSize: 12,
                        color: colors.textMuted,
                        lineHeight: 17,
                        marginTop: 2,
                      }}
                    >
                      {FREE_MOCK_PREVIEW.hintBody(FREE_MOCK_PREVIEW_ITEMS)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              ) : null}
              <ActionCard
                title="Board Exam Mode"
                description="Full-length · Strict timer · No hints"
                leading={<IconTile icon="shield-checkmark" color={colors.primary} backgroundColor={colors.primaryMuted} />}
                badge={!isPremium(examTypeId) ? <Badge label="Plus" variant="premium" icon="lock-closed" /> : null}
                onPress={launchBoardExam}
                accessibilityLabel="Open Board Exam Mode"
                accessibilityHint="Starts or explains the full-length premium board exam mode."
              />
              {mockExams.map((mock) => {
                const mini = isMiniMock(mock);
                const free = user ? !isPremium(examTypeId) : false;
                const preview = user && free && !mini && mock.itemCount > FREE_MOCK_PREVIEW_ITEMS;
                const durationMin = Math.round(mock.durationSeconds / 60);
                const tierBadge = !user
                  ? <Badge label="Log in" variant="accent" icon="lock-closed" />
                  : mini && free
                    ? <Badge label="1/week free" variant="success" />
                    : preview
                      ? <Badge label={FREE_MOCK_PREVIEW.badgeLabel(FREE_MOCK_PREVIEW_ITEMS)} variant="accent" icon="eye-outline" />
                      : free
                        ? <Badge label="Plus" variant="premium" icon="lock-closed" />
                        : null;
                const iconName: keyof typeof Ionicons.glyphMap = mini ? 'flash' : 'document-text';
                const iconBg = mini ? colors.accentLight : colors.primaryMuted;
                const iconColor = mini ? colors.accentDark : colors.primary;
                const description = preview
                  ? FREE_MOCK_PREVIEW.previewCardDescription(mock.itemCount, durationMin, FREE_MOCK_PREVIEW_ITEMS)
                  : `${mock.itemCount} items · ${durationMin} min`;
                return (
                  <ActionCard
                    key={mock.id}
                    title={cleanExamName(mock.title)}
                    description={description}
                    leading={<IconTile icon={iconName} color={iconColor} backgroundColor={iconBg} />}
                    badge={tierBadge}
                    onPress={() => launchMock(mock)}
                    accessibilityLabel={`Start mock exam: ${mock.title}`}
                    accessibilityHint="Shows the mock exam start confirmation."
                  />
                );
              })}
            </SectionBlock>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, pointerEvents: 'box-none' }]}>
        <LinearGradient
          colors={[colors.footerFade, colors.background]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
        />
        <PrimaryButton
          label={mockExams.length > 0 ? (user ? 'Start mock exam' : 'Log in for mocks') : 'Start practice quiz'}
          icon={mockExams.length > 0 ? 'timer-outline' : 'flash'}
          iconPosition="left"
          size="lg"
          onPress={() => {
            if (mockExams.length > 0) {
              void launchMock(mockExams[0]);
            } else {
              router.push({ pathname: '/practice/quiz', params: { examSlug } });
            }
          }}
        />
      </View>
    </View>
  );
}

export default function MockExamScreen() {
  return (
    <ErrorBoundary>
      <MockExamScreenContent />
    </ErrorBoundary>
  );
}
