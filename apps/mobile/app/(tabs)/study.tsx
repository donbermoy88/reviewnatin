import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/badge';
import { PrimaryButton } from '../../components/primary-button';
import { SparkleStar } from '../../components/sparkle-star';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createStudyStyles } from '../../lib/themed-styles';
import { tabScrollPaddingWithFooter } from '../../lib/layout/content-padding';
import { fetchExamBySlug, fetchExamQuestionCount, fetchSubjectAreas } from '../../lib/api/catalog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchMockExams, type MockExam } from '../../lib/api/mock-exams';
import { fetchTopicAnalytics, type SubjectAnalytics } from '../../lib/api/analytics';
import { fetchReviewMaterialsByExam, type ReviewMaterial } from '../../lib/api/review-materials';
import { MasteryBar } from '../../components/mastery-bar';
import {
  FREE_MOCK_PREVIEW_ITEMS,
  getMockAccess,
  isMiniMock,
  isMiniMockAvailable,
} from '../../lib/paywall';
import type { SubjectArea } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { DEFAULT_EXAM_SLUG, getExamCategoryLabel } from '@reviewnatin/shared';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { AdBanner } from '../../components/ad-banner';
import { ContentGateBanner } from '../../components/content-gate-banner';
import { fetchContentGateStatus, type ContentGateStatus } from '../../lib/content-gate';
import { ActionCard, IconTile, InfoTile, LoadingState, ScreenState, SectionBlock, SegmentedControl } from '../../components/ui';
import { ErrorBoundary } from '../../components/error-boundary';

const STUDY_TABS = [
  { value: 'subjects', label: 'Subjects' },
  { value: 'mocks', label: 'Mock Exam' },
  { value: 'notes', label: 'Notes' },
] as const;

type StudyTab = (typeof STUDY_TABS)[number]['value'];

const NOTE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'lesson', label: 'Lessons' },
  { value: 'cheat_sheet', label: 'Cheat sheets' },
] as const;

type NotesFilter = (typeof NOTE_FILTERS)[number]['value'];

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

function StudyScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createStudyStyles(theme), [theme]);
  const subjectMeta = useMemo(
    () => [
      { icon: 'book-outline' as const, color: colors.primary, bg: colors.primaryMuted },
      { icon: 'school-outline' as const, color: '#7B2CBF', bg: theme.isDark ? '#2D1F45' : '#F1E8FA' },
      { icon: 'flask-outline' as const, color: colors.accentDark, bg: colors.accentLight },
      { icon: 'calculator-outline' as const, color: colors.success, bg: colors.successBg },
      { icon: 'reader-outline' as const, color: colors.flame, bg: colors.errorBg },
    ],
    [colors, theme.isDark]
  );
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<SubjectArea[]>([]);
  const [examName, setExamName] = useState('');
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([]);
  const [materials, setMaterials] = useState<ReviewMaterial[]>([]);
  const [notesFilter, setNotesFilter] = useState<NotesFilter>('all');
  const [activeTab, setActiveTab] = useState<StudyTab>('subjects');
  const [contentGate, setContentGate] = useState<ContentGateStatus | null>(null);
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
      const [areas, count, mocks, analytics, notes] = await Promise.all([
        fetchSubjectAreas(exam.id),
        fetchExamQuestionCount(slug),
        fetchMockExams(slug),
        user ? fetchTopicAnalytics(slug).then((r) => r.subjects).catch(() => []) : Promise.resolve([]),
        fetchReviewMaterialsByExam(slug).catch(() => []),
      ]);
      setSubjects(areas);
      setQuestionCount(count);
      setMockExams(mocks);
      setSubjectAnalytics(analytics);
      setMaterials(notes);
      setContentGate(await fetchContentGateStatus(slug).catch(() => null));
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

  const launchBoardExam = () => {
    if (!isPremium(examTypeId)) {
      Alert.alert('Board Exam Mode', 'Premium feature — strict timer, no hints, mixed subjects.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'View plans', onPress: () => router.push('/subscribe') },
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
        'Log in to start mocks',
        'Create a free account to start mock exams, save results, and track your CSE readiness.',
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
        'Weekly limit',
        '1 mini-mock per week on the free tier. Upgrade for unlimited mocks.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'View plans', onPress: () => router.push('/subscribe') },
        ]
      );
      return;
    }

    if (access === 'preview') {
      Alert.alert(
        'Preview mode',
        `Free tier: first ${FREE_MOCK_PREVIEW_ITEMS} items only. Upgrade for the full ${mock.itemCount}-item mock.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start preview',
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
          { text: 'Upgrade', onPress: () => router.push('/subscribe') },
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

  const analyticsBySubject = useMemo(() => {
    const map = new Map<string, SubjectAnalytics>();
    for (const s of subjectAnalytics) {
      map.set(s.subjectName.toLowerCase(), s);
    }
    return map;
  }, [subjectAnalytics]);

  const filteredMaterials = useMemo(() => {
    if (notesFilter === 'all') return materials;
    return materials.filter((m) => m.materialType === notesFilter);
  }, [materials, notesFilter]);

  const materialsBySubject = useMemo(() => {
    const map = new Map<string, ReviewMaterial[]>();
    for (const m of filteredMaterials) {
      const list = map.get(m.subjectName) ?? [];
      list.push(m);
      map.set(m.subjectName, list);
    }
    return map;
  }, [filteredMaterials]);

  useEffect(() => {
    load();
  }, [load]);

  const renderNotesTab = () => {
    return (
      <SectionBlock title="Review notes" subtitle="Study lessons and cheat sheets grouped by subject.">
        <SegmentedControl
          options={NOTE_FILTERS}
          value={notesFilter}
          onChange={setNotesFilter}
          accessibilityLabel="Filter review notes"
          style={{ marginBottom: spacing.md }}
        />

        {filteredMaterials.length === 0 ? (
          <ScreenState
            icon="document-text-outline"
            tone="primary"
            title="No notes yet"
            description="Lessons and cheat sheets will appear here once content is available for your exam."
          />
        ) : (
          [...materialsBySubject.entries()].map(([subjectName, items]) => (
            <View key={subjectName}>
              <Text style={[styles.subjectName, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>{subjectName}</Text>
              {items.map((m) => (
                <ActionCard
                  key={m.id}
                  title={m.title}
                  description={`${m.topicName} · ${m.materialType === 'cheat_sheet' ? 'Cheat sheet' : 'Lesson'}`}
                  leading={
                    <IconTile
                      icon={m.materialType === 'cheat_sheet' ? 'clipboard-outline' : 'reader-outline'}
                      color={m.materialType === 'cheat_sheet' ? colors.accentDark : colors.primary}
                      backgroundColor={m.materialType === 'cheat_sheet' ? colors.accentLight : colors.primaryMuted}
                    />
                  }
                  accessibilityLabel={`Open ${m.materialType === 'cheat_sheet' ? 'cheat sheet' : 'lesson'}: ${m.title}`}
                  accessibilityHint="Opens the selected review material."
                  onPress={() =>
                    router.push({
                      pathname: '/study/lesson/[id]',
                      params: { id: m.id, examSlug },
                    })
                  }
                />
              ))}
            </View>
          ))
        )}
      </SectionBlock>
    );
  };

  const renderMocksTab = () => {
    if (mockExams.length === 0) {
      return (
        <SectionBlock title="Mock exams" subtitle="Timed exam simulations will appear here when available.">
          <ScreenState
            icon="timer-outline"
            tone="primary"
            title="No mock exams yet"
            description="Full and mini mocks will appear here as we add content for your exam."
          />
        </SectionBlock>
      );
    }

    return (
      <SectionBlock
        title="Mock exams"
        subtitle={user ? 'Practice under stricter timing and review your readiness.' : 'Log in to start mocks and save your results.'}
      >
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
          const tierBadge = !user
            ? <Badge label="Log in" variant="accent" icon="lock-closed" />
            : mini && free
              ? <Badge label="1/week free" variant="success" />
              : preview
                ? <Badge label={`Preview ${FREE_MOCK_PREVIEW_ITEMS}`} variant="accent" icon="eye-outline" />
                : free
                  ? <Badge label="Plus" variant="premium" icon="lock-closed" />
                  : null;
          const iconName: keyof typeof Ionicons.glyphMap = mini ? 'flash' : 'document-text';
          const iconBg = mini ? colors.accentLight : colors.primaryMuted;
          const iconColor = mini ? colors.accentDark : colors.primary;
          return (
            <ActionCard
              key={mock.id}
              title={cleanExamName(mock.title)}
              description={`${mock.itemCount} items · ${Math.round(mock.durationSeconds / 60)} min`}
              leading={<IconTile icon={iconName} color={iconColor} backgroundColor={iconBg} />}
              badge={tierBadge}
              onPress={() => launchMock(mock)}
              accessibilityLabel={`Start mock exam: ${mock.title}`}
              accessibilityHint="Shows the mock exam start confirmation."
            />
          );
        })}
      </SectionBlock>
    );
  };

  const renderSubjectsTab = () => {
    if (subjects.length === 0) {
      return (
        <SectionBlock title="Subjects" subtitle="Your exam outline will appear here once content is ready.">
          <ScreenState
            icon="book-outline"
            tone="primary"
            title="No subjects yet"
            description="We're adding subjects for your exam. Try again later or change your exam track in Settings."
            action={{ label: 'Try again', onPress: load }}
          />
        </SectionBlock>
      );
    }

    return (
      <SectionBlock
        title="Subjects"
        subtitle="Choose a subject to review topics, practice questions, and improve weak areas."
      >
        {subjects.map((s, i) => {
          const meta = subjectMeta[i % subjectMeta.length];
          const analytics = analyticsBySubject.get(s.name.toLowerCase());
          const avg = analytics?.averageAccuracy ?? 0;
          const attempts = analytics?.topics.reduce((sum, t) => sum + t.attempts, 0) ?? 0;
          return (
            <ActionCard
              key={s.id}
              title={s.name}
              description={attempts > 0 ? `${avg}% mastery · ${attempts} attempts` : 'Tap to view topics and practice'}
              leading={<IconTile icon={meta.icon} color={meta.color} backgroundColor={meta.bg} />}
              accessibilityLabel={`Open ${s.name} subject`}
              accessibilityHint="Opens subject topics and practice options."
              onPress={() =>
                router.push({
                  pathname: '/study/[subjectSlug]',
                  params: { subjectSlug: s.slug, examSlug, subjectName: s.name },
                })
              }
            >
              {attempts > 0 ? <MasteryBar accuracy={avg} attempts={attempts} style={{ marginTop: spacing.sm }} /> : null}
            </ActionCard>
          );
        })}
      </SectionBlock>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={tabScrollPaddingWithFooter(insets)}>
          <LoadingState
            title="Loading your reviewer"
            description="Fetching subjects, mocks, and notes for your exam."
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
            title="Reviewer unavailable"
            description={loadError}
            action={{ label: 'Try again', onPress: load, variant: 'outline' }}
            style={{ paddingTop: insets.top + spacing.xxl }}
          />
        </ScrollView>
      </View>
    );
  }

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
            {subjects.length} subject{subjects.length === 1 ? '' : 's'} · {questionCount} published question
            {questionCount === 1 ? '' : 's'}
          </Text>
          <View style={styles.heroStats}>
            <InfoTile label="Subjects" value={String(subjects.length)} />
            <InfoTile label="Questions" value={questionCount > 0 ? String(questionCount) : 'Soon'} />
            <InfoTile label="Access" value={isPremium(examTypeId) ? 'Plus' : 'Free'} />
          </View>
          {questionCount === 0 ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                Questions for this exam are coming soon. Check back shortly — we&apos;re actively importing content.
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {contentGate ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <ContentGateBanner theme={theme} status={contentGate} />
          </View>
        ) : null}

        <SegmentedControl
          options={STUDY_TABS}
          value={activeTab}
          onChange={setActiveTab}
          accessibilityLabel="Choose review content"
          style={styles.tabs}
        />

        <View style={styles.body}>
          {!isPremium(examTypeId) && activeTab === 'subjects' ? (
            <AdBanner onPress={() => router.push('/subscribe')} />
          ) : null}
          {activeTab === 'mocks' ? (
            renderMocksTab()
          ) : activeTab === 'notes' ? (
            renderNotesTab()
          ) : (
            renderSubjectsTab()
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, pointerEvents: 'box-none' }]}>
        <LinearGradient
          colors={[colors.footerFade, colors.background]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
        />
        <PrimaryButton
          label={
            activeTab === 'mocks' && mockExams.length > 0
              ? user
                ? 'Start mock exam'
                : 'Log in for mocks'
              : 'Start practice quiz'
          }
          icon={activeTab === 'mocks' && mockExams.length > 0 ? 'timer-outline' : 'flash'}
          iconPosition="left"
          size="lg"
          onPress={() => {
            if (activeTab === 'mocks' && mockExams.length > 0) {
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

export default function StudyScreen() {
  return (
    <ErrorBoundary>
      <StudyScreenContent />
    </ErrorBoundary>
  );
}
