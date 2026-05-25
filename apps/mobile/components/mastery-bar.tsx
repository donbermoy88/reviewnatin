import { View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type MasteryBarProps = {
  accuracy: number;
  attempts: number;
  style?: ViewStyle;
};

export function masteryBarColor(
  accuracy: number,
  colors: ReturnType<typeof useAppTheme>['colors']
): string {
  if (accuracy >= 80) return colors.success;
  if (accuracy >= 70) return colors.primary;
  if (accuracy >= 50) return colors.accentDark;
  return colors.error;
}

export function MasteryBar({ accuracy, attempts, style }: MasteryBarProps) {
  const { colors } = useAppTheme();
  const pct = attempts > 0 ? Math.round(accuracy) : 0;
  const width = attempts > 0 ? Math.max(pct, 4) : 0;

  return (
    <View
      style={[
        {
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          height: '100%',
          width: `${width}%`,
          backgroundColor: masteryBarColor(pct, colors),
          borderRadius: 3,
        }}
      />
    </View>
  );
}
