import { describe, expect, it } from 'vitest';
import { EXAM_COUNTDOWN_PLUS_CTA, GUEST_WEB_CHECKOUT_HINT, WEB_CHECKOUT_STICKY_HINT } from './checkout-copy';

describe('checkout-copy', () => {
  it('includes trial clarity', () => {
    expect(WEB_CHECKOUT_STICKY_HINT('₱159')).toContain('GCash/Maya');
  });

  it('formats exam urgency CTA', () => {
    expect(EXAM_COUNTDOWN_PLUS_CTA.title(14)).toContain('14 araw');
  });

  it('explains guest web checkout on APK beta', () => {
    expect(GUEST_WEB_CHECKOUT_HINT).toMatch(/GCash|Maya/i);
  });
});
