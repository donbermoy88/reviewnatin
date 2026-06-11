import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { ReportContentButton } from '../../components/report-content-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createListScreenStyles } from '../../lib/themed-styles';
import {
  fetchBookmarkedMaterials,
  fetchBookmarkedQuestions,
  toggleBookmark,
  toggleMaterialBookmark,
  type BookmarkItem,
  type MaterialBookmarkItem,
} from '../../lib/api/bookmarks';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

type Tab = 'questions' | 'lessons';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, fonts } = theme;
  const styles = useMemo(() => createListScreenStyles(theme), [theme]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<BookmarkItem[]>([]);
  const [materials, setMaterials] = useState<MaterialBookmarkItem[]>([]);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);

  const load = useCallback(async () => {
    try {
      const goal = await resolveOnboardingGoal(user?.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      if (!user) {
        setQuestions([]);
        setMaterials([]);
        return;
      }
      const [q, m] = await Promise.all([
        fetchBookmarkedQuestions(user.id),
        fetchBookmarkedMaterials(slug),
      ]);
      setQuestions(q);
      setMaterials(m);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const removeQuestion = async (questionId: string) => {
    if (!user) return;
    await toggleBookmark(user.id, questionId, true);
    setQuestions((prev) => prev.filter((i) => i.questionId !== questionId));
  };

  const removeMaterial = async (materialId: string) => {
    if (!user) return;
    await toggleMaterialBookmark(user.id, materialId, true);
    setMaterials((prev) => prev.filter((i) => i.materialId !== materialId));
  };

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="bookmark-outline" size={32} color={colors.primary} />}
          title="Mag-log in muna"
          description="Kailangan mo ng account para mag-save ng bookmarks."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const count = tab === 'questions' ? questions.length : materials.length;

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
          <Text style={styles.title}>Bookmarks</Text>
          <Text style={styles.sub}>
            {count} saved {tab === 'questions' ? 'question' : 'lesson'}
            {count === 1 ? '' : 's'}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            {([
              { id: 'questions' as const, label: 'Questions' },
              { id: 'lessons' as const, label: 'Lessons' },
            ]).map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: 10,
                  backgroundColor: tab === t.id ? colors.primaryMuted : colors.surface,
                  borderWidth: 1,
                  borderColor: tab === t.id ? colors.primary : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 13,
                    color: tab === t.id ? colors.primary : colors.textMuted,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : tab === 'questions' ? (
          questions.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="bookmark-outline" size={32} color={colors.primary} />}
              title="Wala pang bookmarks"
              description="I-tap ang bookmark icon habang nag-quiz para ma-save dito ang tanong."
              actionLabel="Mag-practice na"
              onAction={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
            />
          ) : (
            <>
              <PrimaryButton
                label={`Practice all bookmarks (${questions.length})`}
                size="lg"
                style={{ margin: spacing.lg }}
                onPress={() =>
                  router.push({
                    pathname: '/practice/quiz',
                    params: { examSlug, mode: 'bookmark_review' },
                  })
                }
              />
              {questions.map((item) => (
                <View key={item.questionId} style={styles.card}>
                  <Text style={styles.cardSubject}>
                    {item.subjectName}
                    {item.topicName ? ` · ${item.topicName}` : ''}
                  </Text>
                  <Text style={styles.cardStem}>{item.stem}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <PrimaryButton
                      label="Practice this"
                      variant="outline"
                      onPress={() =>
                        router.push({
                          pathname: '/practice/quiz',
                          params: { examSlug, mode: 'bookmark_review', focusQuestionId: item.questionId },
                        })
                      }
                    />
                    <ReportContentButton
                      contentType="question"
                      contentId={item.questionId}
                      label="Flag"
                      compact
                    />
                    <Pressable onPress={() => removeQuestion(item.questionId)} hitSlop={8} style={{ justifyContent: 'center' }}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )
        ) : materials.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="reader-outline" size={32} color={colors.primary} />}
            title="Walang naka-save na lesson"
            description="I-bookmark ang mga lesson at cheat sheet mula sa Notes tab."
            actionLabel="Pumunta sa Study"
            onAction={() => router.push('/(tabs)/study')}
          />
        ) : (
          materials.map((item) => (
            <View key={item.materialId} style={styles.card}>
              <Text style={styles.cardSubject}>
                {item.subjectName} · {item.topicName}
              </Text>
              <Text style={styles.cardStem}>{item.title}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                {item.preview}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <PrimaryButton
                  label="Open"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/study/lesson/[id]',
                      params: { id: item.materialId, examSlug },
                    })
                  }
                />
                <ReportContentButton
                  contentType="review_material"
                  contentId={item.materialId}
                  label="Flag"
                  compact
                />
                <Pressable onPress={() => removeMaterial(item.materialId)} hitSlop={8} style={{ justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
