import * as Linking from 'expo-linking';

const HTTPS_HOSTS = new Set(['reviewnatinph.com', 'www.reviewnatinph.com']);

function pathFromParsed(parsed: Linking.ParsedURL): string {
  const hostname = parsed.hostname?.toLowerCase();
  if (hostname && HTTPS_HOSTS.has(hostname)) {
    return parsed.path?.replace(/^\//, '') ?? '';
  }
  return parsed.path?.replace(/^\//, '') ?? '';
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
    if (path === 'checkout') {
      const ref = parsed.queryParams?.ref;
      if (typeof ref === 'string' && ref.trim()) {
        return `/subscribe?ref=${encodeURIComponent(ref.trim())}`;
      }
      return '/subscribe';
    }
    if (path === 'exam-calendar' || path === 'calendar') return '/exam-calendar';
    if (path === 'tutor' || path === 'ai-tutor') return '/tutor';
    if (path === 'changelog' || path === 'updates') return '/changelog';
    if (path === 'study' || path === 'aral') return '/(tabs)/study';
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
