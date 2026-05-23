import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mag-login</Text>
      <Text style={styles.body}>Email + Google Sign-In — connect Supabase Auth in Week 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { marginTop: spacing.sm, color: colors.textMuted },
});
