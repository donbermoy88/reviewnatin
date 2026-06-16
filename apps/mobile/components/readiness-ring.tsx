import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = { percent: number; label?: string; hint?: string; size?: number };

export function ReadinessRing({ percent, label = 'Exam-ready', hint, size = 72 }: Props) {
  const { colors, fonts, spacing, type } = useAppTheme();
  const stroke = Math.max(4, Math.round(size * 0.08));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${Math.round(percent)}% ${label}${hint ? `. ${hint}` : ''}`}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: colors.ringFill,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary, fontSize: Math.round(size * 0.24) }}>
          {Math.round(percent)}%
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.title, { fontSize: 17 }]}>{label}</Text>
        {hint ? <Text style={[type.caption, { marginTop: 4, color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
    </View>
  );
}
