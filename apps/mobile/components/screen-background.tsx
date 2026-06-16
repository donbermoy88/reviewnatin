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
            : ['#E8F0FF', colors.background, '#F8FAFF']
        }
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
