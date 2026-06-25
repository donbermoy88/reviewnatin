import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export const COMMUNITY_GUIDELINES_VERSION = 'v1.0';

const CACHE_KEY = 'community_guidelines_accepted_version';

/** Supabase is the source of truth; AsyncStorage is a read-through cache only,
 *  written after a successful Supabase accept, to skip the network round-trip
 *  every time the composer opens. */
export async function hasAcceptedCommunityGuidelines(userId: string): Promise<boolean> {
  const cached = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
  if (cached === COMMUNITY_GUIDELINES_VERSION) return true;

  const { data, error } = await supabase
    .from('users')
    .select('community_guidelines_version')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return false;

  const accepted = data.community_guidelines_version === COMMUNITY_GUIDELINES_VERSION;
  if (accepted) {
    await AsyncStorage.setItem(CACHE_KEY, COMMUNITY_GUIDELINES_VERSION).catch(() => {});
  }
  return accepted;
}

export async function acceptCommunityGuidelines(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      community_guidelines_version: COMMUNITY_GUIDELINES_VERSION,
      community_guidelines_accepted_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
  await AsyncStorage.setItem(CACHE_KEY, COMMUNITY_GUIDELINES_VERSION).catch(() => {});
}
