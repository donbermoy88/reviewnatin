import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/use-app-theme';
import { stackScrollPadding } from '../lib/layout/content-padding';

type Props = {
  title: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  gradient?: 'hero' | 'challenge';
  children: ReactNode;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
};

/** Standard stack screen: gradient header + back chevron + scroll body */
export function StackShell({
  title,
  subtitle,
  headerExtra,
  gradient = 'hero',
  children,
  scrollProps,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing } = theme;
  const gradientColors = gradient === 'challenge' ? gradients.challenge : gradients.hero;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={stackScrollPadding(insets, spacing.xl)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        <LinearGradient
          colors={[...gradientColors]}
          style={{
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          {headerExtra}
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff', lineHeight: 28 }}>{title}</Text>
          {subtitle ? (
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 20,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>{children}</View>
      </ScrollView>
    </View>
  );
}
