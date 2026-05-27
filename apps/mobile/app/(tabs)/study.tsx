import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
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
  hasUsedMiniMockThisWeek,
  isMiniMock,
  recordMiniMockUsed,
} from '../../lib/paywall';
import type { SubjectArea } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { DEFAULT_EXAM_SLUG, getExamCategoryLabel } from '@reviewnatin/shared';
import { AdBanner } from '../../components/ad-banner';
import { ContentGateBanner } from '../../components/content-gate-banner';
import { fetchContentGateStatus, type ContentGateStatus } from '../../lib/content-gate';

const TABS = ['Subjects', 'Mock Exam', 'Notes'];

export default function StudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createStudyStyles(theme), [theme]);
  const subjectMeta = useMemo(
    () => [
      { emoji: '📚', color: colors.primary, bg: colors.primaryMuted },
      { emoji: '🎓', color: '#7B2CBF', bg: theme.isDark ? '#2D1F45' : '#F1E8FA' },
      { emoji: '🔬', color: colors.accentDark, bg: colors.accentLight },
      { emoji: '🧮', color: colors.success, bg: colors.successBg },
      { emoji: '📝', color: colors.flame, bg: colors.errorBg },
    ],
    [colors, theme.isDark]
  );
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectArea[]>([]);
  const [examName, setExamName] = useState('');
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([]);
  const [materials, setMaterials] = useState<ReviewMaterial[]>([]);
  const [notesFilter, setNotesFilter] = useState<'all' | 'lesson' | 'cheat_sheet'>('all');
  const [activeTab, setActiveTab] = useState(0);
  const [contentGate, setContentGate] = useState<ContentGateStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const goal = await resolveOnboardingGoal(user?.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      const exam = await fetchExamBySlug(slug);
      if (!exam) {
        setLoading(false);
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
      setContentGate(await fetchContentGateStatus(slug));
    } catch {
      /* load failed */
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    const premium = isPremium(examTypeId);
    const access = getMockAccess(mock, premium);

    if (access === 'weekly_limit') {
      const used = await hasUsedMiniMockThisWeek();
      if (used) {
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
      await recordMiniMockUsed();
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
      'Board Exam Mode',
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
    const filters: { id: typeof notesFilter; label: string }[] = [
      { id: 'all', label: 'All' },
      { id: 'lesson', label: 'Lessons' },
      { id: 'cheat_sheet', label: 'Cheat sheets' },
    ];

    return (
      <>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setNotesFilter(f.id)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 999,
                backgroundColor: notesFilter === f.id ? colors.primaryMuted : colors.surface,
                borderWidth: 1,
                borderColor: notesFilter === f.id ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: 13,
                  color: notesFilter === f.id ? colors.primary : colors.textMuted,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="document-text-outline" size={32} color={colors.primary} />}
            title="No notes yet"
            description="Micro-lessons and cheat sheets will appear here as we import content."
          />
        ) : (
          [...materialsBySubject.entries()].map(([subjectName, items]) => (
            <View key={subjectName}>
              <Text style={[styles.subjectName, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>{subjectName}</Text>
              {items.map((m) => (
                <Pressable
                  key={m.id}
                  style={styles.subjectCard}
                  onPress={() =>
                    router.push({
                      pathname: '/study/lesson/[id]',
                      params: { id: m.id, examSlug },
                    })
                  }
                >
                  <View style={styles.subjectTop}>
                    <View
                      style={[
                        styles.subjectIcon,
                        { backgroundColor: m.materialType === 'cheat_sheet' ? colors.accentLight : colors.primaryMuted },
                      ]}
                    >
                      <Ionicons
                        name={m.materialType === 'cheat_sheet' ? 'clipboard-outline' : 'reader-outline'}
                        size={22}
                        color={m.materialType === 'cheat_sheet' ? colors.accentDark : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{m.title}</Text>
                      <Text style={styles.subjectMeta}>
                        {m.topicName} · {m.materialType === 'cheat_sheet' ? 'Cheat sheet' : 'Lesson'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={tabScrollPaddingWithFooter(insets)}>
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
          <Text style={styles.headerTitle}>{examName || 'Your exam'}</Text>
          <Text style={styles.headerSub}>
            {subjects.length} subject{subjects.length === 1 ? '' : 's'} · {questionCount} published question
            {questionCount === 1 ? '' : 's'}
          </Text>
          {questionCount === 0 ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                Content is still loading in — practice questions will appear here as we import them.
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {contentGate ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <ContentGateBanner theme={theme} status={contentGate} />
          </View>
        ) : null}

        <View style={styles.tabs}>
          {TABS.map((t, i) => (
            <Pressable
              key={t}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.body}>
          {!isPremium(examTypeId) ? (
            <AdBanner onPress={() => router.push('/subscribe')} />
          ) : null}
          {activeTab === 1 ? (
            mockExams.length === 0 ? (
              <EmptyState
              icon={<Ionicons name="timer-outline" size={32} color={colors.primary} />}
              title="No mock exams yet"
              description="Full and mini mocks will appear here as we add content for your exam."
            />
            ) : (
              <>
                <Pressable style={styles.subjectCard} onPress={launchBoardExam}>
                  <View style={styles.subjectTop}>
                    <View style={[styles.subjectIcon, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>Board Exam Mode</Text>
                      <Text style={styles.subjectMeta}>
                        30 items · 45 min · No hints · Section breaks
                        {!isPremium(examTypeId) ? ' · Premium' : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
                {mockExams.map((mock) => (
                <Pressable key={mock.id} style={styles.subjectCard} onPress={() => launchMock(mock)}>
                  <View style={styles.subjectTop}>
                    <View style={[styles.subjectIcon, { backgroundColor: colors.errorBg }]}>
                      <Ionicons name="timer" size={22} color={colors.flame} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{mock.title}</Text>
                      <Text style={styles.subjectMeta}>
                        {mock.itemCount} items · {Math.round(mock.durationSeconds / 60)} min
                        {!isPremium(examTypeId) && isMiniMock(mock) ? ' · 1/week free' : ''}
                        {!isPremium(examTypeId) && mock.itemCount > FREE_MOCK_PREVIEW_ITEMS && !isMiniMock(mock)
                          ? ` · Preview ${FREE_MOCK_PREVIEW_ITEMS}`
                          : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
              ))}
              </>
            )
          ) : activeTab === 2 ? (
            renderNotesTab()
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="book-outline" size={32} color={colors.primary} />}
              title="No subjects yet"
              description="We're adding subjects for your exam. Try again later or change your exam track in Settings."
              actionLabel="Try again"
              onAction={load}
            />
          ) : (
            subjects.map((s, i) => {
              const meta = subjectMeta[i % subjectMeta.length];
              const analytics = analyticsBySubject.get(s.name.toLowerCase());
              const avg = analytics?.averageAccuracy ?? 0;
              const attempts = analytics?.topics.reduce((sum, t) => sum + t.attempts, 0) ?? 0;
              return (
                <Pressable
                  key={s.id}
                  style={styles.subjectCard}
                  onPress={() =>
                    router.push({
                      pathname: '/study/[subjectSlug]',
                      params: { subjectSlug: s.slug, examSlug },
                    })
                  }
                >
                  <View style={styles.subjectTop}>
                    <View style={[styles.subjectIcon, { backgroundColor: meta.bg }]}>
                      <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{s.name}</Text>
                      <Text style={styles.subjectMeta}>
                        {attempts > 0 ? `${avg}% mastery · ${attempts} attempts` : 'Tap to view topics & practice'}
                      </Text>
                      {attempts > 0 ? (
                        <MasteryBar accuracy={avg} attempts={attempts} style={{ marginTop: spacing.sm }} />
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <LinearGradient
        colors={[colors.footerFade, colors.background]}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <PrimaryButton
          label="Start practice quiz"
          icon="flash"
          iconPosition="left"
          size="lg"
          onPress={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
        />
      </LinearGradient>
    </View>
  );
}
