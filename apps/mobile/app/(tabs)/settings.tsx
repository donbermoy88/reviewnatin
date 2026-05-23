import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/primary-button';
import { colors, spacing } from '../../constants/theme';
import { clearOnboarding } from '../../lib/onboarding-store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../providers/auth-provider';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const resetOnboarding = async () => {
    await clearOnboarding();
    router.replace('/onboarding');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.row}>Supabase: {isSupabaseConfigured ? 'Connected' : 'Not configured'}</Text>
      <Text style={styles.row}>Account: {user?.email ?? 'Guest'}</Text>
      <Text style={styles.link}>reviewnatinph.com</Text>

      {!user ? (
        <PrimaryButton label="Mag-login" onPress={() => router.push('/(auth)/login')} />
      ) : (
        <PrimaryButton label="Mag-logout" variant="outline" onPress={() => signOut()} style={{ marginTop: spacing.md }} />
      )}

      <PrimaryButton
        label="Reset onboarding (dev)"
        variant="outline"
        onPress={resetOnboarding}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  row: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  link: { fontSize: 14, color: colors.primary, marginBottom: spacing.lg },
});
