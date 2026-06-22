import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { DAILY_LIMIT } from '../lib/product-copy';

type Props = {
  onUpgrade: () => void;
  onDismiss?: () => void;
  variant?: 'daily' | 'board';
};

/** Conversion-focused paywall panel (20 Q limit, board mode). */
export function PremiumLimitPanel({ onUpgrade, onDismiss, variant = 'daily' }: Props) {
  const { colors, spacing, radii, fonts } = useAppTheme();

  const title = variant === 'board' ? 'Board Exam Mode — Plus lang' : DAILY_LIMIT.title;
  const body =
    variant === 'board'
      ? 'Maranasan ang totoong exam pressure — strict timer, walang hint, full-length mock.'
      : DAILY_LIMIT.body();

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
        </View>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 20, color: colors.text, textAlign: 'center' }}>
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 14,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 21,
            maxWidth: 320,
          }}
        >
          {body}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.xs,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, marginBottom: 4 }}>
          Sa Plus makakakuha ka ng:
        </Text>
        {DAILY_LIMIT.valueBullets.map((line) => (
          <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginTop: 2 }} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, flex: 1 }}>
              {line}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onUpgrade}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          borderRadius: radii.md,
          paddingVertical: spacing.sm + 4,
          alignItems: 'center',
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>
          {DAILY_LIMIT.ctaUpgrade}
        </Text>
      </Pressable>

      {onDismiss ? (
        <Pressable onPress={onDismiss} style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted }}>
            {DAILY_LIMIT.ctaTomorrow}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
