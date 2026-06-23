import { useRouter, useSegments } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from './auth-provider';
import { colors } from '../constants/theme';
import { isOnboardingComplete } from '../lib/onboarding-nav';

type OnboardingGateContextValue = {
  ready: boolean;
  complete: boolean;
  refresh: () => Promise<boolean>;
};

const OnboardingGateContext = createContext<OnboardingGateContextValue | null>(null);

export function useOnboardingGate() {
  const ctx = useContext(OnboardingGateContext);
  if (!ctx) throw new Error('useOnboardingGate must be used within OnboardingGate');
  return ctx;
}

function isAllowedWithoutOnboarding(segments: string[]): boolean {
  const root = segments[0];
  if (!root || root === 'index') return true;
  if (root === 'onboarding' || root === '(auth)' || root === 'auth' || root === 'subscribe') return true;
  return false;
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);

  // `ready` means "resolved at least once" — we deliberately do NOT reset it to
  // false on re-resolves (e.g. when the user id changes), otherwise the whole
  // app tree unmounts behind a full-screen spinner on every auth transition.
  const refresh = useCallback(async () => {
    const done = user ? true : await isOnboardingComplete();
    setComplete(done);
    setReady(true);
    return done;
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!ready || complete) return;
    if (isAllowedWithoutOnboarding(segments as string[])) return;
    router.replace('/onboarding');
  }, [ready, complete, segments, router]);

  const value = useMemo(
    () => ({ ready, complete, refresh }),
    [ready, complete, refresh]
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <OnboardingGateContext.Provider value={value}>{children}</OnboardingGateContext.Provider>;
}
