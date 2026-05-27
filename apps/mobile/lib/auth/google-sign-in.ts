import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  AccessTokenRequest,
  AuthRequest,
  ResponseType,
  makeRedirectUri,
} from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { getGoogleClientIds, getGoogleIosUrlScheme, isGoogleSignInConfigured } from './google-config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** True when running a custom dev/production build (ph.reviewnatin.app), not Expo Go. */
export function isGoogleIosNativeBuild(): boolean {
  return Platform.OS === 'ios' && !isExpoGo();
}

/**
 * Google iOS OAuth clients require the reversed-client-id redirect scheme.
 * exp://… (Expo Go) causes Google Error 400 invalid_request.
 */
export function getGoogleOAuthRedirectUri(clientId: string): string {
  if (Platform.OS === 'ios' && clientId.includes('.apps.googleusercontent.com')) {
    const scheme = getGoogleIosUrlScheme(clientId);
    if (scheme) return `${scheme}:/oauthredirect`;
  }

  return makeRedirectUri({
    scheme: 'reviewnatin',
    path: 'auth/callback',
    preferLocalhost: true,
  });
}

function resolveGoogleClientId(): string {
  const ids = getGoogleClientIds();
  const web = ids.web!;

  if (Platform.OS === 'ios') {
    return ids.ios ?? web;
  }

  if (Platform.OS === 'android') {
    if (ids.android) return ids.android;
    return web;
  }

  return web;
}

/**
 * Native Google OAuth (PKCE) → ID token → Supabase.
 * iOS requires a dev/production build (ph.reviewnatin.app); Expo Go is not supported.
 */
export async function requestGoogleIdToken(): Promise<{ idToken: string | null; error: string | null }> {
  if (!isGoogleSignInConfigured()) {
    return {
      idToken: null,
      error:
        'Google Sign-In is not set up. In the project root, run: npm run supabase:google — then restart Expo.',
    };
  }

  if (Platform.OS === 'ios' && isExpoGo()) {
    return {
      idToken: null,
      error:
        'Google Sign-In sa iOS kailangan ng dev build (hindi Expo Go). Run: npm run mobile:ios:dev sa project root.',
    };
  }

  const clientId = resolveGoogleClientId();
  const redirectUri = getGoogleOAuthRedirectUri(clientId);

  const request = new AuthRequest({
    clientId,
    scopes: GOOGLE_SCOPES,
    redirectUri,
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams: { access_type: 'offline', prompt: 'select_account' },
  });

  await request.makeAuthUrlAsync(Google.discovery);
  const result = await request.promptAsync(Google.discovery, { showInRecents: true });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { idToken: null, error: null };
  }

  if (result.type !== 'success' || !result.params.code) {
    return { idToken: null, error: 'Google sign-in did not complete.' };
  }

  try {
    const tokenResponse = await new AccessTokenRequest({
      clientId,
      redirectUri,
      scopes: GOOGLE_SCOPES,
      code: result.params.code,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    }).performAsync(Google.discovery);

    const idToken = tokenResponse.idToken;
    if (!idToken) {
      return {
        idToken: null,
        error: 'No ID token received from Google. Check the OAuth client in Google Cloud Console.',
      };
    }

    return { idToken, error: null };
  } catch {
    return {
      idToken: null,
      error: 'Unable to get token from Google. Check the iOS OAuth client (bundle: ph.reviewnatin.app).',
    };
  }
}
