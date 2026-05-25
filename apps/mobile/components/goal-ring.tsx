import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  percent: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
  labelColor?: string;
  showLabel?: boolean;
};

export function GoalRing({
  percent,
  size = 64,
  strokeWidth = 6,
  trackColor,
  fillColor,
  labelColor,
  showLabel = true,
}: Props) {
  const { colors, fonts, isDark } = useAppTheme();
  const resolvedTrack = trackColor ?? (isDark ? 'rgba(245,166,35,0.2)' : 'rgba(245,166,35,0.25)');
  const resolvedFill = fillColor ?? colors.accentDark;
  const resolvedLabel = labelColor ?? (isDark ? colors.accent : colors.primaryDark);

  const pct = Math.min(100, Math.max(0, percent));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={r} stroke={resolvedTrack} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={resolvedFill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {showLabel ? (
          <Text style={[styles.label, { fontSize: size * 0.27, color: resolvedLabel, fontFamily: fonts.display }]}>
            {Math.round(pct)}%
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { letterSpacing: -0.5 },
});
