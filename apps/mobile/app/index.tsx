import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { useOnboardingGate } from '../providers/onboarding-gate';
import { useAuth } from '../providers/auth-provider';
import { routeTargetFromUrl } from '../lib/deep-link-routes';
import { consumeInitialUrl } from '../lib/initial-url';

/** Entry redirect — onboarding routing is enforced by OnboardingGate only. */
export default function Index() {
  const { colors } = useAppTheme();
  const { ready, complete } = useOnboardingGate();
  const { user } = useAuth();
  const [initialLinkChecked, setInitialLinkChecked] = useState(false);
  const [initialTarget, setInitialTarget] = useState<ReturnType<typeof routeTargetFromUrl>>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const url = await consumeInitialUrl();
      const target = url ? routeTargetFromUrl(url) : null;
      if (cancelled) return;

      if (target?.pathname && target.pathname !== '/(tabs)') {
        setInitialTarget(target);
      }
      setInitialLinkChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !initialLinkChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (initialTarget) {
    const href = initialTarget.params
      ? { pathname: initialTarget.pathname, params: initialTarget.params }
      : initialTarget.pathname;
    return <Redirect href={href as never} />;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (!complete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
