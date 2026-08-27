import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/community/avatar';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { IconButton } from '../../../components/icon-button';
import { useAppTheme } from '../../../hooks/use-app-theme';
import { fetchBlockedUsers, toggleCommunityUserBlock, type CommunityBlockedUser } from '../../../lib/api/community';
import { toUserFacingError } from '../../../lib/errors/user-facing';
import { stackScrollPadding } from '../../../lib/layout/content-padding';

export default function CommunitySafetySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fonts, spacing, radii } = useAppTheme();

  const [users, setUsers] = useState<CommunityBlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await fetchBlockedUsers();
      setUsers(list);
    } catch (err) {
      setLoadError(toUserFacingError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onUnblock = (blockedUser: CommunityBlockedUser) => {
    Alert.alert(`Unblock ${blockedUser.displayName}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setUnblockingId(blockedUser.userId);
          try {
            await toggleCommunityUserBlock(blockedUser.userId);
            setUsers((prev) => prev.filter((u) => u.userId !== blockedUser.userId));
          } catch {
            Alert.alert('Could not unblock', 'Please try again.');
          } finally {
            setUnblockingId(null);
          }
        },
      },
    ]);
  };

  const Header = (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton
          variant="plain"
          buttonSize={28}
          size={22}
          icon="chevron-back"
          color={colors.text}
          hitSlop={8}
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, marginLeft: spacing.sm }}>
          Blocked Users
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <ErrorState description={loadError} onRetry={() => { setLoading(true); void load(); }} />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.userId}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={Header}
      contentContainerStyle={stackScrollPadding(insets)}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: spacing.md }}>
          <EmptyState
            icon={<Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />}
            title="You haven't blocked anyone"
            description="Blocked users won't see your posts, and you won't see theirs."
          />
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
            padding: spacing.md,
          }}
        >
          <Avatar url={item.avatarUrl} name={item.displayName} size={40} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
            {item.displayName}
          </Text>
          <Pressable
            onPress={() => onUnblock(item)}
            disabled={unblockingId === item.userId}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Unblock ${item.displayName}`}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary }}>
              {unblockingId === item.userId ? 'Unblocking…' : 'Unblock'}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}
