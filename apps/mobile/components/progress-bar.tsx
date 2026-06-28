import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';

type Props = {
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  showPct?: boolean;
};

export function ProgressBar({ progress, color, height = 6, label, showPct = false }: Props) {
  const { colors, radii, type, motion } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const pct = Math.min(100, Math.max(0, progress));
  const fillColor = color ?? colors.primary;
  const [anim] = useState(() => new Animated.Value(pct));

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(pct);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: pct,
      duration: motion.duration.slow,
      easing: Easing.bezier(...motion.easing.standard),
      // width is a layout prop, so it cannot run on the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [pct, reduceMotion, anim, motion]);

  const widthInterpolation = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

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
        <Animated.View style={{ width: widthInterpolation, height, backgroundColor: fillColor, borderRadius: radii.full }} />
      </View>
    </View>
  );
}
