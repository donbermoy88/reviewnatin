import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from './auth-provider';
import { isEmailVerified } from '../lib/auth/email-verification';

function isAllowedWithoutVerification(segments: string[]): boolean {
  const root = segments[0];
  if (!root || root === 'index') return true;
  if (root === '(auth)' || root === 'auth' || root === 'subscribe') return true;
  return false;
}

/**
 * Redirects email/password users who have not verified their inbox to the OTP screen.
 * OAuth users (Google/Apple) skip this gate.
 */
export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (isEmailVerified(user)) return;
    if (isAllowedWithoutVerification(segments as string[])) return;

    const email = user.email ?? '';
    router.replace({
      pathname: '/(auth)/verify-email',
      params: email ? { email } : undefined,
    });
  }, [loading, user, segments, router]);

  return <>{children}</>;
}
