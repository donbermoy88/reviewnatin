import { describe, expect, it } from 'vitest';
import {
  DAILY_LIMIT,
  FREE_VERIFY_EMAIL,
  GUEST_NEXT_STEPS,
  GUEST_PROGRESS_NUDGE,
  PREMIUM_HEADLINE,
  SETTINGS_HINT,
  SETTINGS_SUPPORT,
} from './product-copy';

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

  it('sets free-user email verification expectations', () => {
    expect(FREE_VERIFY_EMAIL.subtitle).toContain('CSE');
    expect(FREE_VERIFY_EMAIL.subtitle).toContain('Walang bayad');
    expect(FREE_VERIFY_EMAIL.checklist).toContain('Enter the 6-digit code');
  });

  it('includes PRC disclaimer on paywall', () => {
    expect(PREMIUM_HEADLINE.trust).toContain('PRC');
  });

  it('keeps G4 support and feedback copy obvious', () => {
    expect(SETTINGS_HINT).toContain('Nalito');
    expect(SETTINGS_SUPPORT.ctaReport).toBe('Report a problem');
    expect(SETTINGS_SUPPORT.subtitle).toContain('cohort');
  });
});
