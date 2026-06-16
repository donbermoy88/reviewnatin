import { useEffect, useState } from 'react';
import { Animated, View, type DimensionValue, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

/** Lightweight shimmer placeholder. Single opacity pulse on the native driver — cheap on Android. */
export function Skeleton({ width = '100%', height = 16, radius, style }: Props) {
  const { colors, radii } = useAppTheme();
  const [pulse] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius ?? radii.md, backgroundColor: colors.border, opacity: pulse },
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton block matching the standard list/card rhythm. */
export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  const { colors, radii, spacing } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <Skeleton width="55%" height={18} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} />
      ))}
    </View>
  );
}
