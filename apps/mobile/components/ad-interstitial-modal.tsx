import { Modal, Pressable, Text } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
};

/** Placeholder interstitial — swap body for AdMob interstitial when unit IDs are set. */
export function AdInterstitialModal({ visible, onClose, onUpgrade }: Props) {
  const theme = useAppTheme();
  const { colors, spacing, fonts } = theme;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted }}>FREE TIER</Text>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, color: colors.text, marginTop: spacing.sm }}>
            Unlock unlimited review
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 }}>
            Free tier has a daily limit. ReviewNatin Plus removes ads and unlocks full mocks, offline packs, and smart review tools.
          </Text>
          {onUpgrade ? (
            <Pressable
              onPress={onUpgrade}
              accessibilityRole="button"
              accessibilityLabel="View plans"
              style={{
                marginTop: spacing.lg,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: spacing.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' }}>View plans</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClose} style={{ marginTop: spacing.md, alignItems: 'center' }} accessibilityRole="button" accessibilityLabel="Continue">
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted }}>Continue</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
