import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/primary-button';
import { colors, spacing } from '../../constants/theme';
import { syncExamGoal } from '../../lib/api/goals';
import { saveOnboarding } from '../../lib/onboarding-store';
import { useAuth } from '../../providers/auth-provider';

const EXAMS = [
  { slug: 'cse-professional', label: 'CSE Professional' },
  { slug: 'cse-subprofessional', label: 'CSE Subprofessional' },
  { slug: 'let-elementary', label: 'LET Elementary' },
  { slug: 'let-secondary', label: 'LET Secondary' },
  { slug: 'pnle', label: 'PNLE (Nursing)' },
];

const MINUTES = [15, 30, 45, 60];

export default function OnboardingScreen() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [examSlug, setExamSlug] = useState('cse-professional');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [level, setLevel] = useState<'beginner' | 'average' | 'advanced'>('beginner');
  const [targetDate, setTargetDate] = useState('2026-08-01');

  useEffect(() => {
    if (stepParam === '3') setStep(3);
  }, [stepParam]);

  const finish = async () => {
    const data = { examSlug, targetDate, dailyMinutes, level, completed: true as const };
    await saveOnboarding(data);
    if (user) {
      try {
        await syncExamGoal(user.id, data);
      } catch {
        /* continue */
      }
    }
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>ReviewNatin</Text>
        <Text style={styles.tagline}>Review together. Pass together.</Text>
      </View>

      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.title}>Anong exam ang hinahanda mo?</Text>
          {EXAMS.map((e) => (
            <Pressable
              key={e.slug}
              style={[styles.option, examSlug === e.slug && styles.optionActive]}
              onPress={() => setExamSlug(e.slug)}
            >
              <Text style={[styles.optionText, examSlug === e.slug && styles.optionTextActive]}>{e.label}</Text>
            </Pressable>
          ))}
          <PrimaryButton label="Susunod" onPress={() => setStep(1)} style={{ marginTop: spacing.md }} />
        </View>
      )}

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.title}>Target exam date</Text>
          <TextInput
            style={styles.input}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.subtitle}>Mag-review araw-araw ng</Text>
          <View style={styles.row}>
            {MINUTES.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, dailyMinutes === m && styles.chipActive]}
                onPress={() => setDailyMinutes(m)}
              >
                <Text style={[styles.chipText, dailyMinutes === m && styles.chipTextActive]}>{m} min</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.subtitle}>Level mo ngayon</Text>
          {(['beginner', 'average', 'advanced'] as const).map((l) => (
            <Pressable
              key={l}
              style={[styles.option, level === l && styles.optionActive]}
              onPress={() => setLevel(l)}
            >
              <Text style={[styles.optionText, level === l && styles.optionTextActive]}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </Text>
            </Pressable>
          ))}
          <PrimaryButton label="Susunod" onPress={() => setStep(2)} style={{ marginTop: spacing.md }} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.title}>I-save ang progress mo</Text>
          <Text style={styles.body}>
            Gumawa ng account para ma-sync ang quiz scores, mistake bank, at PasaPath sa Supabase.
          </Text>
          {user ? (
            <PrimaryButton label="May account na — Susunod" onPress={() => setStep(3)} />
          ) : (
            <>
              <PrimaryButton
                label="Mag-sign up / Mag-login"
                onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: 'onboarding' } })}
              />
              <PrimaryButton
                label="Skip muna (guest)"
                variant="outline"
                onPress={() => setStep(3)}
                style={{ marginTop: spacing.sm }}
              />
            </>
          )}
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.title}>Handa ka na sa PasaPath</Text>
          <Text style={styles.body}>
            Magsisimula ang araw-araw mong study path — weak topics, mistake review, at bagong lessons.
          </Text>
          <Text style={styles.disclaimer}>Hindi affiliated sa CSC o PRC. Independent reviewer lang ito.</Text>
          <PrimaryButton label="Pumasok sa Dashboard" onPress={finish} style={{ marginTop: spacing.md }} />
        </View>
      )}

      <Text style={styles.footer}>reviewnatinph.com</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  hero: { marginBottom: spacing.lg, marginTop: spacing.xl },
  brand: { fontSize: 32, fontWeight: '800', color: colors.primary },
  tagline: { fontSize: 16, color: colors.textMuted, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  subtitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm },
  body: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: spacing.md },
  disclaimer: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
  option: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: '#EEF3FF' },
  optionText: { fontSize: 15, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accentDark },
  chipText: { fontSize: 14, color: colors.text },
  chipTextActive: { fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  footer: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 12 },
});
