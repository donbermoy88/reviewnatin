import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import {
  reportCommunityContent,
  type CommunityReportReason,
  type CommunityReportTargetType,
} from '../../lib/api/community';
import { AppSheet } from '../app-sheet';
import { PrimaryButton } from '../primary-button';

type Props = {
  visible: boolean;
  targetType: CommunityReportTargetType;
  targetId: string;
  onClose: () => void;
};

const REASONS: { reason: CommunityReportReason; label: string }[] = [
  { reason: 'spam', label: 'Spam or scam' },
  { reason: 'harassment', label: 'Harassment or bullying' },
  { reason: 'hate_or_abusive', label: 'Hate or abusive content' },
  { reason: 'inappropriate', label: 'Sexual or inappropriate content' },
  { reason: 'violence_or_harmful', label: 'Violence or harmful content' },
  { reason: 'copyrighted_or_leaked', label: 'Copyrighted or leaked reviewer material' },
  { reason: 'personal_information', label: 'Personal information' },
  { reason: 'wrong_info', label: 'Wrong or misleading exam content' },
  { reason: 'other', label: 'Other' },
];

const TITLES: Record<CommunityReportTargetType, string> = {
  post: 'Report this post',
  comment: 'Report this comment',
  image: 'Report this image',
  user: 'Report this user',
};

/** Shared report modal for posts, comments, images, and users — opened from
 *  whatever trigger UI is appropriate for that surface (overflow menu, etc). */
export function ReportContentModal({ visible, targetType, targetId, onClose }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [reason, setReason] = useState<CommunityReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (submitting) return;
    onClose();
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await reportCommunityContent(targetType, targetId, reason, details || undefined);
      setDetails('');
      setReason('spam');
      onClose();
      Alert.alert(
        result.duplicate ? 'Already reported' : 'Report submitted',
        result.duplicate ? "You've already reported this." : "Thanks. We'll review this report."
      );
    } catch {
      Alert.alert('Report failed', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppSheet
      visible={visible}
      title={TITLES[targetType]}
      subtitle="Tell us what's wrong — our team will review it."
      onClose={close}
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
      <PrimaryButton label="Cancel" variant="ghost" disabled={submitting} onPress={close} />
    </AppSheet>
  );
}
