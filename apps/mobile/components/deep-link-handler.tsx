import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { isAuthDeepLink, routeTargetFromUrl, verifyEmailParamsFromUrl } from '../lib/deep-link-routes';
import { consumeInitialUrl } from '../lib/initial-url';

/** Handles reviewnatin:// navigation deep links (Barkada invites, checkout ref, etc.). */
export function DeepLinkHandler() {
  const router = useRouter();
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url || url === lastHandled.current) return;
      lastHandled.current = url;

      const verifyParams = verifyEmailParamsFromUrl(url);
      if (verifyParams) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: verifyParams,
        } as never);
        return;
      }

      if (isAuthDeepLink(url)) return;
      const target = routeTargetFromUrl(url);
      if (!target) return;
      if (target.params) {
        router.replace({ pathname: target.pathname, params: target.params } as never);
      } else {
        router.replace(target.pathname as never);
      }
    };

    void consumeInitialUrl().then(handle);

    const sub = Linking.addEventListener('url', (event) => {
      handle(event.url);
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
