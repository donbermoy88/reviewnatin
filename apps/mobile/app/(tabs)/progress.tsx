import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.body}>Weak topics chart and mock history. Week 2–3 build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 22 },
});
