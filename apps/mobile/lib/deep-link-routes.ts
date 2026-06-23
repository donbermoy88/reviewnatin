import * as Linking from 'expo-linking';

const HTTPS_HOSTS = new Set(['reviewnatinph.com', 'www.reviewnatinph.com']);

function pathFromParsed(parsed: Linking.ParsedURL): string {
  const hostname = parsed.hostname?.toLowerCase();
  if (hostname && HTTPS_HOSTS.has(hostname)) {
    return parsed.path?.replace(/^\//, '') ?? '';
  }
  const path = parsed.path?.replace(/^\//, '') ?? '';
  if (path) return path;
  if (hostname && !HTTPS_HOSTS.has(hostname)) return hostname;
  return '';
}

function hrefWithQueryParams(
  href: string,
  parsed: Linking.ParsedURL,
  keys: string[]
): string {
  const params = new URLSearchParams();
  for (const key of keys) {
    const raw = parsed.queryParams?.[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === 'string' && value.trim()) {
      params.set(key, value.trim());
    }
  }
  const qs = params.toString();
  return qs ? `${href}?${qs}` : href;
}

function queryParam(parsed: Linking.ParsedURL, key: string): string | undefined {
  const raw = parsed.queryParams?.[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Parsed router target for imperative navigation (preserves query params on Android). */
export function routeTargetFromUrl(
  url: string
): { pathname: string; params?: Record<string, string> } | null {
  try {
    const parsed = Linking.parse(url);
    const path = pathFromParsed(parsed);

    if (path === 'verify-email') {
      const email = queryParam(parsed, 'email');
      const displayName = queryParam(parsed, 'displayName');
      if (!email) return { pathname: '/(auth)/verify-email' };
      return {
        pathname: '/(auth)/verify-email',
        params: {
          email: email.toLowerCase(),
          ...(displayName ? { displayName } : {}),
        },
      };
    }

    const href = routeFromUrl(url);
    if (!href) return null;
    const qIndex = href.indexOf('?');
    if (qIndex === -1) return { pathname: href };
    const pathname = href.slice(0, qIndex);
    const params = Object.fromEntries(new URLSearchParams(href.slice(qIndex + 1)).entries());
    return { pathname, params };
  } catch {
    return null;
  }
}

/**
 * Expo Router receives native Android cold-start intents before React hooks can
 * run. Normalize those raw system paths here so `reviewnatin://practice` and
 * friends never hit Expo Router's unmatched route or the root spinner first.
 */
export function routeFromNativeIntentPath(path: string): string {
  const raw = path.trim();
  if (!raw) return '/';
  if (isAuthDeepLink(raw)) return raw;

  const url =
    raw.includes('://') || raw.startsWith('https://') || raw.startsWith('http://')
      ? raw
      : `reviewnatin://${raw.replace(/^\/+/, '').replace(/^--\//, '')}`;

  return routeFromUrl(url) ?? raw;
}

export function isVerifyEmailDeepLink(url: string | null | undefined): boolean {
  return Boolean(url?.includes('verify-email'));
}

/** Extract verify-email params from a deep link URL (cold-start fallback). */
export function verifyEmailParamsFromUrl(url: string): { email: string; displayName?: string } | null {
  try {
    const parsed = Linking.parse(url);
    const path = pathFromParsed(parsed);
    if (path !== 'verify-email' && !url.includes('verify-email')) return null;
    const email = queryParam(parsed, 'email') ?? regexQueryParam(url, 'email');
    if (!email) return null;
    const displayName = queryParam(parsed, 'displayName') ?? regexQueryParam(url, 'displayName');
    return {
      email: email.toLowerCase(),
      ...(displayName ? { displayName } : {}),
    };
  } catch {
    if (!url.includes('verify-email')) return null;
    const email = regexQueryParam(url, 'email');
    if (!email) return null;
    const displayName = regexQueryParam(url, 'displayName');
    return {
      email: email.toLowerCase(),
      ...(displayName ? { displayName } : {}),
    };
  }
}

function regexQueryParam(url: string, key: string): string | undefined {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`, 'i'));
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim() || undefined;
  } catch {
    return match[1].trim() || undefined;
  }
}

/**
 * Auth links (OAuth callback, password recovery, magic links) carry Supabase
 * tokens and are owned by the auth screens — `app/auth/callback.tsx` and
 * `app/(auth)/reset-password.tsx`. The generic navigation handler must NOT
 * touch them, or it races those screens.
 */
export function isAuthDeepLink(url: string): boolean {
  return (
    url.includes('access_token') ||
    url.includes('refresh_token') ||
    url.includes('type=recovery') ||
    url.includes('/auth/callback') ||
    url.includes('reset-password')
  );
}

/** Map reviewnatin:// and https://reviewnatinph.com URLs to Expo Router hrefs. */
export function routeFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const path = pathFromParsed(parsed);

    if (!path || path === 'home' || path === '(tabs)' || path === 'index') {
      return '/(tabs)';
    }

    if (path === 'barkada' || path.startsWith('barkada/')) {
      const code = parsed.queryParams?.code;
      if (typeof code === 'string' && code.trim()) {
        return `/barkada?code=${encodeURIComponent(code.trim())}`;
      }
      return '/barkada';
    }

    if (path === 'subscribe') return '/subscribe';
    if (path === 'login') return '/(auth)/login';
    if (path === 'signup') return '/(auth)/signup';
    if (path === 'verify-email') {
      return hrefWithQueryParams('/(auth)/verify-email', parsed, ['email', 'displayName']);
    }
    if (path === 'checkout') {
      return '/subscribe';
    }
    if (path === 'exam-calendar' || path === 'calendar') return '/exam-calendar';
    if (path === 'tutor' || path === 'ai-tutor') return '/tutor';
    if (path === 'changelog' || path === 'updates') return '/changelog';
    if (path === 'study' || path === 'aral') return '/(tabs)/study';
    if (path === 'practice' || path === 'quiz') return '/practice/quiz';
    if (path === 'pasapath' || path === 'pasapath/week') return '/pasapath/week';
    if (path === 'mistakes') return '/mistakes';
    if (path === 'flashcards') return '/flashcards';

    return null;
  } catch {
    return null;
  }
}

/** Map Expo push notification data payload to a router href. */
export function routeFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  const url = data.url;
  if (typeof url === 'string' && url.trim()) {
    return routeFromUrl(url);
  }

  const screen = data.screen;
  if (typeof screen === 'string') {
    const map: Record<string, string> = {
      home: '/(tabs)',
      study: '/(tabs)/study',
      profile: '/(tabs)/progress',
      leaderboard: '/(tabs)/leaderboard',
      subscribe: '/subscribe',
      tutor: '/tutor',
      pasapath: '/pasapath/week',
      exam_calendar: '/exam-calendar',
      calendar: '/exam-calendar',
      mistakes: '/mistakes',
      flashcards: '/flashcards',
    };
    return map[screen] ?? null;
  }

  return null;
}
