import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LogoMark } from './logo-mark';
import { colors, spacing, type } from '../constants/theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  white?: boolean;
  showMark?: boolean;
  style?: ViewStyle;
};

const SIZES = {
  sm: { mark: 32, text: 16 },
  md: { mark: 40, text: 20 },
  lg: { mark: 56, text: 26 },
};

export function BrandWordmark({ size = 'md', white = false, showMark = true, style }: Props) {
  const s = SIZES[size];
  const ink = white ? '#fff' : colors.text;
  const natin = white ? colors.accent : colors.accent;

  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      {showMark ? <LogoMark size={s.mark} /> : null}
      <Text style={[styles.wordmark, { fontSize: s.text, color: ink }]}>
        Review<Text style={{ color: natin }}>Natin</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wordmark: {
    fontFamily: type.brand.fontFamily,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
