import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { StackShell } from '../../components/stack-shell';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createLeaderboardStyles } from '../../lib/themed-styles';
import { sendAiTutorMessage, type AiTutorMessage } from '../../lib/api/ai-tutor';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';

const STARTER: AiTutorMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your AI tutor. Ask me about weak topics, your study plan, or mock exam prep. What would you like to talk about?",
};

export default function AiTutorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing, fonts } = theme;
  const styles = useMemo(() => createLeaderboardStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const { prefs } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [messages, setMessages] = useState<AiTutorMessage[]>([STARTER]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    resolveOnboardingGoal(user?.id).then((goal) => {
      setExamSlug(goal?.examSlug ?? DEFAULT_EXAM_SLUG);
    });
  }, [user?.id]);

  const locale = prefs.explanationLocale ?? 'en';

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    if (!isPremium()) {
      Alert.alert('ReviewNatin Plus required', 'AI tutor chat is available for premium subscribers only.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'View plans', onPress: () => router.push('/subscribe') },
      ]);
      return;
    }

    const nextMessages: AiTutorMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const result = await sendAiTutorMessage(nextMessages, { examSlug, locale });
      if (!result.ok) {
        if (result.error === 'premium_required') {
          Alert.alert('ReviewNatin Plus required', 'Upgrade to chat with the AI tutor.');
          return;
        }
        if (result.error === 'daily_limit_reached') {
          setRemaining(0);
          Alert.alert('Daily limit reached', "You've used today's AI tutor messages. It resets tomorrow — keep practicing in the meantime!");
          return;
        }
        if (result.error === 'cooldown') {
          Alert.alert(
            'Slow down 🙂',
            result.retryAfter
              ? `Please wait ${result.retryAfter}s before sending another message.`
              : 'Please wait a few seconds before sending another message.'
          );
          return;
        }
        if (result.error === 'input_too_long') {
          Alert.alert('Message too long', 'Please shorten your question and try again.');
          return;
        }
        // Never surface raw provider/server errors to the user.
        Alert.alert('Could not send', 'Something went wrong. Please try again in a moment.');
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      if (typeof result.remaining === 'number') setRemaining(result.remaining);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, sending, user, isPremium, messages, examSlug, locale, router]);

  if (!user) {
    return (
      <StackShell title="AI Tutor" subtitle="Magtanong kay Kuya AI — step-by-step na tulong">
        <EmptyState
          icon={<Ionicons name="chatbubbles-outline" size={32} color={colors.primary} />}
          title="Mag-log in muna"
          description="Kailangan ng premium account para sa AI tutor chat."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <LinearGradient
        colors={[...gradients.hero]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.sm }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Tutor</Text>
        <Text style={styles.headerSub}>
          {isPremium()
            ? remaining != null
              ? `Premium · ${remaining} message${remaining === 1 ? '' : 's'} left today`
              : 'Premium · Ask anything about your exam prep'
            : 'Premium feature — upgrade to unlock'}
        </Text>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View
            key={`${i}-${m.content.slice(0, 12)}`}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              backgroundColor: m.role === 'user' ? colors.primary : colors.surface,
              borderRadius: 16,
              padding: spacing.md,
              borderWidth: m.role === 'assistant' ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 14,
                lineHeight: 20,
                color: m.role === 'user' ? '#fff' : colors.text,
              }}
            >
              {m.content}
            </Text>
          </View>
        ))}
        {sending ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} /> : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.md,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI tutor…"
          placeholderTextColor={colors.textLight}
          multiline
          style={{
            flex: 1,
            maxHeight: 100,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontFamily: fonts.bodyMedium,
            fontSize: 14,
            color: colors.text,
          }}
        />
        <Pressable
          onPress={() => void send()}
          disabled={sending || !input.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: sending || !input.trim() ? 0.5 : 1,
          }}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>

      {!isPremium() ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.sm }}>
          <PrimaryButton label="I-unlock ang AI tutor" size="lg" onPress={() => router.push('/subscribe')} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
