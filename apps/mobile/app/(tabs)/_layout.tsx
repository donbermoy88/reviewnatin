import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createTabLayoutStyles } from '../../lib/themed-styles';

import { TAB_BAR_BASE } from '../../lib/layout/content-padding';

function TabIcon({
  name,
  focused,
  colors,
  styles,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
  styles: ReturnType<typeof createTabLayoutStyles>;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {focused ? <View style={styles.activeBar} /> : null}
      <Ionicons name={name} size={21} color={focused ? colors.primary : colors.textLight} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  const styles = useMemo(() => createTabLayoutStyles(theme), [theme]);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
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
          paddingBottom: bottomInset,
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} colors={colors} styles={styles} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Review',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'layers' : 'layers-outline'} focused={focused} colors={colors} styles={styles} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} colors={colors} styles={styles} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} colors={colors} styles={styles} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
