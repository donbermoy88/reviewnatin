import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, touchTarget, type } from '../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  subtitle?: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
};

export function SelectOption({ label, subtitle, icon, selected, onPress }: Props) {
  return (
    <Pressable
      style={[styles.option, selected && styles.optionActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
        <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textMuted} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? colors.primary : colors.border}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: touchTarget.min,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#fff',
  },
  content: { flex: 1 },
  label: { ...type.label, fontSize: 15 },
  labelActive: { color: colors.primary },
  subtitle: { ...type.caption, marginTop: 2 },
});
