import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  subtitle?: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
};

export function SelectOption({ label, subtitle, icon, selected, onPress }: Props) {
  const { colors, radii, spacing, touchTarget, type } = useAppTheme();

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryMuted : colors.surface,
        marginBottom: spacing.sm,
        minHeight: touchTarget.min,
        gap: spacing.md,
      }}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
      accessibilityState={{ selected }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          backgroundColor: selected ? colors.surface : colors.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.label, { fontSize: 15 }, selected && { color: colors.primary }]}>{label}</Text>
        {subtitle ? <Text style={[type.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? colors.primary : colors.border}
      />
    </Pressable>
  );
}
