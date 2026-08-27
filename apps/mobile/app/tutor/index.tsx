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
import { PremiumLock } from '../../components/premium-lock';
import { IconButton } from '../../components/icon-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createLeaderboardStyles } from '../../lib/themed-styles';
import { sendAiTutorMessage, type AiTutorMessage } from '../../lib/api/ai-tutor';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { trackEvent } from '../../lib/analytics/events';
import { PREMIUM_LOCK_BODY, PREMIUM_LOCK_CTA, PREMIUM_LOCK_TITLE } from '../../lib/subscription/paywall-copy';

const EXAM_PREP_STARTER: AiTutorMessage = {
  role: 'assistant',
  content:
    'Kumusta! AI tutor mo ako para sa huling sprint bago exam. Magtanong tungkol sa weak topics mo, mock exam strategy, o kung ano ang dapat unahin ngayong araw. Ano ang gusto mong pag-aralan?',
};

const QUICK_PROMPTS = [
  'Ano ang dapat i-review ngayong araw?',
  'Paano maghanda sa mock exam?',
  'Explain my weakest topic',
] as const;

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
  const [messages, setMessages] = useState<AiTutorMessage[]>([EXAM_PREP_STARTER]);
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
      Alert.alert(PREMIUM_LOCK_TITLE, PREMIUM_LOCK_BODY, [
        { text: 'Not now', style: 'cancel' },
        { text: PREMIUM_LOCK_CTA, onPress: () => router.push('/subscribe') },
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
          Alert.alert(PREMIUM_LOCK_TITLE, PREMIUM_LOCK_BODY, [
            { text: 'Not now', style: 'cancel' },
            { text: PREMIUM_LOCK_CTA, onPress: () => router.push('/subscribe') },
          ]);
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
      trackEvent('ai_tutor_message', { examSlug, locale, remaining: result.remaining ?? null });
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
        <IconButton variant="plain" buttonSize={28} size={22} icon="chevron-back" color="#fff" hitSlop={8} accessibilityLabel="Go back" style={{ marginBottom: spacing.sm }} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>AI Tutor</Text>
        <Text style={styles.headerSub}>
          {isPremium()
            ? remaining != null
              ? `Plus · ${remaining} AI message${remaining === 1 ? '' : 's'} left today`
              : 'Plus · AI tutor unlocked for exam prep'
            : PREMIUM_LOCK_TITLE}
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
                fontSize: 15,
                lineHeight: 22,
                color: m.role === 'user' ? '#fff' : colors.text,
              }}
            >
              {m.content}
            </Text>
          </View>
        ))}
        {sending ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} /> : null}
        {isPremium() && !sending ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => setInput(prompt)}
                accessibilityRole="button"
                accessibilityLabel={prompt}
                style={({ pressed }) => ({
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 6,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
            fontSize: 15,
            lineHeight: 22,
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
          <PremiumLock
            description="Buksan ang unlimited AI tutor para sa exam prep mo."
            onPress={() => {
              trackEvent('subscription_viewed', { source: 'ai_tutor' });
              router.push('/subscribe');
            }}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
