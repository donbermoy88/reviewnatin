import { Text, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  style?: ViewStyle;
};

const SIZES = {
  sm: { badge: 32, badgeText: 13, wordmark: 18 },
  md: { badge: 40, badgeText: 16, wordmark: 22 },
  lg: { badge: 48, badgeText: 18, wordmark: 28 },
};

export function AppLogo({ size = 'md', showWordmark = true, style }: Props) {
  const { colors, radii, spacing, fonts, type } = useAppTheme();
  const s = SIZES[size];

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]} accessibilityRole="header">
      <View
        style={{
          width: s.badge,
          height: s.badge,
          borderRadius: radii.md,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: s.badgeText }}>RN</Text>
      </View>
      {showWordmark ? (
        <Text style={[type.brand, { fontSize: s.wordmark }]}>ReviewNatin</Text>
      ) : null}
    </View>
  );
}
