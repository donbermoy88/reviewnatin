import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { SparkleStar } from '../sparkle-star';

type Props = { examName: string; insetsTop: number };

/** Matches the gradient hero header used by Home/Practice/Mock Exam/Profile tabs.
 *  Bell is intentionally inert — there's no notifications backend to drive a badge or feed. */
export function CommunityHeader({ examName, insetsTop }: Props) {
  const { fonts, spacing, radii, gradients } = useAppTheme();

  return (
    <LinearGradient
      colors={[...gradients.hero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: insetsTop + spacing.md,
        paddingBottom: spacing.xl,
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', right: -30, top: 20 }}>
        <SparkleStar size={80} opacity={0.1} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: '#fff', letterSpacing: -0.4 }}>
          Community
        </Text>
        <Pressable
          style={{
            width: 40,
            height: 40,
            borderRadius: radii.md,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
        <Ionicons name="shield-checkmark" size={14} color="#fff" />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
          {examName} reviewers
        </Text>
      </View>
    </LinearGradient>
  );
}
