import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

export function ScreenBackground() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={
          isDark
            ? [colors.background, colors.surface, colors.background]
            : ['#E8EFFF', colors.background, '#FFFBEB']
        }
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blobGold, { backgroundColor: colors.accent, opacity: isDark ? 0.08 : 0.18 }]} />
      <View style={[styles.blobBlue, { backgroundColor: colors.primary, opacity: isDark ? 0.06 : 0.1 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blobGold: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  blobBlue: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
});
