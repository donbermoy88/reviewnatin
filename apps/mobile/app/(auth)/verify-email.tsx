import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LogoMark } from '../../components/logo-mark';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { syncOnboardingAfterAuth } from '../../lib/auth/post-auth';
import { updateUserDisplayName } from '../../lib/api/profile';
import { getAppEntryHref } from '../../lib/onboarding-nav';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { verifyEmailParamsFromUrl } from '../../lib/deep-link-routes';
import { consumeInitialUrl, peekInitialUrl } from '../../lib/initial-url';
import { trackEvent } from '../../lib/analytics/events';
import { FREE_VERIFY_EMAIL } from '../../lib/product-copy';
import { useAuth } from '../../providers/auth-provider';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;
const MAX_RESENDS_PER_DAY = 5;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, spacing } = theme;
  const { email: emailParam, displayName: displayNameParam } = useLocalSearchParams<{
    email?: string | string[];
    displayName?: string | string[];
  }>();
  const { verifyEmailOtp, resendEmailOtp, user, isConfigured } = useAuth();

  const normalizeParam = (value?: string | string[]) => {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
  };

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resendCount, setResendCount] = useState(0);
  const [verified, setVerified] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [fallbackDisplayName, setFallbackDisplayName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const fromRoute = normalizeParam(emailParam).trim().toLowerCase();
    const fromName = normalizeParam(displayNameParam).trim();
    if (fromRoute) setFallbackEmail((current) => current || fromRoute);
    if (fromName) setFallbackDisplayName((current) => current || fromName);
  }, [displayNameParam, emailParam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let emailFromLink = normalizeParam(emailParam);
      let nameFromLink = normalizeParam(displayNameParam).trim();

      const applyParams = (params: ReturnType<typeof verifyEmailParamsFromUrl>) => {
        if (!params) return;
        emailFromLink = emailFromLink || params.email;
        nameFromLink = nameFromLink || params.displayName || '';
      };

      applyParams(verifyEmailParamsFromUrl(peekInitialUrl() ?? ''));
      try {
        applyParams(verifyEmailParamsFromUrl((await consumeInitialUrl()) ?? ''));
      } catch {
        // Non-fatal — router params may still carry email.
      }

      if (!cancelled) {
        setFallbackEmail(emailFromLink);
        setFallbackDisplayName(nameFromLink);
        setBootReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [displayNameParam, emailParam]);

  const email = (
    normalizeParam(emailParam) ||
    fallbackEmail ||
    user?.email ||
    ''
  ).trim().toLowerCase();
  const displayName = normalizeParam(displayNameParam).trim() || fallbackDisplayName.trim();

  // Cold-start deep links can land here before the email param resolves. Rather
  // than bouncing the user to /signup (the previously audited cold-deeplink
  // bug), we keep them on the verify screen and offer a manual email entry
  // fallback (see render below) so a code can always be requested.
  useEffect(() => {
    if (!bootReady || email) return;
    void (async () => {
      const initialUrl = peekInitialUrl() ?? (await consumeInitialUrl());
      const params = verifyEmailParamsFromUrl(initialUrl ?? '');
      if (params?.email) {
        setFallbackEmail(params.email);
        if (params.displayName) setFallbackDisplayName(params.displayName);
      }
    })();
  }, [bootReady, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const otpValue = digits.join('');

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    setError(null);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const finishVerified = useCallback(
    async (userId: string) => {
      if (displayName) {
        try {
          await updateUserDisplayName(displayName);
        } catch {
          // Non-fatal
        }
      }
      await syncOnboardingAfterAuth(userId);
      router.replace((await getAppEntryHref(userId)) ?? '/onboarding');
    },
    [displayName, router]
  );

  const submit = async () => {
    setError(null);
    setInfo(null);

    if (otpValue.length !== OTP_LENGTH) {
      setError('Ilagay ang 6-digit code mula sa email mo.');
      return;
    }

    if (!isConfigured) {
      setError('Supabase is not connected.');
      return;
    }

    setLoading(true);
    const result = await verifyEmailOtp(email, otpValue);
    if (result.error) {
      setError(toUserFacingError(result.error, 'auth'));
      setLoading(false);
      return;
    }

    const userId = result.session?.user?.id;
    if (!userId) {
      setError('Na-verify na, pero walang session. Pakisubukan ulit.');
      setLoading(false);
      return;
    }

    setInfo('Na-verify na ang email mo!');
    trackEvent('otp_verified');
    setVerified(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 700));
    await finishVerified(userId);
    setLoading(false);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    if (resendCount >= MAX_RESENDS_PER_DAY) {
      setError('Naabot mo na ang limit ng resend ngayong araw. Subukan bukas.');
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);
    const result = await resendEmailOtp(email);
    setLoading(false);

    if (result.error) {
      setError(toUserFacingError(result.error, 'auth'));
      return;
    }

    setResendCount((c) => c + 1);
    setCooldown(RESEND_COOLDOWN_SEC);
    setDigits(Array(OTP_LENGTH).fill(''));
    setInfo('Na-send na ulit ang code sa email mo. Valid for 10 minutes.');
    trackEvent('otp_sent', { trigger: 'resend' });
    inputRefs.current[0]?.focus();
  };

  const sendToManualEmail = async () => {
    const normalized = manualEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Ilagay ang valid na email address mo.');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    const result = await resendEmailOtp(normalized);
    setLoading(false);
    if (result.error) {
      setError(toUserFacingError(result.error, 'auth'));
      return;
    }
    setFallbackEmail(normalized);
    setCooldown(RESEND_COOLDOWN_SEC);
    setInfo('Na-send na ang code sa email mo. Valid for 10 minutes.');
    trackEvent('otp_sent', { trigger: 'manual_entry' });
  };

  if (!bootReady) {
    return (
      <View style={[styles.flex, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
      >
        <LogoMark size={56} />
        <Text style={styles.heroTitle}>I-verify ang email</Text>
        <Text style={styles.heroSub}>
          {email ? (
            <>
              Nag-send kami ng 6-digit code sa{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </>
          ) : (
            'Ilagay ang email mo para makakuha ng 6-digit verification code.'
          )}
        </Text>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!email ? (
          <>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.emailInput}
              value={manualEmail}
              onChangeText={(v) => {
                setManualEmail(v);
                setError(null);
              }}
              placeholder="juan@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              accessibilityLabel="Email address"
            />
            <Text style={styles.hint}>
              Ipapadala namin ang verification code dito. Check spam folder kung wala sa inbox.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <PrimaryButton
                label="Magpadala ng code"
                size="lg"
                icon="mail-outline"
                onPress={sendToManualEmail}
                accessibilityLabel="Magpadala ng verification code"
              />
            )}

            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backLink}
              accessibilityRole="button"
              accessibilityLabel="Bumalik sa login"
            >
              <Text style={styles.backLinkText}>Bumalik sa login</Text>
            </Pressable>
          </>
        ) : verified ? (
          <Animated.View entering={ZoomIn.duration(400)} style={styles.successBox}>
            <Animated.View entering={FadeIn.delay(200)}>
              <Text style={styles.successEmoji}>✓</Text>
              <Text style={styles.successTitle}>Verified!</Text>
              <Text style={styles.successSub}>Dadalhin ka na sa onboarding…</Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <>
        <View style={styles.freeAccountCard} accessibilityLabel="Free account email verification guidance">
          <View style={styles.freeAccountBadge}>
            <Text style={styles.freeAccountBadgeText}>{FREE_VERIFY_EMAIL.title}</Text>
          </View>
          <Text style={styles.freeAccountText}>{FREE_VERIFY_EMAIL.subtitle}</Text>
          <View style={styles.checklist}>
            {FREE_VERIFY_EMAIL.checklist.map((item) => (
              <View key={item} style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.label}>Verification code</Text>
        <Text style={styles.emailContext} accessibilityLabel={`Verification email sent to ${email}`}>
          {FREE_VERIFY_EMAIL.emailPrefix} {email}
        </Text>
        <View style={styles.otpRow} accessibilityLabel="Enter 6-digit verification code">
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleDigitChange(index, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              showSoftInputOnFocus
              autoFocus={index === 0}
              editable={!loading}
              accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </View>

        <Text style={styles.hint}>Valid for 10 minutes. Check spam folder kung wala sa inbox.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : (
          <PrimaryButton
            label="I-verify at magpatuloy"
            size="lg"
            icon="checkmark-circle-outline"
            onPress={submit}
            disabled={otpValue.length !== OTP_LENGTH}
            accessibilityLabel="I-verify at magpatuloy"
          />
        )}

        <Pressable
          onPress={resend}
          disabled={loading || cooldown > 0}
          style={styles.resendBtn}
          accessibilityRole="button"
          accessibilityLabel={cooldown > 0 ? `Resend code in ${cooldown} seconds` : 'Resend verification code'}
        >
          <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
            {cooldown > 0
              ? `I-resend ang code (${cooldown}s)`
              : resendCount >= MAX_RESENDS_PER_DAY
                ? 'Naabot na ang resend limit ngayon'
                : 'Hindi natanggap? I-resend ang code'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.backLink}
          accessibilityRole="button"
          accessibilityLabel="Bumalik sa login"
        >
          <Text style={styles.backLinkText}>Bumalik sa login</Text>
        </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts, radii, spacing, type } = theme;
  return StyleSheet.create({
    flex: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    hero: {
      alignItems: 'center',
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    heroTitle: {
      fontFamily: type.headline.fontFamily,
      fontSize: 22,
      color: '#fff',
      marginTop: spacing.md,
    },
    heroSub: {
      fontFamily: type.body.fontFamily,
      fontSize: 14,
      color: 'rgba(255,255,255,0.85)',
      marginTop: spacing.sm,
      textAlign: 'center',
      lineHeight: 20,
    },
    emailHighlight: {
      fontFamily: fonts.bodyBold,
      color: '#fff',
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    label: {
      ...type.label,
      marginBottom: spacing.sm,
    },
    freeAccountCard: {
      borderRadius: radii.xl,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: 'rgba(30,79,217,0.16)',
      padding: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    freeAccountBadge: {
      alignSelf: 'flex-start',
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
    },
    freeAccountBadgeText: {
      fontFamily: fonts.bodyBold,
      fontSize: 11,
      color: '#fff',
      letterSpacing: 0.2,
    },
    freeAccountText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.text,
      lineHeight: 19,
    },
    checklist: {
      gap: 6,
    },
    checkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    checkIcon: {
      fontFamily: fonts.bodyBold,
      color: colors.primary,
      fontSize: 13,
    },
    checkText: {
      fontFamily: fonts.bodyMedium,
      color: colors.textMuted,
      fontSize: 12,
    },
    emailContext: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      color: colors.primary,
      marginTop: -spacing.xs,
      marginBottom: spacing.sm,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    otpBox: {
      flex: 1,
      maxWidth: 52,
      height: 56,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      textAlign: 'center',
      fontSize: 22,
      fontFamily: fonts.bodyBold,
      color: colors.text,
    },
    otpBoxFilled: {
      borderColor: colors.primary,
    },
    emailInput: {
      height: 52,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      fontFamily: fonts.body,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    hint: {
      ...type.caption,
      textTransform: 'none',
      color: colors.textMuted,
      marginBottom: spacing.lg,
      lineHeight: 18,
    },
    error: { ...type.body, color: colors.error, marginBottom: spacing.md, fontSize: 14 },
    info: { ...type.body, color: colors.primary, marginBottom: spacing.md, fontSize: 14 },
    resendBtn: {
      marginTop: spacing.lg,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      minHeight: 48,
      justifyContent: 'center',
    },
    resendText: {
      ...type.subtitle,
      color: colors.primary,
    },
    resendDisabled: {
      color: colors.textMuted,
    },
    backLink: {
      marginTop: spacing.md,
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    backLinkText: {
      ...type.subtitle,
      color: colors.textMuted,
    },
    successBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
    },
    successEmoji: {
      fontSize: 48,
      textAlign: 'center',
      color: colors.success,
      marginBottom: spacing.md,
    },
    successTitle: {
      ...type.headline,
      fontSize: 22,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    successSub: {
      ...type.subtitle,
      textAlign: 'center',
      color: colors.textMuted,
    },
  });
}
