import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, PanResponder, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createFlashcardStyles } from '../../lib/themed-styles';
import {
  fetchDueFlashcards,
  fetchFlashcardsByExam,
  reviewFlashcard,
  type Flashcard,
  type FlashcardRating,
} from '../../lib/api/flashcards';
import { getOfflineFlashcards } from '../../lib/offline/pack';
import { completePasaPathTask } from '../../lib/api/pasapath';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

const RATINGS: { rating: FlashcardRating; label: string; variant: 'outline' | 'primary' | 'success' }[] = [
  { rating: 1, label: 'Again', variant: 'outline' },
  { rating: 2, label: 'Hard', variant: 'outline' },
  { rating: 3, label: 'Good', variant: 'primary' },
  { rating: 4, label: 'Easy', variant: 'success' },
];

export default function FlashcardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createFlashcardStyles(theme), [theme]);
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    examSlug?: string;
    topicSlug?: string;
    subjectSlug?: string;
    limit?: string;
    pasapathTaskId?: string;
    mode?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [examSlug, setExamSlug] = useState(params.examSlug ?? DEFAULT_EXAM_SLUG);
  const [finished, setFinished] = useState(false);
  const [offlineMode, setOfflineMode] = useState(params.mode === 'offline');

  const limit = Math.max(Number(params.limit) || 20, 1);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = params.examSlug ?? goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);

    try {
      if (params.mode === 'offline') {
        const offline = await getOfflineFlashcards(slug);
        setOfflineMode(true);
        setCards(
          offline.slice(0, limit).map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            topicName: c.topic_name,
            subjectName: c.subject_name,
            topicSlug: c.topic_slug,
          }))
        );
      } else if (user) {
        const due = await fetchDueFlashcards(slug, {
          limit,
          topicSlug: params.topicSlug,
          subjectSlug: params.subjectSlug,
        });
        if (due.length > 0) {
          setCards(due);
        } else {
          setCards(await fetchFlashcardsByExam(slug, limit));
        }
      } else {
        setCards(await fetchFlashcardsByExam(slug, limit));
      }
    } catch {
      const offline = await getOfflineFlashcards(slug);
      if (offline.length) {
        setOfflineMode(true);
        setCards(
          offline.slice(0, limit).map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            topicName: c.topic_name,
            subjectName: c.subject_name,
            topicSlug: c.topic_slug,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, params.examSlug, params.topicSlug, params.subjectSlug, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50 && flipped) void rateCard(3);
      else if (g.dx > 50) goPrev();
    },
  });

  const card = cards[index];
  const totalCards = cards.length;

  const finishDeck = async () => {
    setFinished(true);
    if (user && params.pasapathTaskId) {
      try {
        await completePasaPathTask(examSlug, params.pasapathTaskId);
      } catch {
        /* non-blocking */
      }
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  const rateCard = async (rating: FlashcardRating) => {
    if (!card || submitting) return;

    setSubmitting(true);
    try {
      if (user && !offlineMode) {
        await reviewFlashcard(card.id, rating);
      }
      setReviewed((n) => n + 1);

      if (index < totalCards - 1) {
        setIndex((i) => i + 1);
        setFlipped(false);
      } else {
        await finishDeck();
      }
    } catch {
      Alert.alert('Could not save', 'Please try rating again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (finished || (!card && totalCards > 0)) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        <EmptyState
          icon={<Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />}
          title="Deck complete! 🎉"
          description={
            user
              ? `${reviewed} card${reviewed === 1 ? '' : 's'} reviewed — next review will follow your SM-2 schedule.`
              : 'Log in to save your spaced repetition progress.'
          }
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="layers-outline" size={32} color={colors.primary} />}
          title="No flashcards yet"
          description="Flashcard decks will appear as we import content for your exam."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <LinearGradient colors={[...gradients.screen]} style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topLbl}>Flashcards · SM-2</Text>
          <Text style={styles.topTitle}>{card.subjectName}</Text>
        </View>
        <Pill color={colors.primary}>{`${reviewed}/${totalCards}`}</Pill>
      </View>

      <Text style={styles.counter}>
        Card {index + 1} of {totalCards} · Tap card to flip, then rate
      </Text>

      <View style={styles.stackArea} {...panResponder.panHandlers}>
        <Pressable style={styles.cardFront} onPress={() => setFlipped((f) => !f)}>
          <Pill color={colors.primary} bg={colors.primaryMuted}>
            {flipped ? 'DEFINITION · TAP TO FLIP' : 'TERM · TAP TO FLIP'}
          </Pill>
          <View style={styles.cardBody}>
            <Text style={[styles.term, flipped && styles.termSmall]}>{flipped ? card.back : card.front}</Text>
            {!flipped ? <Text style={styles.topicLbl}>{card.topicName}</Text> : null}
          </View>
          <View style={styles.flipHint}>
            <Ionicons name="refresh" size={16} color={colors.textLight} />
            <Text style={styles.flipText}>Tap to {flipped ? 'see term' : 'see definition'}</Text>
          </View>
        </Pressable>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg, flexWrap: 'wrap' }]}>
        <PrimaryButton label="← Prev" variant="outline" style={styles.actionBtn} onPress={goPrev} disabled={index === 0} />
        {RATINGS.map((r) => (
          <PrimaryButton
            key={r.rating}
            label={r.label}
            variant={r.variant}
            style={[styles.actionBtn, { minWidth: '22%' }]}
            onPress={() => {
              if (!flipped) {
                Alert.alert('Flip first', 'Tap the card to reveal the answer before rating.');
                return;
              }
              void rateCard(r.rating);
            }}
            disabled={submitting}
          />
        ))}
      </View>
    </LinearGradient>
  );
}
