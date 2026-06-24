import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { SETTINGS_HINT, SETTINGS_SUPPORT } from '../lib/product-copy';

const HINT_KEY = 'reviewnatin:coach:settings_hint';

/** One-time hint for Settings discoverability (G4, all cohorts). */
export function ProfileSettingsHint({
  onOpenSettings,
  onReportProblem,
}: {
  onOpenSettings: () => void;
  onReportProblem: () => void;
}) {
  const { colors, spacing, radii, fonts } = useAppTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(HINT_KEY).then((seen) => {
      if (!seen) setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    setVisible(false);
    await AsyncStorage.setItem(HINT_KEY, 'seen').catch(() => {});
  };

  if (!visible) return null;

  return (
    <View
      style={{
        backgroundColor: colors.primaryLight,
        borderRadius: radii.md,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(30,79,217,0.15)',
      }}
      accessibilityRole="button"
      accessibilityLabel="Settings and feedback tip"
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Ionicons name="settings-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, flex: 1, lineHeight: 19 }}>
          {SETTINGS_HINT}
        </Text>
        <Pressable
          onPress={() => void dismiss()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss settings tip"
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <Pressable
          onPress={onOpenSettings}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.full,
            backgroundColor: colors.primary,
            paddingVertical: spacing.sm,
          }}
          accessibilityRole="button"
          accessibilityLabel={SETTINGS_SUPPORT.ctaSettings}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' }}>{SETTINGS_SUPPORT.ctaSettings}</Text>
        </Pressable>
        <Pressable
          onPress={onReportProblem}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: spacing.sm,
          }}
          accessibilityRole="button"
          accessibilityLabel={SETTINGS_SUPPORT.ctaReport}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary }}>
            {SETTINGS_SUPPORT.ctaReport}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
