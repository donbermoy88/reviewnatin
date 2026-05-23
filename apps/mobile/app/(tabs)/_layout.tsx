import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';

const TAB_BAR_BASE = 52;

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? colors.primary : colors.textMuted}
      style={styles.tabIcon}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const tabBarHeight = TAB_BAR_BASE + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIconWrap,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
          paddingHorizontal: spacingHorizontal,
          ...Platform.select({
            android: { elevation: 12 },
            ios: {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
          }),
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.bodyBold, fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Study',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const spacingHorizontal = 4;

const styles = StyleSheet.create({
  tabItem: {
    paddingTop: 2,
    minHeight: 44,
  },
  tabIconWrap: {
    marginBottom: 0,
  },
  tabIcon: {
    marginTop: 2,
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginTop: 2,
    marginBottom: Platform.OS === 'android' ? 0 : 2,
  },
});
