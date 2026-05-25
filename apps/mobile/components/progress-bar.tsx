import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../constants/theme';

type Props = {
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  showPct?: boolean;
};

export function ProgressBar({
  progress,
  color = colors.primary,
  height = 6,
  label,
  showPct = false,
}: Props) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <View>
      {(label || showPct) && (
        <View style={styles.meta}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPct ? <Text style={styles.pct}>{Math.round(pct)}%</Text> : null}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { ...type.caption, color: colors.textMuted, textTransform: 'none', letterSpacing: 0 },
  pct: { ...type.caption, color: colors.text, fontFamily: type.label.fontFamily, textTransform: 'none' },
  track: {
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: { borderRadius: radii.full },
});
