import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

export function RemovedContentPlaceholder() {
  const { colors, fonts, spacing, radii } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
      }}
    >
      <Ionicons name="trash-outline" size={18} color={colors.textLight} />
      <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
        This content was removed.
      </Text>
    </View>
  );
}
