import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useUserProfile } from '../../hooks/use-user-profile';
import { pickAndUploadAvatar } from '../../lib/api/avatar';
import { fallbackDisplayName } from '../../lib/api/profile';
import { createSettingsStyles } from '../../lib/themed-styles';
import { useAuth } from '../../providers/auth-provider';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, fonts, radii } = theme;
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const { user, updateDisplayName, isConfigured } = useAuth();
  const { displayName, avatarUrl, refresh, loading: profileLoading } = useUserProfile('Guest');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const didSync = useRef(false);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (!profileLoading && !didSync.current) {
      setName(displayName);
      didSync.current = true;
    }
  }, [user, displayName, profileLoading, router]);

  const initials = (name.trim() || displayName).slice(0, 2).toUpperCase();

  const changeAvatar = async () => {
    if (!user || uploadingAvatar) return;
    setError(null);
    setUploadingAvatar(true);
    const result = await pickAndUploadAvatar(user.id);
    setUploadingAvatar(false);

    if (!result.ok) {
      if (result.error !== 'cancelled') setError(result.error);
      return;
    }
    await refresh();
  };

  const save = async () => {
    setError(null);
    if (!isConfigured) {
      setError('Supabase is not connected yet.');
      return;
    }

    setSaving(true);
    const result = await updateDisplayName(name);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    await refresh();
    router.back();
  };

  if (!user || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit profile</Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.userCard, { justifyContent: 'center' }]}>
            <Pressable
              onPress={changeAvatar}
              disabled={uploadingAvatar}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              style={{ position: 'relative' }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>{initials}</Text>
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={12} color="#fff" />
                )}
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{name.trim() || displayName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          <Text style={styles.sectionLbl}>Display name</Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.xl,
              borderWidth: 1.5,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              minHeight: 52,
              justifyContent: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <TextInput
              style={{ fontSize: 16, fontFamily: fonts.body, color: colors.text }}
              placeholder={fallbackDisplayName(user)}
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
              editable={!saving}
            />
          </View>
          <Text style={[styles.entitlementNote, { marginBottom: spacing.lg }]}>
            Visible on your Profile, Home screen, and Leaderboard.
          </Text>

          {error ? (
            <Text style={{ fontFamily: fonts.body, color: colors.error, marginBottom: spacing.md }}>
              {error}
            </Text>
          ) : null}

          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <PrimaryButton label="Save changes" size="lg" onPress={save} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
