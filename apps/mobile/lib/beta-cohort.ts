/** Resolve beta tester cohort for analytics and feedback prefill. */
export type BetaCohort = 'guest' | 'free' | 'premium';

export function resolveBetaCohort(
  userId: string | null | undefined,
  isPremiumActive: boolean
): BetaCohort {
  if (!userId) return 'guest';
  if (isPremiumActive) return 'premium';
  return 'free';
}
