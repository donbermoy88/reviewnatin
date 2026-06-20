import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme } from '../../hooks/use-app-theme';
import { hasCompletedDiagnostic } from '../../lib/api/diagnostic';
import {
  clearDiagnosticPromptDismissal,
  dismissDiagnosticPrompt,
} from '../../lib/diagnostic-prompt';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

const FEATURES = [
  { icon: 'analytics-outline' as const, title: 'Baseline readiness', sub: 'This is the start of your PasaPath score' },
  { icon: 'map-outline' as const, title: 'Weak subject map', sub: 'Top 3 areas to focus on first' },
  { icon: 'calendar-outline' as const, title: 'Daily plan unlock', sub: 'Tomorrow, your PasaPath will be tailored' },
];

export default function DiagnosticIntroScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const { user } = useAuth();
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      const goal = await resolveOnboardingGoal(user.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      try {
        if (await hasCompletedDiagnostic(slug)) {
          await clearDiagnosticPromptDismissal(user.id, slug).catch(() => {});
          router.replace('/(tabs)');
          return;
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [user, router]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <StackShell title="Diagnostic quiz">
        <EmptyState
          icon={<Ionicons name="analytics-outline" size={32} color={colors.primary} />}
          title="Kunin ang diagnostic mo"
          description="Mag-log in para kunin ang baseline diagnostic quiz mo at makakuha ng personalized PasaPath study plan."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  return (
    <StackShell
      title="Diagnostic quiz"
      subtitle="40 questions across all subjects — soft 30-minute timer. Explanations after each item to surface your weak spots right away."
      headerExtra={
        <Pill color={colors.accentDark} bg={colors.accent}>
          DAY 0 BASELINE
        </Pill>
      }
    >
      <View style={{ gap: spacing.md }}>
        {FEATURES.map((item) => (
          <View
            key={item.title}
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radii.xl,
              padding: spacing.md,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.md,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>{item.title}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                {item.sub}
              </Text>
            </View>
          </View>
        ))}

        <PrimaryButton
          label="Start diagnostic"
          size="lg"
          onPress={() => {
            void clearDiagnosticPromptDismissal(user.id, examSlug).catch(() => {});
            router.replace({
              pathname: '/practice/quiz',
              params: { examSlug, mode: 'diagnostic' },
            });
          }}
        />
        <PrimaryButton
          label="Skip for now"
          variant="outline"
          size="lg"
          onPress={() => {
            void (async () => {
              await dismissDiagnosticPrompt(user.id, examSlug).catch(() => {});
              router.replace('/(tabs)');
            })();
          }}
        />
      </View>
    </StackShell>
  );
}
