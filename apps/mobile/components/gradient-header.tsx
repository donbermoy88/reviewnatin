import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii } from '../constants/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  rounded?: boolean;
};

export function GradientHeader({ children, style, rounded = true }: Props) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, rounded && styles.rounded, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 24,
    overflow: 'hidden',
  },
  rounded: {
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
});
