import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoiceOption } from '../../components/choice-option';
import { EmptyState } from '../../components/empty-state';
import { IconButton } from '../../components/icon-button';
import { ErrorState } from '../../components/error-state';
import { Pill } from '../../components/pill';
import { ReportContentButton } from '../../components/report-content-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createListScreenStyles } from '../../lib/themed-styles';
import { fetchSessionReview, type SessionReviewItem } from '../../lib/api/quiz';
import { MOCK_PASS_THRESHOLD } from '../../lib/api/mock-history';
import { toUserFacingError } from '../../lib/errors/user-facing';
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      setReview(await fetchSessionReview(sessionId));
    } catch (err) {
      setLoadError(toUserFacingError(err));
      setReview([]);
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
          title="Mag-log in muna"
          description="Kailangan ng signed-in account para sa mock review."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const renderItem = ({ item, index: i }: { item: SessionReviewItem; index: number }) => {
    const expanded = expandedId === item.questionId;
    const explanation = item.explanationEn ?? item.explanationFil;
    return (
      <Pressable
        onPress={() => setExpandedId(expanded ? null : item.questionId)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: spacing.md,
          marginBottom: spacing.sm,
          marginHorizontal: spacing.lg,
          borderWidth: 1,
          borderColor: item.isCorrect ? colors.success + '44' : colors.error + '44',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 8 }}>
          <Ionicons
            name={item.isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={item.isCorrect ? colors.success : colors.error}
          />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted }}>
            Q{i + 1}
          </Text>
          <Pill color={item.isCorrect ? colors.success : colors.error}>
            {item.isCorrect ? 'Correct' : 'Wrong'}
          </Pill>
        </View>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text, lineHeight: 23 }}>
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
                  fontSize: 15,
                  color: colors.textMuted,
                  marginTop: spacing.sm,
                  lineHeight: 22,
                }}
              >
                {explanation}
              </Text>
            ) : null}
            <ReportContentButton
              contentType="question"
              contentId={item.questionId}
              label="Flag question"
              compact
              style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
            />
          </View>
        ) : (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary, marginTop: 6 }}>
            Tap to review answers
          </Text>
        )}
      </Pressable>
    );
  };

  const ListHeader = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <IconButton
        variant="plain"
        buttonSize={28}
        size={22}
        icon="chevron-back"
        color={colors.text}
        hitSlop={8}
        accessibilityLabel="Go back"
        onPress={() => router.back()}
      />
      <Text style={styles.title} numberOfLines={2}>{title ?? 'Mock review'}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginTop: spacing.sm,
        }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: passed ? colors.success : colors.flame }}>
          {Math.round(scoreNum)}%
        </Text>
        <Pill color={passed ? colors.success : colors.flame}>{passed ? 'PASS' : 'REVIEW'}</Pill>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
          Pass ≥ {MOCK_PASS_THRESHOLD}%
        </Text>
      </View>
    </View>
  );

  const ListEmpty = loading ? (
    <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
  ) : loadError ? (
    <ErrorState description={loadError} onRetry={() => { setLoading(true); void load(); }} />
  ) : (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <EmptyState
        icon={<Ionicons name="help-circle-outline" size={32} color={colors.primary} />}
        title="No review data"
        description="Could not load answers for this mock session."
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={loading ? [] : review}
        keyExtractor={(item) => item.questionId}
        renderItem={renderItem}
        extraData={expandedId}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        initialNumToRender={8}
        windowSize={11}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
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
