/**
 * Streak Milestone Celebration Modal
 * Shows a full-screen celebration when a user hits a streak milestone
 * (7, 14, 30, 60, 100 days).
 * Matches the Figma handoff design.
 */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo } from 'react';
import { Animated, Modal, Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/use-app-theme';

const MILESTONES = [7, 14, 30, 60, 100];

export function isStreakMilestone(days: number): boolean {
  return MILESTONES.includes(days);
}

/** Generate bonus XP for a milestone */
function milestoneXp(days: number): number {
  if (days >= 100) return 2000;
  if (days >= 60) return 1200;
  if (days >= 30) return 750;
  if (days >= 14) return 500;
  return 300; // 7 days
}

/** Confetti particle */
type Particle = { x: number; y: number; size: number; color: string; rot: number; isCircle: boolean };

function generateConfetti(colors: string[]): Particle[] {
  return Array.from({ length: 30 }, (_, i) => ({
    x: (i * 31.3) % 100,
    y: ((i * 23.7) % 60) + 5,
    size: 4 + (i % 3) * 3,
    color: colors[i % colors.length],
    rot: (i * 137.5) % 360,
    isCircle: i % 2 === 0,
  }));
}

type Props = {
  visible: boolean;
  streakDays: number;
  onClose: () => void;
};

export function StreakMilestoneModal({ visible, streakDays, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, fonts } = theme;

  const xp = milestoneXp(streakDays);

  const particles = useMemo(
    () => generateConfetti([colors.accent, '#fff', colors.primaryMuted, colors.flame, '#4ADE80']),
    [colors.accent, colors.flame, colors.primaryMuted]
  );

  // Fade-in animation — Animated.Value is a long-lived mutable object;
  // useMemo gives a stable identity without tripping the react-hooks/refs rule.
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.85), []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
    }
  }, [fadeAnim, scaleAnim, visible]);

  // Pulse animation for the flame — Animated.Value via useMemo (not useRef).
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, visible]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `🔥 ${streakDays}-day study streak on ReviewNatin PH! Consistent practice is the key to passing the Civil Service Exam. #ReviewNatinPH #CSEReviewer`,
      });
    } catch { /* user cancelled */ }
  }, [streakDays]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(8,36,92,0.97)' }}>
        {/* Confetti particles */}
        {particles.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? p.size / 2 : 2,
              transform: [{ rotate: `${p.rot}deg` }],
              opacity: 0.8,
            }}
          />
        ))}

        {/* Radial glow from center */}
        <View style={{
          position: 'absolute', top: '15%', left: '50%',
          width: 300, height: 300,
          marginLeft: -150, marginTop: -150,
          borderRadius: 150,
          backgroundColor: 'rgba(11,95,255,0.25)',
        }} />

        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          {/* Close button */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{
              position: 'absolute', top: insets.top + 16, right: 20, zIndex: 10,
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Flame + number */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 8 }}>
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 180, height: 180 }}>
                {/* Glow ring */}
                <View style={{
                  position: 'absolute', width: 180, height: 180, borderRadius: 90,
                  backgroundColor: 'rgba(255,122,61,0.3)',
                }} />
                {/* Flame SVG-like shape using View */}
                <View style={{
                  width: 110, height: 140,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* Outer flame */}
                  <View style={{
                    position: 'absolute', bottom: 0, width: 90, height: 130,
                    borderRadius: 45, borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
                    backgroundColor: colors.flame,
                    transform: [{ scaleX: 0.85 }],
                  }} />
                  {/* Mid flame */}
                  <View style={{
                    position: 'absolute', bottom: 10, width: 70, height: 100,
                    borderRadius: 35, borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
                    backgroundColor: colors.accent,
                    opacity: 0.9,
                  }} />
                  {/* Inner flame */}
                  <View style={{
                    position: 'absolute', bottom: 20, width: 45, height: 65,
                    borderRadius: 25, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                    backgroundColor: '#FFFDE7',
                    opacity: 0.7,
                  }} />
                  {/* Streak number */}
                  <Text style={{
                    position: 'absolute', bottom: 28,
                    fontFamily: fonts.displayBold, fontSize: streakDays >= 100 ? 36 : 44,
                    color: colors.primaryDark, letterSpacing: -2,
                    textShadowColor: 'rgba(255,255,255,0.4)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                  }}>
                    {streakDays}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Pill badge */}
            <View style={{
              backgroundColor: colors.accent, borderRadius: 999,
              paddingHorizontal: spacing.md, paddingVertical: 5, marginBottom: 12,
            }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primaryDark, letterSpacing: 1 }}>
                🎉 MILESTONE UNLOCKED
              </Text>
            </View>

            {/* Headline */}
            <Text style={{
              fontFamily: fonts.displayBold, fontSize: 36, color: '#fff',
              letterSpacing: -1, lineHeight: 40, textAlign: 'center',
              marginBottom: spacing.sm,
            }}>
              {streakDays}-day streak!
            </Text>

            {/* Body */}
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 16, color: 'rgba(255,255,255,0.8)',
              textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.xl,
              marginBottom: spacing.xl,
            }}>
              <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold }}>Galing mo talaga! </Text>
              {streakDays} days in a row — consistency is your superpower. 💪
            </Text>

            {/* Reward card — glassmorphism */}
            <View style={{
              marginHorizontal: spacing.lg, marginBottom: spacing.xl,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 18, padding: spacing.md,
              flexDirection: 'row', alignItems: 'center', gap: spacing.md,
              width: '87%',
            }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: colors.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="flash" size={24} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Reward unlocked
                </Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff', marginTop: 2 }}>
                  +{xp.toLocaleString()} bonus XP
                </Text>
              </View>
              <Text style={{ fontSize: 24 }}>🏆</Text>
            </View>

            {/* CTAs */}
            <View style={{ width: '87%', gap: spacing.sm }}>
              <Pressable
                onPress={handleShare}
                style={{
                  height: 56, borderRadius: 16,
                  backgroundColor: colors.accent,
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  shadowColor: colors.accent, shadowOpacity: 0.4,
                  shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primaryDark, letterSpacing: -0.3 }}>
                  Share my streak
                </Text>
                <Ionicons name="share-outline" size={18} color={colors.primaryDark} />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={{
                  height: 50, borderRadius: 14,
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' }}>
                  Tuloy ang review →
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={{ height: insets.bottom + 16 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}
