import { describe, expect, it } from 'vitest';
import {
  DAILY_LIMIT,
  FREE_DAILY_STATUS,
  FREE_OAUTH_SIGNUP,
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

  it('clarifies OAuth signup for LET Secondary reviewers', () => {
    expect(FREE_OAUTH_SIGNUP.subtitle).toContain('skips the email code');
    expect(FREE_OAUTH_SIGNUP.subtitle).toContain('LET Secondary');
    expect(FREE_OAUTH_SIGNUP.subtitle).toContain('major');
  });

  it('sets free daily limit expectations for casual learners', () => {
    expect(FREE_DAILY_STATUS.title(8)).toContain('8/20');
    expect(FREE_DAILY_STATUS.subtitle(8)).toContain('ad-supported');
    expect(FREE_DAILY_STATUS.subtitle(0)).toContain('unlimited practice');
    expect(FREE_DAILY_STATUS.accessibilityLabel(8)).toContain('Free review includes ads');
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
