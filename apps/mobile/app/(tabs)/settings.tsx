import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { clearOnboarding } from '../../lib/onboarding-store';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();

  const resetOnboarding = async () => {
    await clearOnboarding();
    router.replace('/onboarding');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.row}>Supabase: {isSupabaseConfigured ? 'Connected' : 'Not configured (.env)'}</Text>
      <Text style={styles.link}>reviewnatinph.com</Text>
      <Pressable style={styles.btn} onPress={resetOnboarding}>
        <Text style={styles.btnText}>Reset onboarding (dev)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  row: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  link: { fontSize: 14, color: colors.primary, marginBottom: spacing.lg },
  btn: { backgroundColor: colors.border, padding: spacing.md, borderRadius: 12 },
  btnText: { textAlign: 'center', color: colors.text },
});
