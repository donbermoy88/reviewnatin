import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { isAuthDeepLink, routeFromUrl } from '../lib/deep-link-routes';

/** Handles reviewnatin:// navigation deep links (Barkada invites, checkout ref, etc.). */
export function DeepLinkHandler() {
  const router = useRouter();
  // Guard so the same URL isn't routed twice (getInitialURL + the url event can
  // both deliver it), and so auth-token links are left to the auth screens.
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url || url === lastHandled.current) return;
      if (isAuthDeepLink(url)) return;
      lastHandled.current = url;
      const href = routeFromUrl(url);
      if (href) {
        router.push(href as never);
      }
    };

    Linking.getInitialURL().then(handle);

    const sub = Linking.addEventListener('url', (event) => {
      handle(event.url);
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
