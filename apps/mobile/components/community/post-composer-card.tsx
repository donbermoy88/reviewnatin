import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { Avatar } from './avatar';

type Props = {
  avatarUrl: string | null;
  displayName: string;
  isGuest: boolean;
  onPress: () => void;
};

export function PostComposerCard({ avatarUrl, displayName, isGuest, onPress }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isGuest ? 'Log in to post' : 'Create a post'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.md,
      }}
    >
      <Avatar url={avatarUrl} name={displayName} size={36} />
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.textLight }} numberOfLines={1}>
        {isGuest ? 'Log in to post' : 'Share a question, review tip, or something…'}
      </Text>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          // lib/community/feature-flags.ts#ENABLE_COMMUNITY_IMAGE_UPLOAD is the Phase 2
          // switch — no picker/upload logic exists yet, so this stays "coming soon".
          Alert.alert('Coming soon', 'Image upload for posts is coming soon.');
        }}
        accessibilityRole="button"
        accessibilityLabel="Add image (coming soon)"
        hitSlop={8}
      >
        <Ionicons name="image-outline" size={20} color={colors.textLight} />
      </Pressable>
    </Pressable>
  );
}
