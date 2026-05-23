import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

type Props = {
  progress: number;
  label?: string;
  showPercent?: boolean;
  height?: number;
  color?: string;
};

export function ProgressBar({
  progress,
  label,
  showPercent = true,
  height = 8,
  color = colors.primary,
}: Props) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.wrap}>
      {(label || showPercent) && (
        <View style={styles.row}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercent ? <Text style={styles.pct}>{Math.round(pct)}%</Text> : null}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { ...type.caption },
  pct: { ...type.caption, color: colors.primary },
  track: {
    backgroundColor: colors.ringTrack,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: { borderRadius: radii.full },
});
