/** Typed product analytics events — PostHog + Sentry breadcrumbs. */

import { addAppBreadcrumb } from '../monitoring/events';
import { capturePostHog } from './posthog';

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
  | 'daily_active'
  | 'dashboard_charts_viewed'
  | 'analytics_screen_opened'
  | 'ui_tap';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: AnalyticsEventName, properties?: AnalyticsProperties): void {
  if (__DEV__) {
    console.info('[analytics]', name, properties ?? {});
  }
  addAppBreadcrumb('analytics', name, properties);
  capturePostHog(name, properties);
}

/** Haptic / CTA microinteractions for funnel diagnostics in PostHog. */
export function trackMicrointeraction(
  target: string,
  properties?: AnalyticsProperties
): void {
  trackEvent('ui_tap', { target, ...properties });
}
