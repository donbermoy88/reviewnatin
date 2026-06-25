import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

type Props = { examSlug: string; examName: string };

/** Dismissal is scoped per exam slug so switching exams shows the welcome card again. */
export function CommunityWelcomeCard({ examSlug, examName }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(`community_welcome_seen:${examSlug}`).then((seen) => {
      if (active) setDismissed(!!seen);
    });
    return () => {
      active = false;
    };
  }, [examSlug]);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    void AsyncStorage.setItem(`community_welcome_seen:${examSlug}`, '1').catch(() => {});
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: colors.primaryMuted,
        borderRadius: radii.lg,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="people-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
          Welcome to the {examName} Community!
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          Ask questions, share insights, and help each other succeed.
        </Text>
      </View>
      <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
