import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

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
  const s = SIZES[size];

  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      <View
        style={[
          styles.badge,
          {
            width: s.badge,
            height: s.badge,
            borderRadius: radii.md,
          },
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: s.badgeText }]}>RN</Text>
      </View>
      {showWordmark ? (
        <Text style={[styles.wordmark, { fontSize: s.wordmark }]}>ReviewNatin</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontFamily: type.brand.fontFamily,
    fontWeight: '800',
  },
  wordmark: {
    ...type.brand,
    fontSize: 22,
  },
});
