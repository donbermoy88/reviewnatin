/**
 * Global offline banner. Sits below the status bar on every screen.
 * Only renders when the network probe says we are offline AND the
 * probe has actually run once (avoids a false flash on cold start).
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/use-app-theme';
import { useNetworkStatus } from '../hooks/use-network-status';

export function OfflineBanner() {
  const { isOnline, hasProbed } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts } = theme;

  if (!hasProbed || isOnline) return null;

  return (
    <View
      style={{
        pointerEvents: 'box-none',
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: colors.flame,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
      }}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Some features may be limited."
    >
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text
        style={{
          fontFamily: fonts.bodyBold,
          fontSize: 12,
          color: '#fff',
          letterSpacing: 0.2,
        }}
      >
        Offline — using saved content
      </Text>
    </View>
  );
}
