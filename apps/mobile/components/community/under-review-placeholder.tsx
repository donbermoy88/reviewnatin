import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

export function UnderReviewPlaceholder() {
  const { colors, fonts, spacing, radii } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.warnBg,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.warnBorder,
        padding: spacing.md,
      }}
    >
      <Ionicons name="time-outline" size={18} color={colors.accentDark} />
      <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.disclaimerText }}>
        This content is under review.
      </Text>
    </View>
  );
}
