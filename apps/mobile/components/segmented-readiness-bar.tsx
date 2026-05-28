import { View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  score: number;
  segments?: number;
  style?: ViewStyle;
};

/** Segmented readiness bar — Claude design blues (primary / primaryMuted). */
export function SegmentedReadinessBar({ score, segments = 6, style }: Props) {
  const { colors } = useAppTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const filled = Math.round((clamped / 100) * segments);

  return (
    <View style={[{ flexDirection: 'row', gap: 6 }, style]}>
      {Array.from({ length: segments }, (_, i) => {
        const active = i < filled;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 10,
              borderRadius: 5,
              backgroundColor: active
                ? clamped >= 70
                  ? colors.primary
                  : clamped >= 40
                    ? colors.primaryLight
                    : colors.primary
                : colors.primaryMuted,
            }}
          />
        );
      })}
    </View>
  );
}
