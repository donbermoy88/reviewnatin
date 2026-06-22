import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { SETTINGS_HINT } from '../lib/product-copy';

const HINT_KEY = 'reviewnatin:coach:settings_hint';

/** One-time hint for Settings discoverability (G4, all cohorts). */
export function ProfileSettingsHint() {
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
    <Pressable
      onPress={() => void dismiss()}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: colors.primaryLight,
        borderRadius: radii.md,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(30,79,217,0.15)',
      }}
      accessibilityRole="button"
      accessibilityLabel="Dismiss settings tip"
    >
      <Ionicons name="settings-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, flex: 1, lineHeight: 19 }}>
        {SETTINGS_HINT}
      </Text>
      <Ionicons name="close" size={16} color={colors.textMuted} />
    </Pressable>
  );
}
