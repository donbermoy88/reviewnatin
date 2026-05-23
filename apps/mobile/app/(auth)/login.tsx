import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../../components/card';
import { PrimaryButton } from '../../components/primary-button';
import { ScreenScroll } from '../../components/screen-scroll';
import { colors, radii, spacing, type, fonts } from '../../constants/theme';
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
          /* optional */
        }
      }
    }

    setLoading(false);
    if (returnTo === 'onboarding') {
      router.replace({ pathname: '/onboarding', params: { step: '4' } });
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll>
        <View style={styles.hero}>
          <Text style={styles.brand}>ReviewNatin</Text>
          <Text style={styles.tagline}>Review together. Pass together.</Text>
        </View>

        <Card variant="elevated">
          <Text style={styles.title}>{mode === 'signin' ? 'Mag-login' : 'Gumawa ng account'}</Text>
          <Text style={styles.subtitle}>I-save ang progress mo sa cloud.</Text>

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
        </Card>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  hero: { marginBottom: spacing.lg },
  brand: { ...type.display, fontSize: 28 },
  tagline: { ...type.bodyMuted, marginTop: spacing.xs },
  title: { ...type.title },
  subtitle: { ...type.bodyMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    minHeight: 48,
  },
  error: { ...type.body, color: colors.error, marginBottom: spacing.md },
});
