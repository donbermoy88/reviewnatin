import { describe, expect, it } from 'vitest';
import { DAILY_LIMIT, GUEST_NEXT_STEPS, GUEST_PROGRESS_NUDGE, PREMIUM_HEADLINE } from './product-copy';

describe('product-copy', () => {
  it('includes daily limit in Tagalog body', () => {
    expect(DAILY_LIMIT.body()).toContain('20/20');
  });

  it('defines guest next steps', () => {
    expect(GUEST_NEXT_STEPS.ctaPractice).toBeTruthy();
    expect(GUEST_NEXT_STEPS.trustPill).toContain('no email');
    expect(GUEST_NEXT_STEPS.subtitle).toContain('Local stats');
  });

  it('reassures guests that quiz progress is preserved locally', () => {
    expect(GUEST_PROGRESS_NUDGE.subtitle).toContain('guest score');
    expect(GUEST_PROGRESS_NUDGE.ctaContinue).toContain('guest');
  });

  it('includes PRC disclaimer on paywall', () => {
    expect(PREMIUM_HEADLINE.trust).toContain('PRC');
  });
});
