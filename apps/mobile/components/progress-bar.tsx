import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  showPct?: boolean;
};

export function ProgressBar({ progress, color, height = 6, label, showPct = false }: Props) {
  const { colors, radii, type } = useAppTheme();
  const pct = Math.min(100, Math.max(0, progress));
  const fillColor = color ?? colors.primary;

  return (
    <View>
      {(label || showPct) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          {label ? (
            <Text style={[type.caption, { color: colors.textMuted, textTransform: 'none', letterSpacing: 0 }]}>
              {label}
            </Text>
          ) : (
            <View />
          )}
          {showPct ? (
            <Text style={[type.caption, { color: colors.text, fontFamily: type.label.fontFamily, textTransform: 'none' }]}>
              {Math.round(pct)}%
            </Text>
          ) : null}
        </View>
      )}
      <View style={{ width: '100%', height, backgroundColor: colors.border, borderRadius: radii.full, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height, backgroundColor: fillColor, borderRadius: radii.full }} />
      </View>
    </View>
  );
}
