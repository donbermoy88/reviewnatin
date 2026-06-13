import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/use-app-theme';
import { PrimaryButton } from './primary-button';

type Action = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: ReactNode;
  actions?: Action[];
};

/** Themed bottom sheet — replaces system Alert for in-app surfaces */
export function AppSheet({ visible, title, subtitle, onClose, children, actions }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title}`}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            borderBottomWidth: 0,
            gap: spacing.md,
          }}
        >
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center' }} />
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.text, lineHeight: 26 }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
              {subtitle}
            </Text>
          ) : null}
          {children}
          {actions?.map((action) => (
            <PrimaryButton
              key={action.label}
              label={action.label}
              variant={action.destructive ? 'outline' : action.variant ?? 'primary'}
              onPress={action.onPress}
              style={action.destructive ? { borderColor: colors.error } : undefined}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}
