import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../../components/primary-button';
import { colors, spacing } from '../../constants/theme';
import { syncExamGoal } from '../../lib/api/goals';
import { getOnboarding } from '../../lib/onboarding-store';
import { useAuth } from '../../providers/auth-provider';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: authError } = await fn(email.trim(), password);
    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    const { data: sessionData } = await import('../../lib/supabase').then((m) => m.supabase.auth.getSession());
    const userId = sessionData.session?.user?.id;
    if (userId) {
      const onboarding = await getOnboarding();
      if (onboarding?.completed) {
        try {
          await syncExamGoal(userId, onboarding);
        } catch {
          /* goal sync optional on first login */
        }
      }
    }

    setLoading(false);
    if (returnTo === 'onboarding') {
      router.replace('/onboarding?step=3');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{mode === 'signin' ? 'Mag-login' : 'Gumawa ng account'}</Text>
        <Text style={styles.subtitle}>
          I-save ang progress mo, quiz scores, at PasaPath sa cloud.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : (
          <PrimaryButton label={mode === 'signin' ? 'Mag-login' : 'Mag-sign up'} onPress={submit} />
        )}

        <PrimaryButton
          label={mode === 'signin' ? 'Walang account? Mag-sign up' : 'May account na? Mag-login'}
          variant="outline"
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{ marginTop: spacing.sm }}
        />

        <PrimaryButton
          label="Magpatuloy bilang guest"
          variant="outline"
          onPress={() => router.replace('/(tabs)')}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  error: { color: colors.error, marginBottom: spacing.md, fontSize: 14 },
});
