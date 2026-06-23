import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { useOnboardingGate } from '../providers/onboarding-gate';
import { useAuth } from '../providers/auth-provider';

/** Entry redirect — onboarding routing is enforced by OnboardingGate only. */
export default function Index() {
  const { colors } = useAppTheme();
  const { ready, complete } = useOnboardingGate();
  const { user } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (!complete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
