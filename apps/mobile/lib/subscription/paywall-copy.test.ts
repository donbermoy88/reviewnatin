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
  PREMIUM_ACTIVE,
  PREMIUM_EXAM_PREP,
  PREMIUM_PURCHASE,
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

  it('guides power users through Google Play purchase and restore', () => {
    expect(PREMIUM_PURCHASE.purchasingLabel).toContain('Google Play');
    expect(PREMIUM_PURCHASE.successTitle).toContain('Plus is active');
    expect(PREMIUM_PURCHASE.restoreHint).toContain('Restore purchases');
  });

  it('confirms Plus entitlements for paying subscribers', () => {
    expect(PREMIUM_ACTIVE.subtitle).toContain('No ads');
    expect(PREMIUM_ACTIVE.subtitle).toContain('unlimited daily practice');
    expect(PREMIUM_ACTIVE.syncHint).toContain('sync entitlements');
  });

  it('guides premium users nearing exam to offline pack and AI tutor', () => {
    expect(PREMIUM_EXAM_PREP.title(14)).toContain('14 araw');
    expect(PREMIUM_EXAM_PREP.subtitle).toContain('offline pack');
    expect(PREMIUM_EXAM_PREP.subtitle).toContain('AI tutor');
    expect(PREMIUM_EXAM_PREP.offlineDownload).toContain('offline pack');
    expect(PREMIUM_EXAM_PREP.tutorCta).toContain('AI tutor');
  });

  it('does not include forbidden external payment strings', () => {
    const corpus = [
      PAYWALL_HEADLINE,
      PAYWALL_CTA_PRIMARY,
      PAYWALL_GUEST_TITLE,
      PAYWALL_GUEST_BODY,
      PREMIUM_LOCK_CTA,
      PAYWALL_PAYMENT_EXPLANATION,
      PREMIUM_PURCHASE.successSubtitle,
      PREMIUM_PURCHASE.restoreHint,
      PREMIUM_ACTIVE.subtitle,
      PREMIUM_EXAM_PREP.subtitle,
      ...HOW_TO_PAY_STEPS,
      EXAM_COUNTDOWN_PLUS_CTA.button,
    ].join('\n');

    for (const phrase of FORBIDDEN) {
      expect(corpus).not.toContain(phrase);
    }
  });
});
