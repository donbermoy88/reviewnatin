/** Cloudflare Turnstile site key — when set, signup requires a captcha token. */
export function getTurnstileSiteKey(): string | null {
  const key = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

export function isTurnstileRequired(): boolean {
  return getTurnstileSiteKey() !== null;
}
