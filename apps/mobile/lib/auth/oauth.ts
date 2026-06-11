import * as AuthSession from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getGoogleClientId, isGoogleSignInConfigured } from './google-config';
import { getGoogleOAuthRedirectUri, requestGoogleIdToken } from './google-sign-in';

export function getOAuthRedirectUrl() {
  const clientId = getGoogleClientId();
  return clientId ? getGoogleOAuthRedirectUri(clientId) : null;
}

function mapGoogleProviderError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Google provider is not yet enabled on Supabase. Run: npm run supabase:google';
  }
  if (m.includes('invalid') && m.includes('token')) {
    return 'Invalid Google token. Make sure Client IDs match between Supabase and app .env.';
  }
  return message;
}

/** Google → ID token (native) → Supabase session. Works on iOS/Android Expo Go without Safari redirects. */
export async function signInWithGoogle(): Promise<{
  error: string | null;
  cancelled?: boolean;
  session?: Session | null;
}> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not connected.' };
  }

  if (!isGoogleSignInConfigured()) {
    return {
      error:
        'Google Sign-In is not set up. In the project root, run: npm run supabase:google — then restart Expo.',
    };
  }

  const { idToken, error } = await requestGoogleIdToken();
  if (error) return { error: mapGoogleProviderError(error) };
  if (!idToken) return { error: null, cancelled: true };

  const { data, error: sessionError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (sessionError) return { error: mapGoogleProviderError(sessionError.message) };
  return { error: null, session: data.session };
}

/** Apple only returns the user's name on the FIRST authorization — capture it then. */
function formatAppleFullName(fullName: {
  givenName?: string | null;
  familyName?: string | null;
} | null): string | null {
  if (!fullName) return null;
  const name = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim();
  return name || null;
}

export async function signInWithApple(): Promise<{
  error: string | null;
  cancelled?: boolean;
  fullName?: string | null;
  session?: Session | null;
}> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not connected.' };
  }

  if (Platform.OS !== 'ios') {
    return { error: 'Apple Sign-In is only available on iOS.' };
  }

  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: 'No identity token received from Apple.' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) return { error: error.message };
    return {
      error: null,
      fullName: formatAppleFullName(credential.fullName),
      session: data.session,
    };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === 'ERR_REQUEST_CANCELED') return { error: null, cancelled: true };
    return { error: 'Unable to sign in with Apple.' };
  }
}

export async function sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not connected.' };
  }

  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'reviewnatin',
    path: '(auth)/reset-password',
  });
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not connected.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { error: null };
}
