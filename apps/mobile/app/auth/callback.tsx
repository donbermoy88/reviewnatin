import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createSessionFromUrl, isRecoveryUrl } from '../../lib/auth/deep-link-auth';
import { getAppEntryHref } from '../../lib/onboarding-nav';
import { supabase } from '../../lib/supabase';

/** Handles reviewnatin:// deep links (OAuth callback, password recovery, etc.) */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const initial = await Linking.getInitialURL();
        if (initial) {
          const type = await createSessionFromUrl(initial);
          if (!mounted) return;
          if (type === 'recovery' || isRecoveryUrl(initial)) {
            router.replace('/(auth)/reset-password');
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        const href = await getAppEntryHref(data.session?.user.id);
        if (mounted) router.replace(href);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Auth link failed');
          router.replace('/(auth)/login');
        }
      }
    })();

    const sub = Linking.addEventListener('url', async ({ url }) => {
      try {
        const type = await createSessionFromUrl(url);
        if (type === 'recovery' || isRecoveryUrl(url)) {
          router.replace('/(auth)/reset-password');
          return;
        }
        const { data } = await supabase.auth.getSession();
        router.replace(await getAppEntryHref(data.session?.user.id));
      } catch {
        router.replace('/(auth)/login');
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
      {error ? null : null}
    </View>
  );
}
