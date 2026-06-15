import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import {
  reportContent,
  type ReportContentType,
  type ReportReason,
} from '../lib/api/content-reports';
import { useAuth } from '../providers/auth-provider';
import { AppSheet } from './app-sheet';
import { PrimaryButton } from './primary-button';

type Props = {
  contentType: ReportContentType;
  contentId: string;
  label?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  onReported?: () => void;
};

type ReasonOption = {
  reason: ReportReason;
  label: string;
};

const QUESTION_REASONS: ReasonOption[] = [
  { reason: 'wrong_answer', label: 'Wrong answer key' },
  { reason: 'unclear_question', label: 'Unclear question' },
  { reason: 'typo', label: 'Typo or formatting' },
  { reason: 'outdated', label: 'Outdated content' },
  { reason: 'other', label: 'Other issue' },
];

const FLASHCARD_REASONS: ReasonOption[] = [
  { reason: 'wrong_answer', label: 'Wrong card content' },
  { reason: 'unclear_question', label: 'Unclear card' },
  { reason: 'typo', label: 'Typo or formatting' },
  { reason: 'outdated', label: 'Outdated content' },
  { reason: 'other', label: 'Other issue' },
];

const MATERIAL_REASONS: ReasonOption[] = [
  { reason: 'wrong_answer', label: 'Wrong material content' },
  { reason: 'unclear_question', label: 'Unclear explanation' },
  { reason: 'typo', label: 'Typo or formatting' },
  { reason: 'outdated', label: 'Outdated content' },
  { reason: 'other', label: 'Other issue' },
];

function titleFor(contentType: ReportContentType) {
  if (contentType === 'flashcard') return 'Flag this flashcard';
  if (contentType === 'review_material') return 'Flag this material';
  return 'Flag this question';
}

export function ReportContentButton({
  contentType,
  contentId,
  label,
  compact = false,
  style,
  onReported,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const [visible, setVisible] = useState(false);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [reason, setReason] = useState<ReportReason>('wrong_answer');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons =
    contentType === 'flashcard'
      ? FLASHCARD_REASONS
      : contentType === 'review_material'
        ? MATERIAL_REASONS
        : QUESTION_REASONS;
  const buttonLabel = label && label !== 'Flag' ? label : titleFor(contentType);

  const subtitle = useMemo(() => {
    if (contentType === 'flashcard') return 'Choose a reason. The report goes straight to the admin QA queue.';
    if (contentType === 'review_material') return 'Choose a reason. The report goes straight to the admin QA queue.';
    return 'Choose a reason. The report goes straight to the admin QA queue.';
  }, [contentType]);

  const open = () => {
    if (!user) {
      setLoginPromptVisible(true);
      return;
    }
    setVisible(true);
  };

  const close = () => {
    if (submitting) return;
    setVisible(false);
    setDetails('');
    setReason('wrong_answer');
  };

  const submit = async (nextReason = reason, nextDetails = details) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportContent({ contentType, contentId, reason: nextReason, details: nextDetails });
      setVisible(false);
      setDetails('');
      setReason('wrong_answer');
      onReported?.();
      Alert.alert('Report submitted', 'Thank you. The ReviewNatin content team will review it.');
    } catch {
      Alert.alert('Report failed', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const chooseReason = (nextReason: ReportReason) => {
    setReason(nextReason);
    if (nextReason === 'other') return;
    void submit(nextReason, '');
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityHint="Opens the content report form"
        hitSlop={8}
        style={[
          {
            minWidth: compact ? 36 : 44,
            minHeight: compact ? 36 : 44,
            paddingHorizontal: compact ? spacing.xs : spacing.sm,
            borderRadius: compact ? radii.md : radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          },
          style,
        ]}
      >
        <Ionicons name="flag-outline" size={compact ? 14 : 16} color={colors.textMuted} />
      </Pressable>

      <AppSheet
        visible={visible}
        title={titleFor(contentType)}
        subtitle={subtitle}
        onClose={close}
      >
        <View style={{ gap: spacing.sm }}>
          {reasons.map((option) => {
            const active = reason === option.reason;
            return (
              <Pressable
                key={option.label}
                onPress={() => chooseReason(option.reason)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={`Report: ${option.label}`}
                accessibilityState={{ disabled: submitting }}
                style={{
                  minHeight: 48,
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
                  name={option.reason === 'other' ? 'create-outline' : 'flag-outline'}
                  size={18}
                  color={active ? colors.primary : colors.textLight}
                />
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 13,
                    color: active ? colors.primary : colors.text,
                  }}
                >
                  {option.label}
                </Text>
                {submitting && active ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>

        {reason === 'other' ? (
          <>
            <TextInput
              value={details}
              onChangeText={setDetails}
              accessibilityLabel="Report details"
              placeholder="Add details so we can fix it faster"
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              style={{
                minHeight: 96,
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
              label={submitting ? 'Submitting…' : 'Submit details'}
              icon="flag-outline"
              size="lg"
              disabled={submitting}
              onPress={() => void submit('other', details)}
            />
          </>
        ) : null}
        <PrimaryButton
          label="Cancel"
          variant="ghost"
          disabled={submitting}
          onPress={close}
        />
      </AppSheet>

      <AppSheet
        visible={loginPromptVisible}
        title="Log in to flag content"
        subtitle="Reports are attached to an account so the admin team can prevent spam, group duplicates, and follow up on fixes."
        onClose={() => setLoginPromptVisible(false)}
        actions={[
          {
            label: 'Log in to flag',
            onPress: () => {
              setLoginPromptVisible(false);
              router.push('/(auth)/login');
            },
          },
          { label: 'Not now', onPress: () => setLoginPromptVisible(false), variant: 'outline' },
        ]}
      />
    </>
  );
}
