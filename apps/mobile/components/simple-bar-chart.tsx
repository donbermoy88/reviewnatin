import Svg, { Rect } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

export type BarChartItem = {
  label: string;
  value: number;
};

type Props = {
  data: BarChartItem[];
  maxValue?: number;
  barColor?: string;
  height?: number;
  accessibilityLabel?: string;
};

export function SimpleBarChart({
  data,
  maxValue,
  barColor,
  height = 120,
  accessibilityLabel = 'Bar chart',
}: Props) {
  const theme = useAppTheme();
  const { colors, type } = theme;
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));
  const fill = barColor ?? colors.primary;
  const barWidth = data.length > 0 ? Math.min(32, 240 / data.length - 4) : 24;

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      <Svg width="100%" height={height} viewBox={`0 0 ${data.length * 40} ${height}`}>
        {data.map((item, i) => {
          const h = max > 0 ? (item.value / max) * (height - 24) : 0;
          const x = i * 40 + 4;
          const y = height - 20 - h;
          return (
            <Rect
              key={item.label}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(h, 2)}
              rx={4}
              fill={fill}
              opacity={item.value > 0 ? 1 : 0.25}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {data.map((item) => (
          <Text key={item.label} style={[type.caption, styles.label, { color: colors.textMuted }]}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  label: {
    textTransform: 'none',
    fontSize: 10,
    letterSpacing: 0,
  },
});
