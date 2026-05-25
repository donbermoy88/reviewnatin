import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../supabase';

export type AuthLinkType = 'recovery' | 'signup' | 'magiclink' | 'invite' | string | null;

/** Exchange Supabase tokens from a deep link (password recovery, email confirm, etc.) */
export async function createSessionFromUrl(url: string): Promise<AuthLinkType> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const type = (params.type as AuthLinkType) ?? null;

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }

  return type;
}

export function isRecoveryUrl(url: string): boolean {
  return url.includes('type=recovery') || url.includes('reset-password');
}
