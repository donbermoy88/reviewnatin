import { describe, expect, it } from 'vitest';
import { DAILY_LIMIT, GUEST_NEXT_STEPS, PREMIUM_HEADLINE } from './product-copy';

describe('product-copy', () => {
  it('includes daily limit in Tagalog body', () => {
    expect(DAILY_LIMIT.body()).toContain('20/20');
  });

  it('defines guest next steps', () => {
    expect(GUEST_NEXT_STEPS.ctaPractice).toBeTruthy();
  });

  it('includes PRC disclaimer on paywall', () => {
    expect(PREMIUM_HEADLINE.trust).toContain('PRC');
  });
});
