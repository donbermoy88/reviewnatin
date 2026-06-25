import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { AppSheet } from '../app-sheet';
import { PrimaryButton } from '../primary-button';

type Props = {
  visible: boolean;
  examName: string;
  posting: boolean;
  onClose: () => void;
  onSubmit: (body: string) => Promise<void>;
};

export function CreatePostSheet({ visible, examName, posting, onClose, onSubmit }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [text, setText] = useState('');

  const close = () => {
    if (posting) return;
    setText('');
    onClose();
  };

  const submit = async () => {
    const body = text.trim();
    if (!body || posting) return;
    await onSubmit(body);
    setText('');
  };

  return (
    <AppSheet visible={visible} title="Create post" subtitle={`Posting to ${examName} reviewers`} onClose={close}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Share a question, review tip, or something…"
        placeholderTextColor={colors.textLight}
        editable={!posting}
        multiline
        maxLength={2000}
        autoFocus
        textAlignVertical="top"
        style={{
          minHeight: 120,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          padding: spacing.md,
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.text,
          lineHeight: 20,
        }}
      />
      <Pressable
        // lib/community/feature-flags.ts#ENABLE_COMMUNITY_IMAGE_UPLOAD is the Phase 2
        // switch — no picker/upload logic exists yet, so this stays "coming soon".
        onPress={() => Alert.alert('Coming soon', 'Image upload for posts is coming soon.')}
        accessibilityRole="button"
        accessibilityLabel="Add image (coming soon)"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
        hitSlop={8}
      >
        <Ionicons name="image-outline" size={18} color={colors.textLight} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight }}>
          Image upload coming soon
        </Text>
      </Pressable>
      <PrimaryButton
        label={posting ? 'Posting…' : 'Post'}
        size="lg"
        disabled={posting || !text.trim()}
        onPress={() => void submit()}
      />
    </AppSheet>
  );
}
