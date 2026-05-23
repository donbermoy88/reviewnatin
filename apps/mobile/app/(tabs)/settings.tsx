import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/card';
import { PrimaryButton } from '../../components/primary-button';
import { ScreenScroll } from '../../components/screen-scroll';
import { SectionHeader } from '../../components/section-header';
import { colors, spacing, type } from '../../constants/theme';
import { SITE_URL, DISCLAIMERS } from '@reviewnatin/shared';
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
    <ScreenScroll>
      <SectionHeader title="Settings" />

      <Text style={styles.sectionLabel}>Account</Text>
      <Card style={styles.block}>
        <Text style={styles.row}>Status: {isSupabaseConfigured ? 'Connected' : 'Not configured'}</Text>
        <Text style={styles.row}>Email: {user?.email ?? 'Guest'}</Text>
        {!user ? (
          <PrimaryButton label="Mag-login" onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.md }} />
        ) : (
          <PrimaryButton label="Mag-logout" variant="outline" onPress={() => signOut()} style={{ marginTop: spacing.md }} />
        )}
      </Card>

      <Text style={styles.sectionLabel}>App</Text>
      <Card style={styles.block}>
        <Text style={styles.row}>Expo SDK 56 · reviewnatinph.com</Text>
        <PrimaryButton
          label="Open website"
          variant="outline"
          onPress={() => Linking.openURL(SITE_URL)}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Text style={styles.sectionLabel}>Legal</Text>
      <Card style={styles.block}>
        <Text style={styles.disclaimer}>{DISCLAIMERS.short}</Text>
      </Card>

      <Text style={styles.sectionLabel}>Developer</Text>
      <PrimaryButton label="Reset onboarding" variant="outline" onPress={resetOnboarding} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { ...type.subtitle, color: colors.primary, marginTop: spacing.md, marginBottom: spacing.sm },
  block: { marginBottom: spacing.sm },
  row: { ...type.body, marginBottom: spacing.xs },
  disclaimer: { ...type.caption, lineHeight: 18 },
});
