import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';

const DURATION_KEY = 'reviewnatin:focus:last-minutes';
const PRESETS = [15, 25, 50] as const;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Focus mode — a distraction-free study timer (Pomodoro-style). Entirely local:
 * no auth, no network. Counts down the selected duration, with start/pause/reset
 * and a completion state. Persists the last-used duration so it is remembered.
 */
export default function FocusTimerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing, radii } = theme;

  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore the last-used duration.
  useEffect(() => {
    void AsyncStorage.getItem(DURATION_KEY).then((raw) => {
      const saved = Number(raw);
      if (Number.isFinite(saved) && saved > 0) {
        setMinutes(saved);
        setRemaining(saved * 60);
      }
    });
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const finish = useCallback(() => {
    clearTimer();
    setRunning(false);
    setDone(true);
    setCompletedCount((c) => c + 1);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearTimer]);

  const start = useCallback(() => {
    if (running || intervalRef.current || remaining <= 0) return;
    setDone(false);
    setRunning(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [running, remaining, finish]);

  const pause = useCallback(() => {
    clearTimer();
    setRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setDone(false);
    setRemaining(minutes * 60);
  }, [clearTimer, minutes]);

  const selectPreset = useCallback(
    (m: number) => {
      clearTimer();
      setRunning(false);
      setDone(false);
      setMinutes(m);
      setRemaining(m * 60);
      void AsyncStorage.setItem(DURATION_KEY, String(m));
    },
    [clearTimer]
  );

  const total = minutes * 60;
  const progress = total > 0 ? 1 - remaining / total : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[...gradients.hero]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close focus timer">
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' }}>Focus mode</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.sm }}>
            {done ? 'Tapos na ang session 🎉' : running ? 'Focus lang — kaya mo ’yan' : 'Pumili ng tagal at magsimula'}
          </Text>

          <Text
            accessibilityLabel={`${formatClock(remaining)} remaining`}
            style={{ fontFamily: fonts.display, fontSize: 84, color: '#fff', letterSpacing: -2, fontVariant: ['tabular-nums'] }}
          >
            {formatClock(remaining)}
          </Text>

          {/* Progress bar */}
          <View style={{ width: '80%', height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: spacing.md }}>
            <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 999 }} />
          </View>

          {completedCount > 0 ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: spacing.md }}>
              {completedCount} session{completedCount === 1 ? '' : 's'} na tapos ngayon
            </Text>
          ) : null}

          {/* Presets */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
            {PRESETS.map((m) => {
              const active = minutes === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => selectPreset(m)}
                  disabled={running}
                  accessibilityRole="button"
                  accessibilityLabel={`${m} minute focus`}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.14)',
                    borderWidth: 1,
                    borderColor: active ? '#fff' : 'rgba(255,255,255,0.2)',
                    opacity: running ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: active ? colors.primary : '#fff' }}>{m}m</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Controls */}
        <View style={{ gap: spacing.sm }}>
          {done ? (
            <PrimaryButton label="Magsimula ng panibago" variant="white" size="lg" onPress={reset} />
          ) : running ? (
            <PrimaryButton label="I-pause" variant="white" size="lg" icon="pause" onPress={pause} />
          ) : (
            <PrimaryButton
              label={remaining < total ? 'Ituloy' : 'Magsimulang mag-focus'}
              variant="white"
              size="lg"
              icon="play"
              onPress={start}
            />
          )}
          {!done && remaining < total ? (
            <Pressable onPress={reset} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: spacing.sm }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>I-reset</Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}
