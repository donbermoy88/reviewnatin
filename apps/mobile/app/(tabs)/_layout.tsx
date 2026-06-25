import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createTabLayoutStyles } from '../../lib/themed-styles';

import { TAB_BAR_BASE } from '../../lib/layout/content-padding';

function TabIcon({
  name,
  focused,
  colors,
  styles,
  iconSize,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
  styles: ReturnType<typeof createTabLayoutStyles>;
  iconSize: number;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {focused ? <View style={styles.activeBar} /> : null}
      <Ionicons name={name} size={iconSize} color={focused ? colors.primary : colors.textLight} />
    </View>
  );
}

const TABS: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'practice', label: 'Practice', icon: 'flash-outline', activeIcon: 'flash' },
  { name: 'mock-exam', label: 'Mock Exam', icon: 'timer-outline', activeIcon: 'timer' },
  { name: 'community', label: 'Community', icon: 'people-outline', activeIcon: 'people' },
  { name: 'progress', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  const styles = useMemo(() => createTabLayoutStyles(theme), [theme]);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);
  // Responsive icon size: 20px on narrow phones (<360w), 22px on large (≥412w), else 21px.
  const iconSize = width < 360 ? 20 : width >= 412 ? 22 : 21;
  const tabBarHeight = TAB_BAR_BASE + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 8,
          // Reserve the device safe-area inset so the bar (and its labels) sit above
          // the system gesture / 3-button nav bar on every device.
          paddingBottom: bottomInset + 4,
          ...Platform.select({
            android: { elevation: 12 },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: theme.isDark ? 0.35 : 0.08,
              shadowRadius: 12,
            },
          }),
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.bodyBold, fontSize: 17 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: `${tab.label} tab`,
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? tab.activeIcon : tab.icon}
                focused={focused}
                colors={colors}
                styles={styles}
                iconSize={iconSize}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
      {/* Demoted from primary tabs in favor of Practice/Mock Exam/Community — still
          fully working routes, reachable via the "Browse all subjects / Notes" and
          "Leaderboard" entry points on Home/Profile, and via existing router.push
          callers (deep-link-routes.ts, etc.) which are unaffected by this change. */}
      <Tabs.Screen name="study" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="leaderboard" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
