import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { GUEST_NEXT_STEPS } from '../lib/product-copy';

type Props = {
  questionsToday?: number;
  dailyLimit?: number;
  onPractice: () => void;
  onBrowseSubjects: () => void;
  onSignup?: () => void;
};

/** Clear first-run path for guest testers (G1, G2, G4). */
export function GuestNextStepCard({
  questionsToday = 0,
  dailyLimit = 20,
  onPractice,
  onBrowseSubjects,
  onSignup,
}: Props) {
  const theme = useAppTheme();
  const { colors, spacing, radii, fonts } = theme;
  const remaining = Math.max(0, dailyLimit - questionsToday);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="rocket-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text }}>
            {GUEST_NEXT_STEPS.title}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
            {GUEST_NEXT_STEPS.subtitle}
          </Text>
        </View>
      </View>

      {questionsToday > 0 ? (
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary }}>
          {remaining > 0
            ? `${remaining} libreng tanong natitira ngayong araw`
            : 'Naubos na ang libreng tanong ngayon — balik bukas o mag-Plus'}
        </Text>
      ) : null}

      <Pressable
        onPress={onPractice}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          backgroundColor: colors.primary,
          borderRadius: radii.md,
          paddingVertical: spacing.sm + 2,
          opacity: pressed ? 0.9 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={GUEST_NEXT_STEPS.ctaPractice}
      >
        <Ionicons name="play" size={18} color="#fff" />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' }}>
          {GUEST_NEXT_STEPS.ctaPractice}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          onPress={onBrowseSubjects}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="layers-outline" size={16} color={colors.primary} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary }}>
            {GUEST_NEXT_STEPS.ctaReview}
          </Text>
        </Pressable>
        {onSignup ? (
          <Pressable
            onPress={onSignup}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
              {GUEST_NEXT_STEPS.ctaSignup}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
