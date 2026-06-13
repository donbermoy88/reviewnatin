import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { ReportContentButton } from '../../components/report-content-button';
import { useAppTheme } from '../../hooks/use-app-theme';
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
import { shuffleArray } from '../../lib/shuffle';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

export default function FlashcardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, radii, fonts } = theme;
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
  const [knowCount, setKnowCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [examSlug, setExamSlug] = useState(params.examSlug ?? DEFAULT_EXAM_SLUG);
  const [finished, setFinished] = useState(false);
  const [offlineMode, setOfflineMode] = useState(params.mode === 'offline');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // 3D flip animation — Animated.Value is mutable; useMemo keeps a stable
  // identity without tripping react-hooks/refs by reading .current in render.
  const flipAnim = useMemo(() => new Animated.Value(0), []);
  const isFlipping = useRef(false);

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
          shuffleArray(offline).slice(0, limit).map((c) => ({
            id: c.id, front: c.front, back: c.back,
            topicName: c.topic_name, subjectName: c.subject_name, topicSlug: c.topic_slug,
          }))
        );
      } else if (user) {
        const due = await fetchDueFlashcards(slug, { limit, topicSlug: params.topicSlug, subjectSlug: params.subjectSlug });
        setCards(due.length > 0 ? due : await fetchFlashcardsByExam(slug, limit, params.subjectSlug));
      } else {
        setCards(await fetchFlashcardsByExam(slug, limit, params.subjectSlug));
      }
    } catch {
      const offline = await getOfflineFlashcards(slug);
      if (offline.length) {
        setOfflineMode(true);
        setCards(shuffleArray(offline).slice(0, limit).map((c) => ({
          id: c.id, front: c.front, back: c.back,
          topicName: c.topic_name, subjectName: c.subject_name, topicSlug: c.topic_slug,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [user, params.examSlug, params.mode, params.topicSlug, params.subjectSlug, limit]);

  useEffect(() => { void load(); }, [load]);

  // When card changes, reset flip
  useEffect(() => {
    flipAnim.setValue(0);
    setFlipped(false);
  }, [flipAnim, index]);

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backInterpolate  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const triggerFlip = () => {
    if (isFlipping.current) return;
    isFlipping.current = true;
    const toValue = flipped ? 0 : 180;
    Animated.spring(flipAnim, { toValue, friction: 8, tension: 40, useNativeDriver: true }).start(() => {
      setFlipped(!flipped);
      isFlipping.current = false;
    });
  };

  // Unique subject names for filter
  const subjects = useMemo(() => {
    const s = new Set(cards.map(c => c.subjectName).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [cards]);

  const filteredCards = useMemo(() => {
    return subjectFilter === 'all' ? cards : cards.filter(c => c.subjectName === subjectFilter);
  }, [cards, subjectFilter]);

  const card = filteredCards[index < filteredCards.length ? index : 0];
  const totalCards = filteredCards.length;

  const finishDeck = async () => {
    setFinished(true);
    if (user && params.pasapathTaskId) {
      try { await completePasaPathTask(examSlug, params.pasapathTaskId); } catch { /* non-blocking */ }
    }
  };

  const rateCard = async (rating: FlashcardRating, isKnown: boolean) => {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      if (user && !offlineMode) await reviewFlashcard(card.id, rating);
      if (isKnown) setKnowCount(n => n + 1);
      else setReviewCount(n => n + 1);
      if (index < totalCards - 1) setIndex(i => i + 1);
      else await finishDeck();
    } catch {
      Alert.alert('Could not save', 'Please try rating again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIndex(0); setFlipped(false); setKnowCount(0); setReviewCount(0);
    setFinished(false); flipAnim.setValue(0);
  };

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // ── EMPTY ──────────────────────────────────────────────────────────────────
  if (!card && !finished) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <EmptyState
          icon={<Ionicons name="layers-outline" size={32} color={colors.primary} />}
          title="Wala pang flashcards"
          description="Lalabas dito ang mga flashcard deck kapag may content na para sa exam track mo."
          actionLabel="Bumalik"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // ── FINISHED SCREEN ────────────────────────────────────────────────────────
  if (finished) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ flex: 1, paddingTop: insets.top }}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 72, marginBottom: spacing.md }}>🎉</Text>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, color: '#fff', marginBottom: spacing.sm, textAlign: 'center', letterSpacing: -0.5 }}>
            Deck Complete!
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: spacing.xl, textAlign: 'center' }}>
            You went through all {totalCards} flashcards.
          </Text>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.xl }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 36, color: '#4ADE80', letterSpacing: -1 }}>{knowCount}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>I Know This</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 36, color: '#FB7185', letterSpacing: -1 }}>{reviewCount}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>Review Again</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%' }}>
            <Pressable
              onPress={handleReset}
              style={{ flex: 1, height: 50, borderRadius: radii.lg, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' }}>Restart</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={{ flex: 1, height: 50, borderRadius: radii.lg, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary }}>Done</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ height: insets.bottom }} />
      </LinearGradient>
    );
  }

  // ── MAIN CARD SCREEN ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="chevron-back" size={15} color="rgba(255,255,255,0.85)" />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Back</Text>
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' }}>Flashcards</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
              {index + 1} / {totalCards}
            </Text>
          </View>

          <Pressable
            onPress={handleReset}
            hitSlop={8}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 }}
          >
            <Ionicons name="refresh" size={15} color="rgba(255,255,255,0.75)" />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${((index) / totalCards) * 100}%`,
              backgroundColor: colors.accent,
              borderRadius: 999,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{knowCount} known</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{reviewCount} to review</Text>
        </View>
      </LinearGradient>

      {/* ── Subject Filter ── */}
      {subjects.length > 2 && (
        <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}>
            {subjects.map(s => (
              <Pressable
                key={s}
                onPress={() => { setSubjectFilter(s); setIndex(0); setFlipped(false); flipAnim.setValue(0); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: subjectFilter === s ? colors.primary : '#fff',
                  borderWidth: 1.5,
                  borderColor: subjectFilter === s ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: subjectFilter === s ? '#fff' : colors.textMuted }}>
                  {s === 'all' ? 'All Cards' : s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Card Area ── */}
      <View style={{ flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        {/* Subject badge */}
        <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
          <View style={{ backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary, letterSpacing: 0.4 }}>
              {card.subjectName?.toUpperCase() ?? 'FLASHCARD'}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', marginBottom: spacing.sm }}>
          <ReportContentButton
            contentType="flashcard"
            contentId={card.id}
            label="Flag card"
            compact
          />
        </View>

        {/* 3D Flip Card */}
        <Pressable onPress={triggerFlip} style={{ flex: 1 }}>
          <View style={{ flex: 1, position: 'relative' }}>
            {/* FRONT */}
            <Animated.View
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backfaceVisibility: 'hidden',
                transform: [{ perspective: 1200 }, { rotateY: frontInterpolate }],
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: spacing.lg,
                shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <Ionicons name="eye-outline" size={24} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: colors.text, textAlign: 'center', lineHeight: 26, letterSpacing: -0.3 }}>
                {card.front}
              </Text>
              {card.topicName ? (
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: spacing.sm }}>
                  {card.topicName}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg }}>
                <Ionicons name="refresh" size={13} color={colors.textLight} />
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight }}>I-tap para makita ang sagot</Text>
              </View>
            </Animated.View>

            {/* BACK */}
            <Animated.View
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backfaceVisibility: 'hidden',
                transform: [{ perspective: 1200 }, { rotateY: backInterpolate }],
                backgroundColor: colors.background,
                borderRadius: 20,
                padding: spacing.lg,
                shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                justifyContent: 'center',
                borderWidth: 2, borderColor: colors.primary,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Answer
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 24 }}>
                {card.back}
              </Text>
            </Animated.View>
          </View>
        </Pressable>

        {/* ── Action Buttons ── */}
        <View style={{ paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md }}>
          {flipped ? (
            // "I Know This" / "Review Again" — shown when flipped
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => void rateCard(1, false)}
                disabled={submitting}
                style={{
                  flex: 1, backgroundColor: '#FFEEE4', borderWidth: 1.5, borderColor: '#FCA5A5',
                  borderRadius: 14, paddingVertical: spacing.md, alignItems: 'center', gap: 6,
                }}
              >
                <Ionicons name="refresh" size={22} color="#EF4444" />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#EF4444' }}>Review Again</Text>
              </Pressable>
              <Pressable
                onPress={() => void rateCard(4, true)}
                disabled={submitting}
                style={{
                  flex: 1, backgroundColor: '#DCFCE7', borderWidth: 1.5, borderColor: '#86EFAC',
                  borderRadius: 14, paddingVertical: spacing.md, alignItems: 'center', gap: 6,
                }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#22C55E' }}>I Know This!</Text>
              </Pressable>
            </View>
          ) : (
            // Prev / Reveal / Next — shown when front showing
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Pressable
                onPress={() => index > 0 && (setIndex(i => i - 1))}
                disabled={index === 0}
                style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: index === 0 ? colors.border : colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="chevron-back" size={20} color={index === 0 ? colors.textLight : colors.primary} />
              </Pressable>
              <Pressable
                onPress={triggerFlip}
                style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' }}>Ipakita ang sagot</Text>
              </Pressable>
              <Pressable
                onPress={() => index < totalCards - 1 && (setIndex(i => i + 1), setFlipped(false), flipAnim.setValue(0))}
                disabled={index >= totalCards - 1}
                style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: index >= totalCards - 1 ? colors.border : colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="chevron-forward" size={20} color={index >= totalCards - 1 ? colors.textLight : colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
