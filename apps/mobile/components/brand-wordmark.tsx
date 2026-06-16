import { Text, View, type ViewStyle } from 'react-native';
import { LogoMark } from './logo-mark';
import { useAppTheme } from '../hooks/use-app-theme';

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
  const { colors, spacing, fonts } = useAppTheme();
  const s = SIZES[size];
  const ink = white ? '#fff' : colors.text;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]} accessibilityRole="header">
      {showMark ? <LogoMark size={s.mark} /> : null}
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: s.text,
          color: ink,
          letterSpacing: -0.5,
        }}
      >
        Review<Text style={{ color: colors.accent }}>Natin</Text>
      </Text>
    </View>
  );
}
