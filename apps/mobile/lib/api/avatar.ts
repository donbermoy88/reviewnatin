import * as ImagePicker from 'expo-image-picker';
import { isSupabaseConfigured, supabase } from '../supabase';

export type AvatarUploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function pickAndUploadAvatar(userId: string): Promise<AvatarUploadResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not connected.' };

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, error: 'Photo library permission denied.' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return { ok: false, error: 'cancelled' };

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  try {
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { contentType, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId);
    if (dbError) return { ok: false, error: dbError.message };

    return { ok: true, url: publicUrl };
  } catch {
    return { ok: false, error: 'Could not upload your photo. Check your connection and try again.' };
  }
}
