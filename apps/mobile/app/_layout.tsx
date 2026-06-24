import '../lib/monitoring/sentry-init';
import '../lib/text-scaling';

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
import { EmailVerificationGate } from '../providers/email-verification-gate';
import { AnalyticsProvider } from '../providers/analytics-provider';
import { PreferencesProvider, usePreferences } from '../providers/preferences-provider';
import { useAppTheme, fonts } from '../hooks/use-app-theme';
import { DeepLinkHandler } from '../components/deep-link-handler';
import { PostHogIdentity } from '../components/analytics/posthog-identity';
import { PostHogScreenTracker } from '../components/analytics/posthog-screen-tracker';
import { NotificationTapHandler } from '../components/notification-tap-handler';
import { OfflineBanner } from '../components/offline-banner';
import { OfflineQueueFlusher } from '../components/offline-queue-flusher';
import { initializeMobileAds } from '../lib/ads/init';
import { runAfterInteractions } from '../lib/performance/defer-after-interaction';

function ThemedStack() {
  const { isDark } = usePreferences();
  const { colors } = useAppTheme();

  useEffect(() => {
    runAfterInteractions(() => {
      void initializeMobileAds();
    });
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
        <Stack.Screen name="onboarding/index" options={{ title: 'Get started', headerShown: false }} />
        <Stack.Screen name="diagnostic/intro" options={{ headerShown: false }} />
        <Stack.Screen name="bookmarks/index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/verify-email" options={{ headerShown: false }} />
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
        <Stack.Screen name="focus/index" options={{ headerShown: false }} />
        <Stack.Screen name="notes/index" options={{ headerShown: false }} />
        <Stack.Screen name="streak-freeze/index" options={{ headerShown: false }} />
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
        <AnalyticsProvider>
          <DeepLinkHandler />
          <PostHogScreenTracker />
          <EntitlementsProvider>
            <IapFeedbackProvider>
              <IapProvider>
                <PostHogIdentity />
                <OnboardingGate>
                  <EmailVerificationGate>
                  <NotificationTapHandler />
                  <OfflineQueueFlusher />
                  <ThemedStack />
                  <OfflineBanner />
                  </EmailVerificationGate>
                </OnboardingGate>
              </IapProvider>
            </IapFeedbackProvider>
          </EntitlementsProvider>
        </AnalyticsProvider>
        </PreferencesProvider>
      </AuthProvider>
    </FontProvider>
    </ErrorBoundary>
  );
}
