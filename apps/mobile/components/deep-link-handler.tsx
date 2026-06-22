import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { isAuthDeepLink, routeTargetFromUrl } from '../lib/deep-link-routes';

/** Handles reviewnatin:// navigation deep links (Barkada invites, checkout ref, etc.). */
export function DeepLinkHandler() {
  const router = useRouter();
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url || url === lastHandled.current) return;
      if (isAuthDeepLink(url)) return;
      lastHandled.current = url;
      const target = routeTargetFromUrl(url);
      if (!target) return;
      if (target.params) {
        router.replace({ pathname: target.pathname, params: target.params } as never);
      } else {
        router.replace(target.pathname as never);
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
