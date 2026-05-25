import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AuthShell, authFieldStyles } from '../../components/auth-shell';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createSessionFromUrl } from '../../lib/auth/deep-link-auth';
import { validatePassword } from '../../lib/auth/validation';
import { getAppEntryHref } from '../../lib/onboarding-nav';
import { useAuth } from '../../providers/auth-provider';

function LabeledField({
  label,
  children,
  styles,
}: {
  label: string;
  children: ReactNode;
  styles: ReturnType<typeof authFieldStyles>;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = authFieldStyles(theme);
  const { setNewPassword, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    (async () => {
      const url = await Linking.getInitialURL();
      if (url?.includes('access_token')) {
        try {
          await createSessionFromUrl(url);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Invalid recovery link');
        }
      }
      setSessionReady(true);
    })();

    const sub = Linking.addEventListener('url', async ({ url }) => {
      if (!url.includes('access_token')) return;
      try {
        await createSessionFromUrl(url);
        setSessionReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid recovery link');
      }
    });

    return () => sub.remove();
  }, []);

  const submit = async () => {
    setError(null);
    const passwordError = validatePassword(password, true);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('Hindi mag-match ang passwords.');
      return;
    }
    if (!session) {
      setError('Expired na ang link. Humingi ng bagong reset email.');
      return;
    }
    setLoading(true);
    const result = await setNewPassword(password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace(await getAppEntryHref(session.user.id));
  };

  if (!sessionReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthShell title="Bagong password" subtitle="Mag-set ng bagong password para sa account mo.">
      {!session ? (
        <Text style={{ ...styles.error, color: theme.colors.textMuted }}>
          Buksan ang reset link mula sa email mo, o humingi ng bago sa Forgot password.
        </Text>
      ) : null}
      <LabeledField label="Bagong password" styles={styles}>
        <TextInput
          style={styles.input}
          placeholder="Hindi bababa sa 8 characters"
          placeholderTextColor={theme.colors.textLight}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading && !!session}
        />
      </LabeledField>
      <LabeledField label="Kumpirmahin ang password" styles={styles}>
        <TextInput
          style={styles.input}
          placeholder="Dapat pareho sa password"
          placeholderTextColor={theme.colors.textLight}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          editable={!loading && !!session}
        />
      </LabeledField>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <PrimaryButton label="I-save ang password" size="lg" onPress={submit} disabled={!session} />
      )}
      <Pressable onPress={() => router.replace('/(auth)/login')} style={{ marginTop: theme.spacing.lg }} hitSlop={8}>
        <Text style={styles.backLink}>← Bumalik sa login</Text>
      </Pressable>
    </AuthShell>
  );
}
