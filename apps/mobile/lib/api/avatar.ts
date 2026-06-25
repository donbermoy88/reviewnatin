import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { base64ToUint8Array } from '../format/base64';
import { isSupabaseConfigured, supabase } from '../supabase';

export type AvatarUploadResult = { ok: true; url: string } | { ok: false; error: string };

// `fetch(uri).then(r => r.blob())` is unreliable on Android for the
// `content://` URIs the system photo picker returns — it can silently fail
// or yield an empty blob, especially with the modern Android Photo Picker.
// Reading the file as base64 via expo-file-system and decoding manually
// works for both `content://` and `file://` URIs.

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
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId);
    if (dbError) return { ok: false, error: dbError.message };

    return { ok: true, url: publicUrl };
  } catch (err) {
    console.warn('[avatar] upload failed', err);
    return { ok: false, error: 'Could not upload your photo. Check your connection and try again.' };
  }
}
