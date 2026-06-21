import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { getPublicEnv } from './public-env';
import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage';

const url = getPublicEnv('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl');
const anonKey = getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey');

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT'));

const authStorage = {
  async getItem(key: string): Promise<string | null> {
    const secureValue = await getSecureItem(key);
    if (secureValue != null) return secureValue;

    // Backward-compatible migration for sessions previously persisted by
    // Supabase directly in plaintext AsyncStorage.
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue != null) {
      await setSecureItem(key, legacyValue);
      await AsyncStorage.removeItem(key).catch(() => {});
    }
    return legacyValue;
  },
  async setItem(key: string, value: string): Promise<void> {
    await setSecureItem(key, value);
    await AsyncStorage.removeItem(key).catch(() => {});
  },
  async removeItem(key: string): Promise<void> {
    await deleteSecureItem(key);
    await AsyncStorage.removeItem(key).catch(() => {});
  },
};

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
