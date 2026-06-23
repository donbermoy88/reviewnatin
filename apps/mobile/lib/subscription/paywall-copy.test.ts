import { describe, expect, it } from 'vitest';
import {
  EXAM_COUNTDOWN_PLUS_CTA,
  HOW_TO_PAY_STEPS,
  PAYWALL_CTA_PRIMARY,
  PAYWALL_GUEST_BODY,
  PAYWALL_GUEST_TITLE,
  PAYWALL_HEADLINE,
  PAYWALL_PAYMENT_EXPLANATION,
  PREMIUM_LOCK_CTA,
} from './paywall-copy';

const FORBIDDEN = [
  'Pay with GCash',
  'Upload Proof',
  'Open checkout',
  'reviewnatinph.com/checkout',
  'WEB_CHECKOUT',
] as const;

describe('paywall-copy', () => {
  it('uses Play-compliant headline and primary CTA', () => {
    expect(PAYWALL_HEADLINE).toBe('Unlock ReviewNatin Premium');
    expect(PAYWALL_CTA_PRIMARY).toBe('Continue to Secure Payment');
    expect(PREMIUM_LOCK_CTA).toBe('View Premium Plans');
  });

  it('mentions GCash/Maya only inside Google Play checkout context', () => {
    expect(PAYWALL_PAYMENT_EXPLANATION).toContain('Google Play');
    expect(PAYWALL_PAYMENT_EXPLANATION).toMatch(/GCash|Maya/i);
    expect(HOW_TO_PAY_STEPS.join(' ')).toContain('Google Play checkout');
  });

  it('formats exam urgency CTA', () => {
    expect(EXAM_COUNTDOWN_PLUS_CTA.title(14)).toContain('14 araw');
    expect(EXAM_COUNTDOWN_PLUS_CTA.button).toBe('View Premium Plans');
  });

  it('sets guest expectations before requiring an account', () => {
    expect(PAYWALL_GUEST_TITLE).toContain('Free account');
    expect(PAYWALL_GUEST_BODY).toContain('keep practicing as guest');
    expect(PAYWALL_GUEST_BODY).toContain('Google Play');
  });

  it('does not include forbidden external payment strings', () => {
    const corpus = [
      PAYWALL_HEADLINE,
      PAYWALL_CTA_PRIMARY,
      PAYWALL_GUEST_TITLE,
      PAYWALL_GUEST_BODY,
      PREMIUM_LOCK_CTA,
      PAYWALL_PAYMENT_EXPLANATION,
      ...HOW_TO_PAY_STEPS,
      EXAM_COUNTDOWN_PLUS_CTA.button,
    ].join('\n');

    for (const phrase of FORBIDDEN) {
      expect(corpus).not.toContain(phrase);
    }
  });
});
