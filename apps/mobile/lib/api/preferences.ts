import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../supabase';
import { StorageKeys } from '../storage-keys';

export type ExplanationLocale = 'en' | 'fil';

export type UserPreferences = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  explanationLocale: ExplanationLocale;
  examRemindersEnabled: boolean;
};

/** Exported so the preferences provider writes through the same key. */
export const LOCAL_KEY = StorageKeys.prefs;

const DEFAULTS: UserPreferences = {
  darkMode: false,
  notificationsEnabled: true,
  reminderHour: 19,
  reminderMinute: 0,
  explanationLocale: 'en',
  examRemindersEnabled: true,
};

export async function loadLocalPreferences(): Promise<UserPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return null; // No saved prefs — caller should use system defaults
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export async function saveLocalPreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
}

export async function fetchRemotePreferences(userId: string): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('dark_mode, notifications_enabled, reminder_hour, reminder_minute, explanation_locale, exam_reminders_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    darkMode: data.dark_mode,
    notificationsEnabled: data.notifications_enabled,
    reminderHour: data.reminder_hour,
    reminderMinute: data.reminder_minute,
    explanationLocale: data.explanation_locale === 'fil' ? 'fil' : 'en',
    examRemindersEnabled: data.exam_reminders_enabled ?? true,
  };
}

export async function upsertRemotePreferences(userId: string, prefs: UserPreferences): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    dark_mode: prefs.darkMode,
    notifications_enabled: prefs.notificationsEnabled,
    reminder_hour: prefs.reminderHour,
    reminder_minute: prefs.reminderMinute,
    explanation_locale: prefs.explanationLocale,
    exam_reminders_enabled: prefs.examRemindersEnabled,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function savePushToken(userId: string, token: string, platform: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' }
  );

  if (error) throw error;
}
