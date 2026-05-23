import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChoiceOption } from '../../components/choice-option';
import { PrimaryButton } from '../../components/primary-button';
import { colors, spacing } from '../../constants/theme';
import { fetchExamBySlug, fetchPracticeQuestions } from '../../lib/api/catalog';
import { completePracticeSession, createPracticeSession, saveQuizAnswers } from '../../lib/api/quiz';
import type { Question, QuizAnswerRecord } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';

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
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  const startedAt = useRef(Date.now());
  const questionStarted = useRef(Date.now());

  useEffect(() => {
    fetchPracticeQuestions(slug)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [slug]);

  const current = questions[index];

  const submitChoice = useCallback(
    (choiceId: string) => {
      if (!current || revealed) return;
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
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Walang tanong pa</Text>
        <Text style={styles.emptyBody}>
          May 1 demo question lang sa database ngayon. Mag-import pa ng content sa admin.
        </Text>
        <PrimaryButton label="Bumalik" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.progress}>
        Item {index + 1} / {questions.length}
        {current.topic?.subject?.name ? ` · ${current.topic.subject.name}` : ''}
      </Text>
      <Text style={styles.stem}>{current.stem}</Text>

      {current.choices.map((c) => (
        <ChoiceOption
          key={c.id}
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
          <Text style={styles.explanationTitle}>Explanation</Text>
          <Text style={styles.explanationEn}>{current.explanation_en}</Text>
          {current.explanation_fil ? (
            <Text style={styles.explanationFil}>{current.explanation_fil}</Text>
          ) : null}
        </View>
      )}

      {revealed && (
        <PrimaryButton
          label={index < questions.length - 1 ? 'Susunod na tanong' : 'Tingnan ang resulta'}
          onPress={goNext}
          style={{ marginTop: spacing.md }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.background },
  progress: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, fontWeight: '600' },
  stem: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 26, marginBottom: spacing.lg },
  explanation: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  explanationEn: { fontSize: 14, color: colors.text, lineHeight: 21 },
  explanationFil: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm, fontStyle: 'italic' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
});
