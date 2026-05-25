import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { updateUserDisplayName } from '../lib/api/profile';
import { mapAuthError } from '../lib/auth/errors';
import { sendPasswordResetEmail, signInWithApple, signInWithGoogle, updatePassword } from '../lib/auth/oauth';
import { normalizeDisplayName, normalizeEmail, validateDisplayName } from '../lib/auth/validation';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type AuthResult = {
  error: string | null;
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
  error: 'Hindi pa naka-connect ang Supabase. Check ang apps/mobile/.env file.',
};

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

        if (error) return { error: mapAuthError(error.message) };

        if (data.session) {
          setSession(data.session);
          return { error: null, session: data.session };
        }

        return { error: 'Hindi makapag-login. Subukan ulit.' };
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

        if (error) return { error: mapAuthError(error.message) };

        if (data.session) {
          setSession(data.session);
          return { error: null, session: data.session };
        }

        // Auto-confirm projects sometimes omit session on signUp — sign in immediately
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });

        if (signInData.session) {
          setSession(signInData.session);
          return { error: null, session: signInData.session };
        }

        if (data.user && !data.session) {
          return { error: null, needsEmailConfirmation: true };
        }

        return {
          error: mapAuthError(signInError?.message ?? 'Hindi makapag-sign up. Subukan ulit.'),
        };
      },
      async signInGoogle() {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;
        const { error } = await signInWithGoogle();
        if (error) return { error: mapAuthError(error) };
        const { data } = await supabase.auth.getSession();
        if (data.session) setSession(data.session);
        return { error: null, session: data.session };
      },
      async signInApple() {
        if (!isSupabaseConfigured) return NOT_CONFIGURED;
        const { error } = await signInWithApple();
        if (error) return { error: mapAuthError(error) };
        const { data } = await supabase.auth.getSession();
        if (data.session) setSession(data.session);
        return { error: null, session: data.session };
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
