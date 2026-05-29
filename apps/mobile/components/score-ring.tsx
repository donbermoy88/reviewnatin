import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  percent: number;
  correct: number;
  total: number;
  size?: number;
};

export function ScoreRing({ percent, correct, total, size = 180 }: Props) {
  const { colors, fonts } = useAppTheme();
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  const center = size / 2;

  // Dynamic ring color: green ≥75%, orange ≥50%, red <50%
  const ringColor = percent >= 75 ? colors.success : percent >= 50 ? colors.flame : colors.error;

  return (
    <View
      style={{ width: size, height: size, marginTop: 24 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${Math.round(percent)}% score — ${correct} out of ${total} correct`}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.scoreLine}>
          <Text style={[styles.scoreBig, { fontFamily: fonts.display }]}>{correct}</Text>
          <Text style={[styles.scoreSlash, { fontFamily: fonts.display }]}>/{total}</Text>
        </Text>
        <Text style={[styles.accuracy, { fontFamily: fonts.bodyBold, color: ringColor }]}>{Math.round(percent)}% accuracy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline' },
  scoreBig: { fontSize: 52, color: '#fff', letterSpacing: -2 },
  scoreSlash: { fontSize: 32, color: 'rgba(255,255,255,0.5)' },
  accuracy: {
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
