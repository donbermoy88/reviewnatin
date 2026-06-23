/** Google Play Billing–compliant paywall copy (Play policy safe). */

export const PAYWALL_HEADLINE = 'Unlock ReviewNatin Premium';

export const PAYWALL_SUBHEADING = 'Study smarter and prepare confidently for your exam.';

export const PAYWALL_BENEFITS = [
  'Unlimited practice quizzes',
  'Full mock exams',
  'AI Tutor explanations',
  'Detailed performance analytics',
  'Weak topic detection',
  'Flashcards and study reminders',
  'Premium question banks',
  'Exam readiness score',
  'No Ads',
] as const;

export const PAYWALL_PAYMENT_EXPLANATION =
  'Payment is processed securely by Google Play. You may use supported payment methods available in your Google Play account, such as GCash, Maya/PayMaya, ShopeePay, debit card, credit card, or other available options.';

export const PAYWALL_CTA_PRIMARY = 'Continue to Secure Payment';

export const PAYWALL_CTA_SECONDARY = 'Maybe later';

export const PAYWALL_POLICY_FOOTER =
  'Payment is processed by Google Play. Subscription renews automatically unless canceled before the next billing cycle. You can manage or cancel your subscription anytime in Google Play.';

export const PAYWALL_GUEST_TITLE = 'Free account needed for Premium';

export const PAYWALL_GUEST_BODY =
  'You can keep practicing as guest. Create a free account only when you want secure Google Play subscription and cloud progress sync.';

export const HOW_TO_PAY_TITLE = 'How to pay with GCash or Maya';

export const HOW_TO_PAY_STEPS = [
  'Tap Continue to Secure Payment.',
  'Choose your ReviewNatin Premium plan.',
  'Google Play checkout will open.',
  'Select or add an available payment method such as GCash, Maya/PayMaya, ShopeePay, debit card, or credit card.',
  'Confirm your payment.',
  'Premium access will unlock automatically after successful payment.',
] as const;

export const STORE_LOAD_ERROR =
  "We couldn't load the secure Google Play payment options right now. Please check your internet connection and try again.";

export const STORE_LOAD_TRY_AGAIN = 'Try Again';

export const PREMIUM_LOCK_TITLE = 'This is a Premium feature.';

export const PREMIUM_LOCK_BODY =
  'Unlock ReviewNatin Premium through secure Google Play payment to access this feature.';

export const PREMIUM_LOCK_CTA = 'View Premium Plans';

export const EXAM_COUNTDOWN_PLUS_CTA = {
  title: (days: number) => ` ${days} araw na lang — i-unlock ang full mocks`,
  subtitle: 'Plus: unlimited practice, offline packs, AI tutor, walang ads.',
  button: 'View Premium Plans',
} as const;

export const PLAN_DISPLAY = {
  monthly: {
    name: 'Monthly Premium',
    subcopy: 'Flexible access for short review.',
  },
  six_months: {
    name: '6-Month Exam Pass',
    subcopy: 'Best for one exam preparation cycle.',
    badge: 'Most Popular' as const,
  },
  yearly: {
    name: 'Annual Premium',
    subcopy: 'Best value for multiple exams.',
    badge: 'Best Value' as const,
  },
} as const;
