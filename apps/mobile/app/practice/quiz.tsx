import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChoiceOption } from '../../components/choice-option';
import { PrimaryButton } from '../../components/primary-button';
import { ProgressBar } from '../../components/progress-bar';
import { ScreenScroll } from '../../components/screen-scroll';
import { EmptyState } from '../../components/empty-state';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../../constants/theme';
import { fetchExamBySlug, fetchPracticeQuestions } from '../../lib/api/catalog';
import { completePracticeSession, createPracticeSession, saveQuizAnswers } from '../../lib/api/quiz';
import type { Question, QuizAnswerRecord } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function PracticeQuizScreen() {
  const router = useRouter();
  const { examSlug } = useLocalSearchParams<{ examSlug: string }>();
  const slug = examSlug ?? 'cse-professional';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [lang, setLang] = useState<'en' | 'fil'>('en');
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  const startedAt = useRef(Date.now());
  const questionStarted = useRef(Date.now());

  useEffect(() => {
    fetchPracticeQuestions(slug)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [slug]);

  const current = questions[index];
  const progressPct = questions.length ? ((index + (revealed ? 1 : 0)) / questions.length) * 100 : 0;

  const submitChoice = useCallback(
    (choiceId: string) => {
      if (!current || revealed) return;
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelected(choiceId);
      setRevealed(true);
      const elapsed = Math.round((Date.now() - questionStarted.current) / 1000);
      setAnswers((prev) => [
        ...prev,
        {
          questionId: current.id,
          selectedChoiceId: choiceId,
          isCorrect: choiceId === current.correct_choice_id,
          timeSpentSeconds: elapsed,
        },
      ]);
    },
    [current, revealed]
  );

  const goNext = async () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      questionStarted.current = Date.now();
      return;
    }

    const totalCorrect = answers.filter((a) => a.isCorrect).length;
    const score = questions.length ? Math.round((totalCorrect / questions.length) * 100) : 0;
    const duration = Math.round((Date.now() - startedAt.current) / 1000);

    if (user) {
      try {
        const exam = await fetchExamBySlug(slug);
        if (exam) {
          const sessionId = await createPracticeSession(user.id, exam.id, questions.length);
          if (sessionId) {
            await saveQuizAnswers(sessionId, answers);
            await completePracticeSession(sessionId, score, duration);
          }
        }
      } catch {
        /* guest or offline */
      }
    }

    router.replace({
      pathname: '/practice/result',
      params: {
        score: String(score),
        total: String(questions.length),
        correct: String(totalCorrect),
        duration: String(duration),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!questions.length || !current) {
    return (
      <ScreenScroll>
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={32} color={colors.primary} />}
          title="Walang tanong pa"
          description="May 1 demo question lang sa database ngayon. Mag-import pa ng content sa admin."
          actionLabel="Bumalik"
          onAction={() => router.back()}
        />
      </ScreenScroll>
    );
  }

  const explanation =
    lang === 'fil' && current.explanation_fil ? current.explanation_fil : current.explanation_en;

  return (
    <ScreenScroll>
      <ProgressBar progress={progressPct} label={`Item ${index + 1} of ${questions.length}`} showPercent={false} />
      {current.topic?.subject?.name ? (
        <Text style={styles.topic}>{current.topic.subject.name}</Text>
      ) : null}
      <Text style={styles.stem}>{current.stem}</Text>

      {current.choices.map((c, i) => (
        <ChoiceOption
          key={c.id}
          letter={LETTERS[i] ?? String(i + 1)}
          label={c.text}
          selected={selected === c.id}
          correct={revealed && c.id === current.correct_choice_id}
          wrong={revealed && selected === c.id && c.id !== current.correct_choice_id}
          disabled={revealed}
          onPress={() => submitChoice(c.id)}
        />
      ))}

      {revealed && (
        <View style={styles.explanation}>
          <View style={styles.explanationHeader}>
            <Text style={styles.explanationTitle}>Explanation</Text>
            <View style={styles.langToggle}>
              <Pressable
                style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
                onPress={() => setLang('en')}
              >
                <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>EN</Text>
              </Pressable>
              <Pressable
                style={[styles.langBtn, lang === 'fil' && styles.langBtnActive]}
                onPress={() => setLang('fil')}
              >
                <Text style={[styles.langText, lang === 'fil' && styles.langTextActive]}>TL</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.explanationBody}>{explanation}</Text>
        </View>
      )}

      {revealed && (
        <PrimaryButton
          label={index < questions.length - 1 ? 'Susunod na tanong' : 'Tingnan ang resulta'}
          onPress={goNext}
          style={{ marginTop: spacing.md }}
        />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  topic: { ...type.caption, color: colors.primary, marginTop: spacing.sm, marginBottom: spacing.xs },
  stem: { ...type.title, fontSize: 18, lineHeight: 26, marginBottom: spacing.lg },
  explanation: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  explanationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  explanationTitle: { ...type.subtitle, color: colors.primary },
  langToggle: { flexDirection: 'row', gap: 4, backgroundColor: colors.background, borderRadius: radii.sm, padding: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, minWidth: 36, alignItems: 'center' },
  langBtnActive: { backgroundColor: colors.primary },
  langText: { ...type.caption, color: colors.textMuted },
  langTextActive: { color: '#fff' },
  explanationBody: { ...type.body },
});
