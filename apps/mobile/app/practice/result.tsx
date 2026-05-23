import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/card';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessRing } from '../../components/readiness-ring';
import { ScreenScroll } from '../../components/screen-scroll';
import { spacing, type } from '../../constants/theme';
import { getOnboarding } from '../../lib/onboarding-store';

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
    <ScreenScroll>
      <Text style={styles.title}>Tapos na ang practice!</Text>
      <ReadinessRing
        percent={scoreNum}
        label="Score sa session"
        hint={`${correctNum} / ${totalNum} tamang sagot · ${duration}s`}
      />

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.tip}>
          {scoreNum >= 70
            ? 'Magaling! Ituloy ang PasaPath bukas para mapanatili ang momentum.'
            : 'Review ang mga maling sagot sa Mistake Bank (darating sa Week 3).'}
        </Text>
      </Card>

      <PrimaryButton label="Bumalik sa Home" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing.lg }} />
      <PrimaryButton
        label="Practice ulit"
        variant="outline"
        onPress={() => router.replace({ pathname: '/practice/quiz', params: { examSlug } })}
        style={{ marginTop: spacing.sm }}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  title: { ...type.headline, marginBottom: spacing.sm },
  tip: { ...type.body },
});
