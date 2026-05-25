import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { ExamCountdown } from '../lib/exam-countdown';
import type { AppTheme } from '../hooks/use-app-theme';

type Props = {
  theme: AppTheme;
  countdown: ExamCountdown;
  examName: string;
  onPress?: () => void;
};

const toneColors = {
  past: { bg: ['#64748B', '#475569'] as const, accent: '#E2E8F0' },
  urgent: { bg: ['#DC2626', '#991B1B'] as const, accent: '#FEE2E2' },
  soon: { bg: ['#F59E0B', '#D97706'] as const, accent: '#FEF3C7' },
  normal: { bg: ['#0B5FFF', '#08245C'] as const, accent: '#DBEAFE' },
};

export function ExamCountdownCard({ theme, countdown, examName, onPress }: Props) {
  const { spacing, radii, fonts } = theme;
  const palette = toneColors[countdown.tone];

  const content = (
    <LinearGradient
      colors={[...palette.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radii.xl,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radii.lg,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: '#fff' }}>
          {countdown.daysLeft >= 0 ? countdown.daysLeft : '!'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: palette.accent, letterSpacing: 0.8 }}>
          EXAM COUNTDOWN
        </Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff', marginTop: 2 }}>
          {countdown.label}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          {examName} · {countdown.targetLabel}
        </Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" /> : null}
    </LinearGradient>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
