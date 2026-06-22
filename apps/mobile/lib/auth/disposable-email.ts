/** Common disposable / temporary email domains blocked at signup. */
const BLOCKED_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  '10minutemail.com',
  'sharklasers.com',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
  'temp-mail.org',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;
  return BLOCKED_DOMAINS.has(domain);
}

export function validateEmailNotDisposable(email: string): string | null {
  if (isDisposableEmail(email)) {
    return 'Temporary email addresses are not allowed. Use a real email address.';
  }
  return null;
}
