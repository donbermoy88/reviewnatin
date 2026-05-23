import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getOnboarding } from '../../lib/onboarding-store';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessRing } from '../../components/readiness-ring';
import { colors, spacing } from '../../constants/theme';

export default function PracticeResultScreen() {
  const router = useRouter();
  const [examSlug, setExamSlug] = useState('cse-professional');
  const { score, total, correct, duration } = useLocalSearchParams<{
    score: string;
    total: string;
    correct: string;
    duration: string;
  }>();

  useEffect(() => {
    getOnboarding().then((o) => {
      if (o?.examSlug) setExamSlug(o.examSlug);
    });
  }, []);

  const scoreNum = Number(score) || 0;
  const totalNum = Number(total) || 0;
  const correctNum = Number(correct) || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Tapos na ang practice!</Text>
      <ReadinessRing
        percent={scoreNum}
        label="Score sa session"
        hint={`${correctNum} / ${totalNum} tamang sagot · ${duration}s`}
      />

      <View style={styles.card}>
        <Text style={styles.tip}>
          {scoreNum >= 70
            ? 'Magaling! Ituloy ang PasaPath bukas para mapanatili ang momentum.'
            : 'Review ang mga maling sagot sa Mistake Bank (darating sa Week 3).'}
        </Text>
      </View>

      <PrimaryButton label="Bumalik sa Home" onPress={() => router.replace('/(tabs)')} />
      <PrimaryButton
        label="Practice ulit"
        variant="outline"
        onPress={() => router.replace({ pathname: '/practice/quiz', params: { examSlug } })}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tip: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
