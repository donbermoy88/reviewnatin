import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { getReadinessBand, type ReadinessSnapshot } from '../lib/api/readiness';
import { AppSheet } from './app-sheet';
import { Pill } from './pill';

type Props = {
  visible: boolean;
  onClose: () => void;
  readiness: ReadinessSnapshot | null;
};

function FactorRow({ label, value, pct }: { label: string; value: number | null | undefined; pct?: boolean }) {
  const theme = useAppTheme();
  const { colors, fonts, spacing } = theme;

  if (value == null) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>
        {pct ? `${Math.round(value)}%` : String(value)}
      </Text>
    </View>
  );
}

export function ReadinessBreakdownSheet({ visible, onClose, readiness }: Props) {
  const theme = useAppTheme();
  const { colors, fonts, spacing } = theme;

  if (!readiness) return null;

  const score = Math.round(readiness.score);
  const band = getReadinessBand(score);
  const f = readiness.factors;

  return (
    <AppSheet
      visible={visible}
      title={`${score}% handa na`}
      subtitle={band.copy}
      onClose={onClose}
      actions={[{ label: 'OK', onPress: onClose, variant: 'outline' }]}
    >
      <Pill color={colors.primary}>{band.label}</Pill>
      <View style={{ marginTop: spacing.sm }}>
        <FactorRow label="Diagnostic score" value={f.diagnostic_score} pct />
        <FactorRow label="Mock exam average" value={f.mock_score_avg} pct />
        <FactorRow label="Topic coverage" value={f.topic_coverage_pct} pct />
        <FactorRow label="Mistake mastery" value={f.mistake_mastery_pct} pct />
        {f.practice_accuracy_14d != null ? (
          <FactorRow label="Practice accuracy (14d)" value={f.practice_accuracy_14d} pct />
        ) : null}
      </View>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight, lineHeight: 18 }}>
        Batay sa diagnostic, mocks, topic coverage, at mistake bank mastery. Mag-practice araw-araw para tumaas ang score.
      </Text>
    </AppSheet>
  );
}
