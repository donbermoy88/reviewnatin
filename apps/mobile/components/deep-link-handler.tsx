import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { routeFromUrl } from '../lib/deep-link-routes';

/** Handles reviewnatin:// deep links (Barkada invites, checkout ref, etc.). */
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
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
