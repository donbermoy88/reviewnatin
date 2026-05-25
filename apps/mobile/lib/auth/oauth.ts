import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../supabase';
import { isGoogleSignInConfigured } from './google-config';
import { getGoogleClientId } from './google-config';
import { getGoogleOAuthRedirectUri, requestGoogleIdToken } from './google-sign-in';

export function getOAuthRedirectUrl() {
  const clientId = getGoogleClientId();
  return clientId ? getGoogleOAuthRedirectUri(clientId) : null;
}

function mapGoogleProviderError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Google provider hindi pa naka-enable sa Supabase. Run: npm run supabase:google';
  }
  if (m.includes('invalid') && m.includes('token')) {
    return 'Invalid Google token. Siguraduhing naka-match ang Client IDs sa Supabase at sa app .env.';
  }
  return message;
}

/** Google → ID token (native) → Supabase session. Works on iOS/Android Expo Go without Safari redirects. */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Hindi pa naka-connect ang Supabase.' };
  }

  if (!isGoogleSignInConfigured()) {
    return {
      error:
        'Google Sign-In hindi pa naka-setup. Sa project root, run: npm run supabase:google — then restart Expo.',
    };
  }

  const { idToken, error } = await requestGoogleIdToken();
  if (error) return { error: mapGoogleProviderError(error) };
  if (!idToken) return { error: null };

  const { error: sessionError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (sessionError) return { error: mapGoogleProviderError(sessionError.message) };
  return { error: null };
}

export async function signInWithApple(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Hindi pa naka-connect ang Supabase.' };
  }

  if (Platform.OS !== 'ios') {
    return { error: 'Apple Sign-In available lang sa iOS.' };
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
      return { error: 'Walang identity token mula sa Apple.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) return { error: error.message };
    return { error: null };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === 'ERR_REQUEST_CANCELED') return { error: null };
    return { error: 'Hindi makapag-login gamit ang Apple.' };
  }
}

export async function sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Hindi pa naka-connect ang Supabase.' };
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
    return { error: 'Hindi pa naka-connect ang Supabase.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { error: null };
}
