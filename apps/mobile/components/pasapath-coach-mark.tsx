import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  visible: boolean;
  taskTitle?: string;
  onDismiss: () => void;
  onStart: () => void;
};

export function PasaPathCoachMark({ visible, taskTitle, onDismiss, onStart }: Props) {
  const { colors, fonts, spacing, radii, shadows } = useAppTheme();

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(220)} style={StyleSheet.absoluteFill}>
      <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss tip" />
      <Animated.View
        entering={FadeInDown.springify().damping(16)}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.xl,
            padding: spacing.lg,
            ...shadows.card,
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="map-outline" size={20} color={colors.primary} />
        </View>
        <Text style={[styles.title, { fontFamily: fonts.bodyBold, color: colors.text }]}>
          Simulan ang PasaPath task ngayon
        </Text>
        <Text style={[styles.sub, { fontFamily: fonts.bodyMedium, color: colors.textMuted }]}>
          {taskTitle
            ? `Unang hakbang: "${taskTitle}". Tap below para sa daily study path mo.`
            : 'Tapusin ang daily PasaPath tasks para tumaas ang readiness at streak mo.'}
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary, borderRadius: radii.lg }]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="Start PasaPath task"
          >
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={[styles.primaryText, { fontFamily: fonts.bodyBold }]}>Simulan</Text>
          </Pressable>
          <Pressable onPress={onDismiss} hitSlop={8} accessibilityRole="button" accessibilityLabel="Got it">
            <Text style={[styles.skip, { fontFamily: fonts.bodySemiBold, color: colors.textMuted }]}>Got it</Text>
          </Pressable>
        </View>
        <View style={[styles.arrow, { borderTopColor: colors.surface }]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8,36,92,0.42)',
  },
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 120,
    borderWidth: 1,
    borderColor: 'rgba(11,95,255,0.12)',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  actions: {
    gap: 10,
    alignItems: 'stretch',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
  },
  skip: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 6,
  },
  arrow: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export const PASAPATH_COACH_MARK_KEY = '@reviewnatin/coach_pasapath_v1';
