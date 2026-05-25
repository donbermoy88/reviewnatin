import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { ScoreRing } from './score-ring';
import type { AppTheme } from '../hooks/use-app-theme';

type Props = {
  theme: AppTheme;
  displayName: string;
  examName: string;
  score: number;
  correct: number;
  total: number;
  modeLabel: string;
};

export function ShareScoreCard({ theme, displayName, examName, score, correct, total, modeLabel }: Props) {
  const { colors, fonts, spacing, radii, gradients } = theme;

  return (
    <View
      style={{
        width: 320,
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      <LinearGradient colors={[...gradients.hero]} style={{ padding: spacing.lg, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 1 }}>
          REVIEWNATIN
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 18, color: '#fff', marginTop: spacing.sm }}>
          {modeLabel}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          {displayName} · {examName}
        </Text>
        <View style={{ marginVertical: spacing.md }}>
          <ScoreRing percent={score} correct={correct} total={total} />
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, color: '#fff' }}>{score}%</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          {correct}/{total} correct
        </Text>
      </LinearGradient>
      <View style={{ padding: spacing.md, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary }}>
          reviewnatinph.com
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
          Pass your board exam. Review natin.
        </Text>
      </View>
    </View>
  );
}
