import { mapAuthError } from '../auth/errors';

export const LOAD_ERROR_DEFAULT =
  'Hindi ma-load ang content ngayon. Check ang koneksyon mo at subukan ulit.';

type ErrorContext = 'auth' | 'checkout' | 'load' | 'network';

function extractMessage(error: unknown): string {
  if (typeof error === 'string') return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message.trim();
  }
  return '';
}

function looksLikeAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('invalid login') ||
    m.includes('invalid credentials') ||
    m.includes('invalid otp') ||
    m.includes('invalid token') ||
    m.includes('email not confirmed') ||
    m.includes('already registered') ||
    m.includes('password') ||
    m.includes('oauth') ||
    m.includes('provider')
  );
}

function looksLikeNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network') ||
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('internet') ||
    m.includes('offline') ||
    m.includes('connection')
  );
}

function isAlreadyFriendly(message: string): boolean {
  return /^(hindi|wala|paki|mag-|naka-|sobrang|subukan|naipadala|na-send|na-verify)/i.test(message);
}

/** Map raw API/auth errors to Taglish-friendly copy for UI surfaces. */
export function toUserFacingError(error: unknown, context: ErrorContext = 'load'): string {
  const message = extractMessage(error);
  if (!message) {
    if (context === 'auth') return 'Hindi makapag-sign in ngayon. Subukan ulit.';
    if (context === 'checkout') return 'Hindi na-proceed ang checkout. Subukan ulit.';
    return LOAD_ERROR_DEFAULT;
  }

  if (isAlreadyFriendly(message)) return message;

  if (context === 'auth' || looksLikeAuthError(message)) {
    return mapAuthError(message);
  }

  const lower = message.toLowerCase();

  if (looksLikeNetworkError(lower) || context === 'network') {
    return 'Walang koneksyon sa server. Check ang internet mo at subukan ulit.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('too many attempts')) {
    return 'Sobrang daming try. Maghintay muna ng ilang minuto bago subukan ulit.';
  }

  if (context === 'checkout' || lower.includes('checkout')) {
    return 'Hindi na-proceed ang checkout. Subukan ulit o mag-email sa beta@reviewnatinph.com.';
  }

  if (lower.includes('not found') || lower.includes('does not exist')) {
    return 'Hindi namin mahanap ang hinihingi mo. Subukan ulit.';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Masyadong matagal ang sagot ng server. Subukan ulit.';
  }

  if (
    lower.includes('permission') ||
    lower.includes('unauthorized') ||
    lower.includes('jwt') ||
    lower.includes('row-level') ||
    lower.includes('pgrst') ||
    message.length > 120
  ) {
    return context === 'load' ? LOAD_ERROR_DEFAULT : 'May nangyaring error. Subukan ulit.';
  }

  if (message.length <= 80) return message;
  return LOAD_ERROR_DEFAULT;
}
