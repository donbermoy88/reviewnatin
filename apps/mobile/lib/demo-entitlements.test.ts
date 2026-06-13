import { describe, expect, it } from 'vitest';
import { demoEntitlementFailureMessage } from './demo-entitlements';

describe('demoEntitlementFailureMessage', () => {
  it('maps disabled database setting to an actionable QA setup message', () => {
    expect(demoEntitlementFailureMessage(new Error('Demo entitlements are disabled on this environment'))).toContain(
      'npm run db:enable-demo-iap'
    );
  });

  it('maps QA allowlist failures to an allowlist instruction', () => {
    expect(demoEntitlementFailureMessage(new Error('Demo entitlements are restricted to QA accounts'))).toContain(
      'QA_PLUS_EMAIL=<this-email>'
    );
  });

  it('preserves unexpected errors', () => {
    expect(demoEntitlementFailureMessage(new Error('network failed'))).toBe('network failed');
  });
});
