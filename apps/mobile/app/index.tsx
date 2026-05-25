import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';
import { useOnboardingGate } from '../providers/onboarding-gate';

/** Entry redirect — onboarding routing is enforced by OnboardingGate only. */
export default function Index() {
  const { ready, complete } = useOnboardingGate();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!complete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
