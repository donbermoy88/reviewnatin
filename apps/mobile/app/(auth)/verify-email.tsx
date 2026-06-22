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
import { trackEvent } from '../../lib/analytics/events';
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
    email?: string;
    displayName?: string;
  }>();
  const { verifyEmailOtp, resendEmailOtp, user, isConfigured } = useAuth();

  const email = (emailParam ?? user?.email ?? '').trim().toLowerCase();
  const displayName = displayNameParam?.trim() ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resendCount, setResendCount] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/signup');
    }
  }, [email, router]);

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
          Nag-send kami ng 6-digit code sa{'\n'}
          <Text style={styles.emailHighlight}>{email || '…'}</Text>
        </Text>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        {verified ? (
          <Animated.View entering={ZoomIn.duration(400)} style={styles.successBox}>
            <Animated.View entering={FadeIn.delay(200)}>
              <Text style={styles.successEmoji}>✓</Text>
              <Text style={styles.successTitle}>Verified!</Text>
              <Text style={styles.successSub}>Dadalhin ka na sa onboarding…</Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <>
        <Text style={styles.label}>Verification code</Text>
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
