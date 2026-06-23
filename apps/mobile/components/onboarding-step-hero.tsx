import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STEP_META: Record<
  number,
  { icon: IconName; title: string; subtitle: string; tint: string; bg: string }
> = {
  1: {
    icon: 'school-outline',
    title: 'Piliin ang exam mo',
    subtitle: 'CSE · LET · PNLE — i-sync sa PasaPath mo',
    tint: '#0B5FFF',
    bg: '#E8F0FF',
  },
  2: {
    icon: 'bar-chart-outline',
    title: 'Ano ang level mo ngayon?',
    subtitle: 'I-tutok ang quiz difficulty sa proficiency mo',
    tint: '#7B2CBF',
    bg: '#F1E8FA',
  },
  3: {
    icon: 'calendar-outline',
    title: 'Daily goal at exam date',
    subtitle: 'Konti-konti araw-araw — malaking impact sa streak',
    tint: '#059669',
    bg: '#E8FAF0',
  },
  4: {
    icon: 'cloud-upload-outline',
    title: 'I-save ang progress',
    subtitle: 'Cloud sync · Mistake Bank · kahit anong device',
    tint: '#D97706',
    bg: '#FEF3C7',
  },
};

type Props = {
  step: 1 | 2 | 3 | 4;
};

export function OnboardingStepHero({ step }: Props) {
  const { colors, fonts, radii, spacing } = useAppTheme();
  const meta = STEP_META[step];

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: meta.bg,
        borderRadius: radii.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: `${meta.tint}22`,
      }}
      accessibilityRole="summary"
      accessibilityLabel={`${meta.title}. ${meta.subtitle}`}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={meta.icon} size={26} color={meta.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>{meta.title}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
          {meta.subtitle}
        </Text>
      </View>
    </Animated.View>
  );
}
