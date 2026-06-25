import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/use-app-theme';
import { TAB_BAR_BASE } from '../../lib/layout/content-padding';

type Props = { onPress: () => void };

export function CreatePostFAB({ onPress }: Props) {
  const { colors, spacing, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Create post"
      style={[
        {
          position: 'absolute',
          right: spacing.md,
          bottom: insets.bottom + TAB_BAR_BASE + spacing.md,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shadows.button,
      ]}
    >
      <Ionicons name="create-outline" size={24} color="#fff" />
    </Pressable>
  );
}
