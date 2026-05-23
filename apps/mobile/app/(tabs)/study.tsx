import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export default function StudyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study</Text>
      <Text style={styles.body}>Subject list → topics → practice quiz. Week 2 build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 22 },
});
