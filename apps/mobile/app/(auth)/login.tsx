import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '../../components/logo-mark';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { syncOnboardingAfterAuth } from '../../lib/auth/post-auth';
import { getAppEntryHref } from '../../lib/onboarding-nav';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '../../lib/auth/validation';
import { useAuth } from '../../providers/auth-provider';

function LabeledField({
  label,
  children,
  styles,
}: {
  label: string;
  children: ReactNode;
  styles: ReturnType<typeof createLoginStyles>;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, radii, spacing } = theme;
  const styles = useMemo(() => createLoginStyles(theme), [theme]);
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signIn, signUp, signInGoogle, signInApple, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError(null);
    setInfo(null);
    setConfirmPassword('');
  };

  const replaceAfterAuth = async (userId: string) => {
    const href = await getAppEntryHref(userId);
    if (href === '/onboarding' && returnTo === 'onboarding') {
      router.replace({ pathname: '/onboarding', params: { step: '4' } });
      return;
    }

    router.replace(href);
  };

  const submit = async () => {
    setError(null);
    setInfo(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(password, mode === 'signup');
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (mode === 'signup') {
      const matchError = validatePasswordMatch(password, confirmPassword);
      if (matchError) {
        setError(matchError);
        return;
      }
    }

    if (!isConfigured) {
      setError('Supabase is not connected. Check the apps/mobile/.env file.');
      return;
    }

    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      setInfo('Nagawa na ang account! I-check ang email mo para i-confirm bago mag-log in.');
      setMode('signin');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
      return;
    }

    const userId = result.session?.user?.id;
    if (!userId) {
      setError('Naka-sign in pero walang session. Pakisubukan ulit mag-log in.');
      setMode('signin');
      setLoading(false);
      return;
    }

    const syncError = await syncOnboardingAfterAuth(userId);
    if (syncError) {
      setInfo(`Logged in, but goal sync failed: ${syncError}`);
    }
    setLoading(false);

    await replaceAfterAuth(userId);
  };

  const finishAuth = async (sessionUserId?: string) => {
    if (!sessionUserId) {
      setLoading(false);
      return;
    }
    const syncError = await syncOnboardingAfterAuth(sessionUserId);
    if (syncError) {
      setInfo(`Logged in, but goal sync failed: ${syncError}`);
    }
    setLoading(false);
    await replaceAfterAuth(sessionUserId);
  };

  const oauth = async (provider: 'google' | 'apple') => {
    setError(null);
    setLoading(true);
    const result = provider === 'google' ? await signInGoogle() : await signInApple();
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.cancelled) {
      setLoading(false);
      return;
    }
    await finishAuth(result.session?.user?.id);
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <LogoMark size={64} />
          <Text style={styles.heroBrand}>
            Review<Text style={{ color: colors.accent }}>Natin</Text>
          </Text>
          <Text style={styles.heroSub}>Mag-review tayo. Pasa tayo.</Text>
        </LinearGradient>

        <View style={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.title}>{mode === 'signin' ? 'Log in' : 'Create account'}</Text>
          <Text style={styles.subtitle}>I-save ang progress mo sa cloud.</Text>

          {!isConfigured ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and ANON_KEY in .env.
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Magpatuloy gamit ang Google"
            variant="outline"
            icon="logo-google"
            iconPosition="left"
            onPress={() => oauth('google')}
            disabled={loading}
          />

          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                mode === 'signin'
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              }
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radii.lg}
              style={styles.appleButton}
              onPress={() => oauth('apple')}
            />
          ) : null}

          <Pressable
            onPress={() => router.replace('/')}
            style={[styles.guestLink, { marginTop: 0, marginBottom: 4 }]}
            disabled={loading}
            hitSlop={8}
          >
            <Text style={styles.guestLinkText}>Magpatuloy bilang guest</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o gamitin ang email</Text>
            <View style={styles.dividerLine} />
          </View>

          <LabeledField label="Email" styles={styles}>
            <TextInput
              style={styles.input}
              placeholder="e.g. reviewer@email.com"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </LabeledField>

          <LabeledField label="Password" styles={styles}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
              placeholderTextColor={colors.textLight}
              secureTextEntry
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              autoComplete={mode === 'signup' ? 'password-new' : 'password'}
              returnKeyType={mode === 'signup' ? 'next' : 'done'}
              onSubmitEditing={mode === 'signup' ? () => confirmRef.current?.focus() : submit}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </LabeledField>

          {mode === 'signup' ? (
            <LabeledField label="Confirm password" styles={styles}>
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="Must match your password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={submit}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </LabeledField>
          ) : null}

          {mode === 'signin' ? (
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotRow}
              hitSlop={8}
            >
              <Text style={styles.forgotLink}>Nakalimutan ang password?</Text>
            </Pressable>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <PrimaryButton
              label={mode === 'signin' ? 'Log in' : 'Sign up'}
              size="lg"
              icon="log-in-outline"
              iconPosition="left"
              onPress={submit}
            />
          )}

          <Pressable
            onPress={() => {
              if (mode === 'signin') {
                router.push('/(auth)/signup');
              } else {
                switchMode('signin');
              }
            }}
            style={styles.modeSwitch}
            disabled={loading}
          >
            <Text style={styles.modeSwitchText}>
              {mode === 'signin' ? 'No account? ' : 'May account ka na? '}
              <Text style={styles.modeSwitchBold}>
                {mode === 'signin' ? 'Sign up' : 'Log in'}
              </Text>
            </Text>
          </Pressable>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createLoginStyles(theme: AppTheme) {
  const { colors, fonts, radii, spacing, type } = theme;
  return StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroBrand: {
    fontFamily: type.brand.fontFamily,
    fontSize: 28,
    color: '#fff',
    marginTop: spacing.md,
  },
  heroSub: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: { ...type.headline, fontSize: 24 },
  subtitle: { ...type.subtitle, marginTop: 4, marginBottom: spacing.lg },
  banner: {
    backgroundColor: colors.warnBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { ...type.body, fontSize: 13, color: colors.textMuted },
  appleButton: {
    width: '100%',
    height: 52,
    marginTop: spacing.sm,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  error: { ...type.body, color: colors.error, marginBottom: spacing.md, fontSize: 14 },
  info: { ...type.body, color: colors.primary, marginBottom: spacing.md, fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...type.caption, textTransform: 'none', color: colors.textMuted },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgotLink: { ...type.bodyMedium, color: colors.primary, fontSize: 14 },
  modeSwitch: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modeSwitchText: {
    ...type.subtitle,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modeSwitchBold: {
    color: colors.primary,
    fontFamily: type.label.fontFamily,
  },
  guestLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  guestLinkText: {
    ...type.bodyMedium,
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  });
}
