import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { canUseExpoNotifications } from '../lib/device-capabilities';
import { routeFromNotificationData } from '../lib/deep-link-routes';

/** Routes the user when they tap a push or local notification. */
export function NotificationTapHandler() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web' || !canUseExpoNotifications()) return;

    let sub: { remove: () => void } | undefined;

    void (async () => {
      const { getLastNotificationResponseAsync, addNotificationResponseReceivedListener, DEFAULT_ACTION_IDENTIFIER } =
        await import('expo-notifications/build/NotificationsEmitter');

      const navigate = (data: Record<string, unknown> | undefined) => {
        const href = routeFromNotificationData(data);
        if (href) {
          router.push(href as never);
        }
      };

      const last = await getLastNotificationResponseAsync();
      if (last?.actionIdentifier === DEFAULT_ACTION_IDENTIFIER) {
        navigate(last.notification.request.content.data as Record<string, unknown>);
      }

      sub = addNotificationResponseReceivedListener((response) => {
        navigate(response.notification.request.content.data as Record<string, unknown>);
      });
    })();

    return () => {
      sub?.remove();
    };
  }, [router]);

  return null;
}
