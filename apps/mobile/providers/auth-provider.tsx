import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { updateUserDisplayName } from '../lib/api/profile';
import { mapAuthError } from '../lib/auth/errors';
import { sendPasswordResetEmail, signInWithApple, signInWithGoogle, updatePassword } from '../lib/auth/oauth';
import { normalizeDisplayName, normalizeEmail, validateDisplayName } from '../lib/auth/validation';
import { addAppBreadcrumb, captureAppMessage } from '../lib/monitoring/events';
import { Sentry } from '../lib/monitoring/sentry';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type AuthResult = {
  error: string | null;
  cancelled?: boolean;
  session?: Session | null;
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInGoogle: () => Promise<AuthResult>;
  signInApple: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  setNewPassword: (password: string) => Promise<AuthResult>;
  updateDisplayName: (displayName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED: AuthResult = {
  error: 'Supabase is not configured. Check the apps/mobile/.env file.',
};

async function waitForSession(timeoutMs = 5000): Promise<Session | null> {
  const { data: initial } = await supabase.auth.getSession();
  if (initial.session) return initial.session;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      sub?.subscription.unsubscribe();
      resolve(null);
    }, timeoutMs);

    let settled = false;
    let sub:
      | {
          subscription: { unsubscribe: () => void };
        }
      | undefined;

    sub = supabase.auth.onAuthStateChange((_event, next) => {
      if (settled || !next) return;
      settled = true;
      clearTimeout(timeout);
      sub?.subscription.unsubscribe();
      resolve(next);
    }).data;
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    Sentry.setUser(userId ? { id: userId } : null);
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      async signIn(email, password) {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;

        const normalized = normalizeEmail(email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });

        if (error) {
          captureAppMessage('email sign-in failed', { area: 'auth', action: 'sign_in' }, { reason: mapAuthError(error.message) }, 'warning');
          return { error: mapAuthError(error.message) };
        }

        if (data.session) {
          addAppBreadcrumb('auth', 'email sign-in completed');
          setSession(data.session);
          return { error: null, session: data.session };
        }

        return { error: 'Login failed. Please try again.' };
      },
      async signUp(email, password) {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;

        const normalized = normalizeEmail(email);
        const displayName = normalized.split('@')[0];

        const { data, error } = await supabase.auth.signUp({
          email: normalized,
          password,
          options: {
            data: { display_name: displayName, full_name: displayName },
          },
        });

        if (error) {
          captureAppMessage('email sign-up failed', { area: 'auth', action: 'sign_up' }, { reason: mapAuthError(error.message) }, 'warning');
          return { error: mapAuthError(error.message) };
        }

        if (data.session) {
          addAppBreadcrumb('auth', 'email sign-up completed with session');
          setSession(data.session);
          return { error: null, session: data.session };
        }

        // Auto-confirm projects sometimes omit session on signUp — sign in immediately
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });

        if (signInData.session) {
          addAppBreadcrumb('auth', 'email sign-up auto sign-in completed');
          setSession(signInData.session);
          return { error: null, session: signInData.session };
        }

        if (data.user && !data.session) {
          return { error: null, needsEmailConfirmation: true };
        }

        return {
          error: mapAuthError(signInError?.message ?? 'Sign up failed. Please try again.'),
        };
      },
      async signInGoogle() {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;
        const { error, cancelled, session: signedInSession } = await signInWithGoogle();
        if (error) {
          captureAppMessage('google sign-in failed', { area: 'auth', action: 'google_sign_in' }, { reason: mapAuthError(error) }, 'warning');
          return { error: mapAuthError(error) };
        }
        if (cancelled) return { error: null, cancelled: true, session: null };
        // signInWithIdToken returns the session synchronously; only poll as a fallback.
        const nextSession = signedInSession ?? (await waitForSession());
        if (nextSession) setSession(nextSession);
        return nextSession
          ? { error: null, session: nextSession }
          : { error: 'Sign-in completed, but no session was created. Please try again.' };
      },
      async signInApple() {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;
        const { error, cancelled, fullName, session: signedInSession } = await signInWithApple();
        if (error) {
          captureAppMessage('apple sign-in failed', { area: 'auth', action: 'apple_sign_in' }, { reason: mapAuthError(error) }, 'warning');
          return { error: mapAuthError(error) };
        }
        if (cancelled) return { error: null, cancelled: true, session: null };
        // signInWithIdToken returns the session synchronously; only poll as a fallback.
        const nextSession = signedInSession ?? (await waitForSession());
        if (nextSession) setSession(nextSession);

        // Apple returns the name only on the FIRST authorization. Persist it
        // when the account doesn't already have a real display name, otherwise
        // Apple users are left nameless forever.
        if (nextSession && fullName) {
          const meta = nextSession.user.user_metadata as { display_name?: string } | undefined;
          const existing = meta?.display_name?.trim();
          const emailPrefix = nextSession.user.email?.split('@')[0];
          if (!existing || existing === emailPrefix) {
            const validationError = validateDisplayName(fullName);
            if (!validationError) {
              const result = await updateUserDisplayName(normalizeDisplayName(fullName));
              if (result.ok) {
                const { data } = await supabase.auth.getSession();
                if (data.session) setSession(data.session);
              }
            }
          }
        }

        return nextSession
          ? { error: null, session: nextSession }
          : { error: 'Sign-in completed, but no session was created. Please try again.' };
      },
      async resetPassword(email) {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;
        const { error } = await sendPasswordResetEmail(normalizeEmail(email));
        if (error) return { error: mapAuthError(error) };
        return { error: null };
      },
      async setNewPassword(password) {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;
        const { error } = await updatePassword(password);
        if (error) return { error: mapAuthError(error) };
        return { error: null };
      },
      async updateDisplayName(displayName) {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;

        const validationError = validateDisplayName(displayName);
        if (validationError) return { error: validationError };

        const normalized = normalizeDisplayName(displayName);
        const result = await updateUserDisplayName(normalized);
        if (!result.ok) return { error: mapAuthError(result.error) };

        const { data } = await supabase.auth.getSession();
        if (data.session) setSession(data.session);
        return { error: null, session: data.session };
      },
      async signOut() {
        addAppBreadcrumb('auth', 'sign-out requested');
        await supabase.auth.signOut();
        setSession(null);
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
