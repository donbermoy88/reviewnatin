const DEMO_DISABLED_MESSAGE =
  'Demo Plus is disabled for this Supabase database. Run npm run db:enable-demo-iap for local/dev QA, then try Activate (demo) again.';

export function demoEntitlementFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'Demo activation failed.');

  if (message.includes('Demo entitlements are disabled')) {
    return DEMO_DISABLED_MESSAGE;
  }

  if (message.includes('restricted to QA accounts')) {
    return 'This account is not allowlisted for demo Plus. Run QA_PLUS_EMAIL=<this-email> npm run db:enable-demo-iap, then try again.';
  }

  return message;
}
