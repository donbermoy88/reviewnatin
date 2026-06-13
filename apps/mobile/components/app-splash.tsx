import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors, gradients, spacing } from '../constants/theme';
import { APP_TAGLINE } from '../constants/brand';
import { LogoMark } from './logo-mark';

/** Branded splash — shown on native launch handoff and while fonts load. */
export function AppSplash() {
  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.challenge]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobGold]} />
      <View style={[styles.blob, styles.blobBlue]} />

      <View style={styles.content}>
        <LogoMark size={120} />
        <Text style={styles.title} accessibilityRole="header">
          Review<Text style={styles.titleAccent}>Natin</Text>
          <Text style={styles.titlePh}> PH</Text>
        </Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>CSE · LET · PNLE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.22,
  },
  blobGold: {
    width: 220,
    height: 220,
    backgroundColor: colors.accent,
    top: -40,
    right: -60,
  },
  blobBlue: {
    width: 180,
    height: 180,
    backgroundColor: '#1A72FF',
    bottom: 120,
    left: -50,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginTop: -48,
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0,
    textAlign: 'center',
  },
  titleAccent: {
    color: colors.accent,
  },
  titlePh: {
    color: colors.accent,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  pill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
