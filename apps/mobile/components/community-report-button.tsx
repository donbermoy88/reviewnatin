import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { reportCommunityContent, type CommunityReportReason } from '../lib/api/community';
import { AppSheet } from './app-sheet';
import { PrimaryButton } from './primary-button';

type Props = {
  postId?: string;
  commentId?: string;
};

const REASONS: { reason: CommunityReportReason; label: string }[] = [
  { reason: 'spam', label: 'Spam' },
  { reason: 'harassment', label: 'Harassment or bullying' },
  { reason: 'wrong_info', label: 'Wrong information' },
  { reason: 'inappropriate', label: 'Inappropriate content' },
  { reason: 'other', label: 'Other' },
];

export function CommunityReportButton({ postId, commentId }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState<CommunityReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportCommunityContent(reason, details || undefined, { postId, commentId });
      setVisible(false);
      setDetails('');
      Alert.alert('Report submitted', 'Thanks — our team will review this.');
    } catch {
      Alert.alert('Report failed', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Report this content"
        hitSlop={8}
      >
        <Ionicons name="flag-outline" size={16} color={colors.textLight} />
      </Pressable>

      <AppSheet
        visible={visible}
        title={commentId ? 'Report this comment' : 'Report this post'}
        subtitle="Tell us what's wrong — our team will review it."
        onClose={() => !submitting && setVisible(false)}
      >
        <View style={{ gap: spacing.sm }}>
          {REASONS.map((option) => {
            const active = reason === option.reason;
            return (
              <Pressable
                key={option.reason}
                onPress={() => setReason(option.reason)}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: active }}
                style={{
                  minHeight: 42,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primaryMuted : colors.surface,
                  paddingHorizontal: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={active ? colors.primary : colors.textLight}
                />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: active ? colors.primary : colors.text }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={details}
          onChangeText={setDetails}
          accessibilityLabel="Report details"
          placeholder="Add details (optional)"
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          textAlignVertical="top"
          style={{
            minHeight: 80,
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

        <PrimaryButton
          label={submitting ? 'Submitting…' : 'Submit report'}
          icon="flag-outline"
          size="lg"
          disabled={submitting}
          onPress={() => void submit()}
        />
        <PrimaryButton label="Cancel" variant="ghost" disabled={submitting} onPress={() => setVisible(false)} />
      </AppSheet>
    </>
  );
}
