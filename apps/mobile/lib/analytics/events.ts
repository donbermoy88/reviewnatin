/** Typed product analytics events (console + Sentry breadcrumb in dev/beta). */

import { addAppBreadcrumb } from '../monitoring/events';

export type AnalyticsEventName =
  | 'registration_started'
  | 'otp_sent'
  | 'otp_verified'
  | 'onboarding_completed'
  | 'practice_started'
  | 'practice_completed'
  | 'mock_exam_started'
  | 'mock_exam_completed'
  | 'flashcard_session'
  | 'ai_tutor_message'
  | 'subscription_viewed'
  | 'checkout_started'
  | 'subscription_active'
  | 'daily_active';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: AnalyticsEventName, properties?: AnalyticsProperties): void {
  if (__DEV__) {
    console.info('[analytics]', name, properties ?? {});
  }
  addAppBreadcrumb('analytics', name, properties);
  // Firebase/PostHog SDK can be wired here when added to package.json.
}
