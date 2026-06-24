/**
 * Phase 4 product funnel — event names and grep patterns for beta:phase4:verify.
 * Data loads from Supabase; PostHog captures behavior (see docs/analytics-posthog.md).
 */
export const ANALYTICS_FUNNEL_EVENTS = [
  { event: 'registration_started', files: ['app/(auth)/signup.tsx'] },
  { event: 'otp_sent', files: ['app/(auth)/signup.tsx', 'app/(auth)/verify-email.tsx'] },
  { event: 'otp_verified', files: ['app/(auth)/verify-email.tsx'] },
  { event: 'onboarding_completed', files: ['app/onboarding/index.tsx'] },
  { event: 'practice_started', files: ['app/practice/quiz.tsx', 'lib/quiz/use-quiz-questions.ts'] },
  { event: 'practice_completed', files: ['lib/quiz/use-quiz-submission.ts'] },
  { event: 'mock_exam_started', files: ['app/practice/quiz.tsx', 'lib/quiz/use-quiz-questions.ts'] },
  { event: 'mock_exam_completed', files: ['lib/quiz/use-quiz-submission.ts'] },
  { event: 'flashcard_session', files: ['app/flashcards/index.tsx'] },
  { event: 'ai_tutor_message', files: ['app/tutor/index.tsx'] },
  { event: 'subscription_viewed', files: ['app/subscribe/index.tsx'] },
  { event: 'checkout_started', files: ['app/subscribe/index.tsx'] },
  { event: 'subscription_active', files: ['providers/iap-provider.tsx'] },
  { event: 'daily_active', files: ['providers/analytics-provider.tsx'] },
  { event: 'dashboard_charts_viewed', files: ['app/(tabs)/index.tsx'] },
  { event: 'analytics_screen_opened', files: ['app/analytics/index.tsx'] },
] as const;

export type FunnelEventName = (typeof ANALYTICS_FUNNEL_EVENTS)[number]['event'];
