import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, TextInput as RNTextInput } from 'react-native';
import {
  ActivityIndicator,
  Keyboard,
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
import { updateUserDisplayName } from '../../lib/api/profile';
import { validateEmail, validatePassword } from '../../lib/auth/validation';
import { validateEmailNotDisposable } from '../../lib/auth/disposable-email';
import { AuthLabeledField } from '../../components/auth-labeled-field';
import { PasswordStrengthMeter } from '../../components/password-strength-meter';
import { TurnstileCaptcha } from '../../components/turnstile-captcha';
import { trackEvent } from '../../lib/analytics/events';
import { isTurnstileRequired } from '../../lib/auth/turnstile-config';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { useAuth } from '../../providers/auth-provider';

type SignupField = 'name' | 'email' | 'password';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, radii, spacing } = theme;
  const styles = useMemo(() => createSignupStyles(theme), [theme]);
  const { signUp, signInGoogle, signInApple, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const turnstileRequired = isTurnstileRequired();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [formTop, setFormTop] = useState(0);
  const [fieldTop, setFieldTop] = useState<Record<SignupField, number>>({
    name: 0,
    email: 0,
    password: 0,
  });
  const scrollRef = useRef<ScrollView>(null);
  const nameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const recordFieldTop =
    (field: SignupField) => (event: LayoutChangeEvent) => {
      const y = event.nativeEvent.layout.y;
      setFieldTop((current) => (current[field] === y ? current : { ...current, [field]: y }));
    };

  const scrollToField = (field: SignupField) => {
    const y = Math.max(formTop + fieldTop[field] - 120, 0);
    const scroll = () => scrollRef.current?.scrollTo({ y, animated: true });

    requestAnimationFrame(scroll);
    setTimeout(scroll, Platform.OS === 'android' ? 260 : 120);
  };

  const submit = async () => {
    setError(null);
    setInfo(null);

    if (!displayName.trim()) {
      setError('Pakilagay ang pangalan mo.');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const disposableError = validateEmailNotDisposable(email);
    if (disposableError) {
      setError(disposableError);
      return;
    }

    const passwordError = validatePassword(password, true);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!isConfigured) {
      setError('Supabase is not connected. Check the apps/mobile/.env file.');
      return;
    }

    if (turnstileRequired && !captchaToken) {
      setError('Please complete the security verification.');
      return;
    }

    setLoading(true);
    trackEvent('registration_started', { method: 'email' });
    const result = await signUp(email, password, captchaToken ?? undefined);

    if (result.error) {
      setError(toUserFacingError(result.error, 'auth'));
      setCaptchaToken(null);
      setCaptchaResetKey((k) => k + 1);
      setLoading(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      trackEvent('otp_sent', { trigger: 'signup' });
      setLoading(false);
      router.replace({
        pathname: '/(auth)/verify-email',
        params: {
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
        },
      });
      return;
    }

    const userId = result.session?.user?.id;
    if (!userId) {
      setError('Nagawa na ang account, pero walang session. Pakilog-in na lang.');
      setLoading(false);
      return;
    }

    // Persist the name into auth metadata + public.users.
    try {
      const updateResult = await updateUserDisplayName(displayName.trim());
      if (!updateResult.ok) {
        setInfo(`Account created, but name sync failed: ${updateResult.error}`);
      }
    } catch {
      // Non-fatal — display name can be updated later from settings.
    }

    const syncError = await syncOnboardingAfterAuth(userId);
    if (syncError) {
      setInfo(`Logged in, but goal sync failed: ${syncError}`);
    }
    setLoading(false);
    router.replace((await getAppEntryHref(userId)) ?? '/onboarding');
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
    router.replace(await getAppEntryHref(sessionUserId));
  };

  const oauth = async (provider: 'google' | 'apple') => {
    setError(null);
    setLoading(true);
    const result = provider === 'google' ? await signInGoogle() : await signInApple();
    if (result.error) {
      setError(toUserFacingError(result.error, 'auth'));
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
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        bounces={false}
        automaticallyAdjustKeyboardInsets
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

        <View
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            setFormTop((current) => (current === y ? current : y));
          }}
          style={[
            styles.form,
            { paddingBottom: insets.bottom + spacing.xl + (keyboardVisible ? 160 : 0) },
          ]}
        >
          <Text style={styles.title}>Gumawa ng account</Text>
          <Text style={styles.subtitle}>Simulan ang review mo.</Text>

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
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radii.lg}
              style={styles.appleButton}
              onPress={() => oauth('apple')}
            />
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o gamitin ang email</Text>
            <View style={styles.dividerLine} />
          </View>

          <AuthLabeledField
            label="Name"
            onLayout={recordFieldTop('name')}
            onFocusField={() => nameRef.current?.focus()}
            disabled={loading}
          >
            <TextInput
              ref={nameRef}
              style={styles.input}
              placeholder="Pangalan mo"
              placeholderTextColor={colors.textLight}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              showSoftInputOnFocus
              onSubmitEditing={() => emailRef.current?.focus()}
              onFocus={() => scrollToField('name')}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
              accessibilityLabel="Display name"
            />
          </AuthLabeledField>

          <AuthLabeledField
            label="Email"
            onLayout={recordFieldTop('email')}
            onFocusField={() => emailRef.current?.focus()}
            disabled={loading}
          >
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="e.g. reviewer@email.com"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              showSoftInputOnFocus
              onSubmitEditing={() => passwordRef.current?.focus()}
              onFocus={() => scrollToField('email')}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              accessibilityLabel="Email address"
            />
          </AuthLabeledField>

          <AuthLabeledField
            label="Password"
            onLayout={recordFieldTop('password')}
            onFocusField={() => passwordRef.current?.focus()}
            disabled={loading}
          >
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput]}
                placeholder="Create a password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
                showSoftInputOnFocus
                onFocus={() => scrollToField('password')}
                onSubmitEditing={submit}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.passwordToggle}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
            <Text style={styles.helperText}>At least 8 characters, upper, lower, and number</Text>
            <PasswordStrengthMeter password={password} />
          </AuthLabeledField>

          {turnstileRequired ? (
            <TurnstileCaptcha
              resetKey={captchaResetKey}
              onToken={setCaptchaToken}
            />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <PrimaryButton
              label="Gumawa ng account"
              size="lg"
              icon="person-add-outline"
              iconPosition="left"
              onPress={submit}
            />
          )}

          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={styles.modeSwitch}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Switch to log in"
          >
            <Text style={styles.modeSwitchText}>
              Already have an account?{' '}
              <Text style={styles.modeSwitchBold}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createSignupStyles(theme: AppTheme) {
  const { colors, fonts, radii, spacing, type } = theme;
  return StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
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
    passwordRow: {
      position: 'relative',
      justifyContent: 'center',
    },
    passwordInput: {
      paddingRight: 48,
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.md,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    helperText: {
      ...type.caption,
      textTransform: 'none',
      letterSpacing: 0,
      color: colors.textLight,
      marginTop: 6,
    },
    error: { ...type.body, color: colors.error, marginBottom: spacing.md, fontSize: 14 },
    info: { ...type.body, color: colors.primary, marginBottom: spacing.md, fontSize: 14 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { ...type.caption, textTransform: 'none', color: colors.textMuted },
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
  });
}
