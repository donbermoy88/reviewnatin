import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors as lightColors } from '@reviewnatin/shared';
import { darkColors, type ThemeColors } from '../constants/dark-theme';
import { fetchRemotePreferences, loadLocalPreferences, upsertRemotePreferences, type ExplanationLocale, type UserPreferences } from '../lib/api/preferences';
import { cancelReminders, registerForPushNotifications, scheduleDailyReminder, canUseLocalNotifications } from '../lib/notifications';
import { useAuth } from './auth-provider';

type PreferencesContextValue = {
  prefs: UserPreferences;
  colors: ThemeColors;
  isDark: boolean;
  loading: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setExplanationLocale: (locale: ExplanationLocale) => Promise<void>;
  setExamRemindersEnabled: (enabled: boolean) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const systemScheme = useColorScheme(); // Reactive to system appearance changes
  const [prefs, setPrefs] = useState<UserPreferences>({
    darkMode: systemScheme === 'dark', // Follow system before saved prefs load
    notificationsEnabled: true,
    reminderHour: 19,
    reminderMinute: 0,
    explanationLocale: 'en',
    examRemindersEnabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const local = await loadLocalPreferences();
      if (user) {
        try {
          const remote = await fetchRemotePreferences(user.id);
          if (remote) {
            setPrefs(remote);
            await AsyncStorage.setItem('reviewnatin:prefs', JSON.stringify(remote));
            setLoading(false);
            return;
          }
        } catch {
          /* use local */
        }
      }
      // Only override initial state when saved prefs exist
      if (local) setPrefs(local);
      setLoading(false);
    })();
  }, [user?.id]);

  const persist = useCallback(
    async (next: UserPreferences) => {
      setPrefs(next);
      await AsyncStorage.setItem('reviewnatin:prefs', JSON.stringify(next));
      if (user) {
        try {
          await upsertRemotePreferences(user.id, next);
        } catch {
          /* local only */
        }
      }
    },
    [user]
  );

  const setDarkMode = useCallback(async (enabled: boolean) => {
    await persist({ ...prefs, darkMode: enabled });
  }, [persist, prefs]);

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      const next = { ...prefs, notificationsEnabled: enabled };
      await persist(next);
      if (enabled) {
        await registerForPushNotifications(user?.id);
        await scheduleDailyReminder(next.reminderHour, next.reminderMinute);
      } else {
        await cancelReminders();
      }
    },
    [persist, prefs, user?.id]
  );

  const setExplanationLocale = useCallback(
    async (locale: ExplanationLocale) => {
      await persist({ ...prefs, explanationLocale: locale });
    },
    [persist, prefs]
  );

  const setExamRemindersEnabled = useCallback(
    async (enabled: boolean) => {
      await persist({ ...prefs, examRemindersEnabled: enabled });
    },
    [persist, prefs]
  );

  useEffect(() => {
    if (!prefs.notificationsEnabled || loading || !canUseLocalNotifications()) return;
    registerForPushNotifications(user?.id).then(() => {
      scheduleDailyReminder(prefs.reminderHour, prefs.reminderMinute);
    });
  }, [prefs.notificationsEnabled, prefs.reminderHour, prefs.reminderMinute, user?.id, loading]);

  const isDark = prefs.darkMode;
  const themeColors = (isDark ? darkColors : lightColors) as ThemeColors;

  const value = useMemo(
    () => ({
      prefs,
      colors: themeColors,
      isDark,
      loading,
      setDarkMode,
      setNotificationsEnabled,
      setExplanationLocale,
      setExamRemindersEnabled,
    }),
    [prefs, themeColors, isDark, loading, setDarkMode, setNotificationsEnabled, setExplanationLocale, setExamRemindersEnabled]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}

export function useThemeColors() {
  return usePreferences().colors;
}
