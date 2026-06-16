import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Brand ink for text sitting on the gold accent — readable in light and dark. */
const INK_ON_ACCENT = '#0E1B3D';

type Props = {
  completedDays?: boolean[];
};

/** Weekly checkmark row only — streak badge lives in PasaPath header.
 *  Rendered on the branded hero, so neutral marks use translucent white. */
export function StreakWeek({
  completedDays = [false, false, false, false, false, false, false],
}: Props) {
  const { colors, spacing, fonts } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.sm }}>
      {DAYS.map((d, i) => (
        <View key={`day-${i}`} style={{ alignItems: 'center', flex: 1, gap: 4 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: 2,
              borderColor: completedDays[i] ? colors.accent : 'rgba(255,255,255,0.45)',
              backgroundColor: completedDays[i] ? colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {completedDays[i] ? (
              <Text style={{ fontSize: 12, color: INK_ON_ACCENT, fontFamily: fonts.bodyBold }}>✓</Text>
            ) : null}
          </View>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: fonts.bodySemiBold }}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  const { colors, spacing, radii, fonts } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.full,
      }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: INK_ON_ACCENT }}>🔥 {streak}</Text>
    </View>
  );
}
