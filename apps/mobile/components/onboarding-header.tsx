import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  step: number;
  total: number;
  onBack?: () => void;
  variant?: 'light' | 'dark';
};

export function OnboardingHeader({ step, total, onBack, variant = 'light' }: Props) {
  const { colors, radii, spacing, type } = useAppTheme();
  const pct = ((step + 1) / total) * 100;
  const dark = variant === 'dark';

  return (
    <View style={{ paddingBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {onBack ? (
          <Pressable onPress={onBack} style={{ width: 28, height: 28, justifyContent: 'center' }} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={dark ? '#fff' : colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 28, height: 28 }} />
        )}
        <View
          style={{
            flex: 1,
            height: 6,
            backgroundColor: dark ? 'rgba(255,255,255,0.22)' : colors.border,
            borderRadius: radii.full,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: dark ? colors.accent : colors.primary,
              borderRadius: radii.full,
            }}
          />
        </View>
        <Text
          style={[
            type.caption,
            {
              color: dark ? 'rgba(255,255,255,0.75)' : colors.textLight,
              fontFamily: type.label.fontFamily,
              minWidth: 36,
              textAlign: 'right',
            },
          ]}
        >
          {step + 1} / {total}
        </Text>
      </View>
    </View>
  );
}
