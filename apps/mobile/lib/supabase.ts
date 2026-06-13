import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT'));

const supabaseAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const secureValue = await getSecureItem(key);
    if (secureValue != null) return secureValue;

    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue != null) {
      await setSecureItem(key, legacyValue);
      await AsyncStorage.removeItem(key);
    }
    return legacyValue;
  },
  async setItem(key: string, value: string): Promise<void> {
    await setSecureItem(key, value);
    await AsyncStorage.removeItem(key);
  },
  async removeItem(key: string): Promise<void> {
    await deleteSecureItem(key);
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
