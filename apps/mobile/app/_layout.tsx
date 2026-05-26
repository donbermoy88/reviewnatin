import '../lib/monitoring/sentry-init';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ErrorBoundary } from '../components/error-boundary';
import { AuthProvider } from '../providers/auth-provider';
import { EntitlementsProvider } from '../providers/entitlements-provider';
import { IapFeedbackProvider } from '../providers/iap-feedback-provider';
import { IapProvider } from '../providers/iap-provider';
import { FontProvider } from '../providers/font-provider';
import { OnboardingGate } from '../providers/onboarding-gate';
import { PreferencesProvider, usePreferences } from '../providers/preferences-provider';
import { useAppTheme, fonts } from '../hooks/use-app-theme';
import { DeepLinkHandler } from '../components/deep-link-handler';
import { NotificationTapHandler } from '../components/notification-tap-handler';
import { initializeMobileAds } from '../lib/ads/init';

function ThemedStack() {
  const { isDark } = usePreferences();
  const { colors } = useAppTheme();

  useEffect(() => {
    void initializeMobileAds();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontFamily: fonts.bodyBold, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ title: 'Simulan', headerShown: false }} />
        <Stack.Screen name="diagnostic/intro" options={{ headerShown: false }} />
        <Stack.Screen name="bookmarks/index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="study/[subjectSlug]" options={{ headerShown: false }} />
        <Stack.Screen name="study/lesson/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="barkada/index" options={{ headerShown: false }} />
        <Stack.Screen name="exam-calendar/index" options={{ headerShown: false }} />
        <Stack.Screen name="flashcards/index" options={{ headerShown: false }} />
        <Stack.Screen name="mistakes/index" options={{ headerShown: false }} />
        <Stack.Screen name="subscribe/index" options={{ headerShown: false }} />
        <Stack.Screen name="legal/index" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        <Stack.Screen name="analytics/index" options={{ headerShown: false }} />
        <Stack.Screen name="tutor/index" options={{ headerShown: false }} />
        <Stack.Screen name="changelog/index" options={{ headerShown: false }} />
        <Stack.Screen name="offline-lessons/index" options={{ headerShown: false }} />
        <Stack.Screen name="pasapath/week" options={{ headerShown: false }} />
        <Stack.Screen name="practice/quiz" options={{ headerShown: false }} />
        <Stack.Screen name="practice/result" options={{ headerShown: false, headerBackVisible: false }} />
        <Stack.Screen name="mock-review/[sessionId]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <FontProvider>
      <AuthProvider>
        <PreferencesProvider>
          <EntitlementsProvider>
            <IapFeedbackProvider>
              <IapProvider>
                <OnboardingGate>
                  <DeepLinkHandler />
                  <NotificationTapHandler />
                  <ThemedStack />
                </OnboardingGate>
              </IapProvider>
            </IapFeedbackProvider>
          </EntitlementsProvider>
        </PreferencesProvider>
      </AuthProvider>
    </FontProvider>
    </ErrorBoundary>
  );
}
