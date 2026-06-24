import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { PREMIUM_EXAM_PREP } from '../../lib/subscription/paywall-copy';

type Props = {
  daysLeft: number;
  offlineReady: boolean;
  offlineBusy: boolean;
  onDownloadOffline: () => void;
  onOpenTutor: () => void;
};

/** Plus users with exam ≤30 days — surfaces offline pack + AI tutor (P4). */
export const PremiumExamPrepStrip = memo(function PremiumExamPrepStrip({
  daysLeft,
  offlineReady,
  offlineBusy,
  onDownloadOffline,
  onOpenTutor,
}: Props) {
  const theme = useAppTheme();
  const { colors, spacing, radii, fonts } = theme;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={PREMIUM_EXAM_PREP.accessibilityLabel(daysLeft)}
      style={{
        backgroundColor: 'rgba(245,166,35,0.12)',
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.22)',
        padding: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Ionicons name="alarm-outline" size={20} color={colors.accentDark} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
            {PREMIUM_EXAM_PREP.title(daysLeft)}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17 }}>
            {PREMIUM_EXAM_PREP.subtitle}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          onPress={onDownloadOffline}
          disabled={offlineBusy || offlineReady}
          accessibilityRole="button"
          accessibilityLabel={
            offlineReady ? PREMIUM_EXAM_PREP.offlineReady : PREMIUM_EXAM_PREP.offlineDownload
          }
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: offlineReady ? colors.successBg : colors.surface,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: offlineReady ? 'rgba(22,163,74,0.2)' : colors.border,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.sm,
            opacity: pressed ? 0.9 : offlineBusy || offlineReady ? 0.85 : 1,
          })}
        >
          {offlineBusy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={offlineReady ? 'checkmark-circle' : 'cloud-download-outline'}
              size={16}
              color={offlineReady ? colors.success : colors.primary}
            />
          )}
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 12,
              color: offlineReady ? colors.success : colors.text,
            }}
            numberOfLines={1}
          >
            {offlineBusy
              ? PREMIUM_EXAM_PREP.offlineBusy
              : offlineReady
                ? PREMIUM_EXAM_PREP.offlineReady
                : PREMIUM_EXAM_PREP.offlineDownload}
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenTutor}
          accessibilityRole="button"
          accessibilityLabel={PREMIUM_EXAM_PREP.tutorCta}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: colors.primary,
            borderRadius: radii.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.sm,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' }} numberOfLines={1}>
            {PREMIUM_EXAM_PREP.tutorCta}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});
