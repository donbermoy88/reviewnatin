import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme } from '../../hooks/use-app-theme';
import { hasCompletedDiagnostic } from '../../lib/api/diagnostic';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

const FEATURES = [
  { icon: 'analytics-outline' as const, title: 'Baseline readiness', sub: 'Ito ang simula ng PasaPath score mo' },
  { icon: 'map-outline' as const, title: 'Weak subject map', sub: 'Top 3 areas na uunahin' },
  { icon: 'calendar-outline' as const, title: 'Daily plan unlock', sub: 'Bukas, tailored na ang PasaPath mo' },
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
        router.replace('/(auth)/login');
        return;
      }
      const goal = await resolveOnboardingGoal(user.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      try {
        if (await hasCompletedDiagnostic(slug)) {
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

  return (
    <StackShell
      title="Diagnostic quiz"
      subtitle="40 tanong sa lahat ng subjects — soft 30-minute timer. May explanation after each item para makita agad ang weak spots mo."
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
          label="Simulan ang diagnostic"
          size="lg"
          onPress={() =>
            router.replace({
              pathname: '/practice/quiz',
              params: { examSlug, mode: 'diagnostic' },
            })
          }
        />
        <PrimaryButton
          label="Skip muna"
          variant="outline"
          size="lg"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </StackShell>
  );
}
