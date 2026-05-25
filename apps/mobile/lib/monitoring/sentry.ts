/** Sentry crash reporting — init before TestFlight / production builds. */
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry(): void {
  if (!dsn || __DEV__ || isRunningInExpoGo()) return;

  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
    environment: process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production',
  });
}

export { Sentry };
