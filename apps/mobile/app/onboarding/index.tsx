import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/card';
import { Chip } from '../../components/chip';
import { PrimaryButton } from '../../components/primary-button';
import { ScreenScroll } from '../../components/screen-scroll';
import { StepIndicator } from '../../components/step-indicator';
import { colors, radii, spacing, type } from '../../constants/theme';
import { DISCLAIMERS } from '@reviewnatin/shared';
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
const STEP_LABELS = ['Welcome', 'Exam', 'Goals', 'Account', 'PasaPath'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [examSlug, setExamSlug] = useState('cse-professional');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [level, setLevel] = useState<'beginner' | 'average' | 'advanced'>('beginner');
  const [targetDate, setTargetDate] = useState(new Date('2026-08-01'));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (stepParam === '4') setStep(4);
  }, [stepParam]);

  const dateStr = targetDate.toISOString().slice(0, 10);

  const finish = async () => {
    const data = { examSlug, targetDate: dateStr, dailyMinutes, level, completed: true as const };
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
    <ScreenScroll>
      <View style={styles.hero}>
        <Text style={styles.brand}>ReviewNatin</Text>
        <Text style={styles.tagline}>Review together. Pass together.</Text>
      </View>

      <StepIndicator current={step} total={5} labels={STEP_LABELS} />

      {step === 0 && (
        <Card variant="elevated">
          <Text style={styles.title}>Maligayang pagdating</Text>
          <Text style={styles.body}>
            Ang PasaPath ang araw-araw mong gabay — mula sa diagnostic hanggang exam day. Simulan natin
            sa ilang tanong.
          </Text>
          <Text style={styles.disclaimer}>{DISCLAIMERS.short}</Text>
          <PrimaryButton label="Simulan" onPress={() => setStep(1)} style={{ marginTop: spacing.md }} />
        </Card>
      )}

      {step === 1 && (
        <Card>
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
          <PrimaryButton label="Susunod" onPress={() => setStep(2)} style={{ marginTop: spacing.md }} />
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Text style={styles.title}>Target exam date</Text>
          <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.dateHint}>Tap to change</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={targetDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setTargetDate(date);
              }}
            />
          )}
          <Text style={styles.subtitle}>Mag-review araw-araw ng</Text>
          <View style={styles.row}>
            {MINUTES.map((m) => (
              <Chip key={m} label={`${m} min`} selected={dailyMinutes === m} onPress={() => setDailyMinutes(m)} />
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
          <PrimaryButton label="Susunod" onPress={() => setStep(3)} style={{ marginTop: spacing.md }} />
        </Card>
      )}

      {step === 3 && (
        <Card>
          <Text style={styles.title}>I-save ang progress mo</Text>
          <Text style={styles.body}>
            Gumawa ng account para ma-sync ang quiz scores, mistake bank, at PasaPath sa cloud.
          </Text>
          {user ? (
            <PrimaryButton label="May account na — Susunod" onPress={() => setStep(4)} />
          ) : (
            <>
              <PrimaryButton
                label="Mag-sign up / Mag-login"
                onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: 'onboarding' } })}
              />
              <PrimaryButton
                label="Skip muna (guest)"
                variant="outline"
                onPress={() => setStep(4)}
                style={{ marginTop: spacing.sm }}
              />
            </>
          )}
        </Card>
      )}

      {step === 4 && (
        <Card>
          <Text style={styles.title}>Handa ka na sa PasaPath</Text>
          <Text style={styles.body}>
            Magsisimula ang araw-araw mong study path — weak topics, mistake review, at bagong lessons.
          </Text>
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>Disclaimer</Text>
            <Text style={styles.disclaimer}>{DISCLAIMERS.short}</Text>
          </View>
          <PrimaryButton label="Pumasok sa Dashboard" onPress={finish} style={{ marginTop: spacing.md }} />
        </Card>
      )}

      <Text style={styles.footer}>reviewnatinph.com</Text>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md, marginTop: spacing.md },
  brand: { ...type.display },
  tagline: { ...type.bodyMuted, marginTop: spacing.xs },
  title: { ...type.title, marginBottom: spacing.md },
  subtitle: { ...type.subtitle, marginTop: spacing.md, marginBottom: spacing.sm },
  body: { ...type.body, marginBottom: spacing.md },
  disclaimerBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  disclaimerTitle: { ...type.caption, color: colors.text, fontFamily: type.label.fontFamily },
  disclaimer: { ...type.caption, marginTop: spacing.xs, lineHeight: 18 },
  option: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  optionText: { ...type.body },
  optionTextActive: { color: colors.primary, fontFamily: type.label.fontFamily },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  dateBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateText: { ...type.label },
  dateHint: { ...type.caption, marginTop: 4 },
  footer: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, ...type.caption },
});
