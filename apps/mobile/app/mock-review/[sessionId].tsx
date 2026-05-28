import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoiceOption } from '../../components/choice-option';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createListScreenStyles } from '../../lib/themed-styles';
import { fetchSessionReview, type SessionReviewItem } from '../../lib/api/quiz';
import { MOCK_PASS_THRESHOLD } from '../../lib/api/mock-history';
import { useAuth } from '../../providers/auth-provider';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function MockReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, fonts } = theme;
  const styles = useMemo(() => createListScreenStyles(theme), [theme]);
  const { user } = useAuth();
  const { sessionId, score, title } = useLocalSearchParams<{
    sessionId?: string;
    score?: string;
    title?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [review, setReview] = useState<SessionReviewItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    try {
      setReview(await fetchSessionReview(sessionId));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const scoreNum = Number(score) || 0;
  const passed = scoreNum >= MOCK_PASS_THRESHOLD;

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="Mock review requires a signed-in account."
          actionLabel="Log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
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
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{title ?? 'Mock review'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, color: passed ? colors.success : colors.flame }}>
              {Math.round(scoreNum)}%
            </Text>
            <Pill color={passed ? colors.success : colors.flame}>{passed ? 'PASS' : 'REVIEW'}</Pill>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
              Pass ≥ {MOCK_PASS_THRESHOLD}%
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : review.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="help-circle-outline" size={32} color={colors.primary} />}
              title="No review data"
              description="Could not load answers for this mock session."
            />
          ) : (
            review.map((item, i) => {
              const expanded = expandedId === item.questionId;
              const explanation = item.explanationEn ?? item.explanationFil;
              return (
                <Pressable
                  key={item.questionId}
                  onPress={() => setExpandedId(expanded ? null : item.questionId)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    borderWidth: 1,
                    borderColor: item.isCorrect ? colors.success + '44' : colors.error + '44',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 8 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted }}>
                      Q{i + 1}
                    </Text>
                    <Pill color={item.isCorrect ? colors.success : colors.error}>
                      {item.isCorrect ? 'Correct' : 'Wrong'}
                    </Pill>
                  </View>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                    {item.stem}
                  </Text>
                  {expanded ? (
                    <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                      {item.choices.map((c, ci) => (
                        <ChoiceOption
                          key={c.id}
                          letter={LETTERS[ci] ?? String(ci + 1)}
                          label={c.text}
                          selected={item.selectedChoiceId === c.id}
                          correct={c.id === item.correctChoiceId}
                          wrong={item.selectedChoiceId === c.id && c.id !== item.correctChoiceId}
                          disabled
                          onPress={() => {}}
                        />
                      ))}
                      {explanation ? (
                        <Text
                          style={{
                            fontFamily: fonts.bodyMedium,
                            fontSize: 13,
                            color: colors.textMuted,
                            marginTop: spacing.sm,
                            lineHeight: 18,
                          }}
                        >
                          {explanation}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary, marginTop: 6 }}>
                      Tap to review answers
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
