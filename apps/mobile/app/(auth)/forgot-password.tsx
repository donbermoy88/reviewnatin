import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AuthShell, authFieldStyles } from '../../components/auth-shell';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { validateEmail } from '../../lib/auth/validation';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = authFieldStyles(theme);
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setInfo(null);
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!isConfigured) {
      setError('Hindi pa naka-connect ang Supabase.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setInfo('Na-send ang reset link sa email mo. Buksan ang link para mag-set ng bagong password.');
  };

  return (
    <AuthShell
      title="Nakalimutan ang password?"
      subtitle="I-send namin ang reset link sa email mo."
    >
      <LabeledField label="Email" styles={styles}>
        <TextInput
          style={styles.input}
          placeholder="hal. reviewer@email.com"
          placeholderTextColor={theme.colors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </LabeledField>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <PrimaryButton label="I-send ang reset link" size="lg" onPress={submit} />
      )}
      <Pressable onPress={() => router.back()} style={{ marginTop: theme.spacing.lg }} hitSlop={8}>
        <Text style={styles.backLink}>← Bumalik sa login</Text>
      </Pressable>
    </AuthShell>
  );
}
