import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  title?: string;
  subtitle?: string;
  hero?: ReactNode;
  children: ReactNode;
};

/** Auth stack screens: gradient hero + themed form area (supports dark mode) */
export function AuthShell({ title, subtitle, hero, children }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing, radii } = theme;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={[...gradients.hero]}
          style={{
            paddingTop: insets.top + spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl,
            borderBottomLeftRadius: radii.xl * 2,
            borderBottomRightRadius: radii.xl * 2,
            alignItems: hero ? 'center' : undefined,
          }}
        >
          {hero}
          {title ? (
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                color: '#fff',
                textAlign: hero ? 'center' : undefined,
              }}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 14,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 8,
                lineHeight: 20,
                textAlign: hero ? 'center' : undefined,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function authFieldStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, fonts, spacing, radii } = theme;
  return StyleSheet.create({
    field: { marginBottom: spacing.md },
    fieldLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, marginBottom: 6 },
    input: {
      fontSize: 16,
      fontFamily: fonts.body,
      color: colors.text,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      minHeight: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    error: { fontFamily: fonts.body, fontSize: 14, color: colors.error, marginBottom: spacing.md },
    info: { fontFamily: fonts.body, fontSize: 14, color: colors.primary, marginBottom: spacing.md },
    backLink: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary, textAlign: 'center' },
  });
}
