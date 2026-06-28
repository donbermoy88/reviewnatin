import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
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
  const [reason, setReason] = useState<ReportReason>('wrong_answer');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = contentType === 'flashcard' ? FLASHCARD_REASONS : QUESTION_REASONS;
  const buttonLabel = label ?? (compact ? 'Flag' : 'Flag issue');

  const subtitle = useMemo(() => {
    if (contentType === 'flashcard') return 'Tell the content team what is wrong with this card.';
    if (contentType === 'review_material') return 'Tell the content team what needs correction.';
    return 'Tell the content team what is wrong with this question.';
  }, [contentType]);

  const open = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setVisible(true);
  };

  const close = () => {
    if (submitting) return;
    setVisible(false);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportContent({ contentType, contentId, reason, details });
      setVisible(false);
      setDetails('');
      onReported?.();
      Alert.alert('Report submitted', 'Thank you. The ReviewNatin content team will review it.');
    } catch {
      Alert.alert('Report failed', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        hitSlop={8}
        style={[
          {
            minHeight: compact ? 36 : 42,
            paddingHorizontal: compact ? spacing.sm : spacing.md,
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
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: compact ? 12 : 13,
            color: colors.textMuted,
          }}
        >
          {buttonLabel}
        </Text>
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
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 13,
                    color: active ? colors.primary : colors.text,
                  }}
                >
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
          label="Submit report"
          loadingLabel="Submitting…"
          loading={submitting}
          icon="flag-outline"
          size="lg"
          onPress={() => void submit()}
        />
        <PrimaryButton
          label="Cancel"
          variant="ghost"
          disabled={submitting}
          onPress={close}
        />
      </AppSheet>
    </>
  );
}
