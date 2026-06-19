import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLocalPreferences, saveLocalPreferences } from './preferences';

const storage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

vi.mock('../supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

describe('local preferences', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('keeps reminders opt-in when saved preferences are partial', async () => {
    storage.set('reviewnatin:prefs', JSON.stringify({ darkMode: true }));

    await expect(loadLocalPreferences()).resolves.toMatchObject({
      darkMode: true,
      notificationsEnabled: false,
      examRemindersEnabled: false,
      reminderHour: 19,
      reminderMinute: 0,
    });
  });

  it('persists reminder choices explicitly', async () => {
    await saveLocalPreferences({
      darkMode: false,
      notificationsEnabled: true,
      reminderHour: 19,
      reminderMinute: 0,
      explanationLocale: 'en',
      examRemindersEnabled: true,
    });

    await expect(loadLocalPreferences()).resolves.toMatchObject({
      notificationsEnabled: true,
      examRemindersEnabled: true,
    });
  });
});
