import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../../components/primary-button';
import { ReportContentButton } from '../../../components/report-content-button';
import { RichText } from '../../../components/rich-text';
import { useAppTheme } from '../../../hooks/use-app-theme';
import { createStudyStyles } from '../../../lib/themed-styles';
import { fetchReviewMaterialById } from '../../../lib/api/review-materials';
import { getOfflineMaterialById } from '../../../lib/offline/pack';
import { fetchBookmarkedMaterialIds, toggleMaterialBookmark } from '../../../lib/api/bookmarks';
import { resolveOnboardingGoal } from '../../../lib/api/goals';
import { canUseTts, speakText, stopSpeaking } from '../../../lib/tts/speak';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../../providers/auth-provider';

export default function LessonReaderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing, fonts, radii } = theme;
  const styles = useMemo(() => createStudyStyles(theme), [theme]);
  const { user } = useAuth();
  const { id, examSlug: paramExamSlug, offline: offlineParam } = useLocalSearchParams<{
    id: string;
    examSlug?: string;
    offline?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topicName, setTopicName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [ttsStarting, setTtsStarting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    const goal = await resolveOnboardingGoal(user?.id);
    const slug = paramExamSlug ?? goal?.examSlug ?? DEFAULT_EXAM_SLUG;

    try {
      if (offlineParam === '1') {
        const cached = await getOfflineMaterialById(slug, id);
        if (cached) {
          setTitle(cached.title);
          setBody(cached.body);
          setTopicName(cached.topicSlug ?? '');
          setSubjectName(cached.subjectName);
          setIsOffline(true);
        }
      } else {
        const material = await fetchReviewMaterialById(slug, id);
        if (material) {
          setTitle(material.title);
          setBody(material.body);
          setTopicName(material.topicName);
          setSubjectName(material.subjectName);
        } else {
          const cached = await getOfflineMaterialById(slug, id);
          if (cached) {
            setTitle(cached.title);
            setBody(cached.body);
            setTopicName(cached.topicSlug ?? '');
            setSubjectName(cached.subjectName);
            setIsOffline(true);
          }
        }
      }
      if (user) {
        const ids = await fetchBookmarkedMaterialIds(user.id);
        setBookmarked(ids.has(id));
      }
    } finally {
      setLoading(false);
    }
  }, [id, paramExamSlug, offlineParam, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      void stopSpeaking();
    };
  }, []);

  const toggleSpeech = useCallback(async () => {
    if (ttsStarting) return;

    if (speaking) {
      setTtsStarting(true);
      try {
        await stopSpeaking();
      } finally {
        setSpeaking(false);
        setTtsStarting(false);
      }
      return;
    }

    try {
      setTtsStarting(true);
      const started = await speakText(body, 'en', {
        onDone: () => setSpeaking(false),
        onError: () => {
          setSpeaking(false);
          Alert.alert('Audio unavailable', 'Text-to-speech could not start on this device. Please try again.');
        },
      });
      setSpeaking(started);
      if (!started) {
        Alert.alert('Audio unavailable', 'Text-to-speech could not start on this device. Please try again.');
      }
    } catch {
      setSpeaking(false);
      Alert.alert('Audio unavailable', 'Text-to-speech could not start on this device. Please try again.');
    } finally {
      setTtsStarting(false);
    }
  }, [body, speaking, ttsStarting]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!title) {
    return (
      <View style={[styles.center, { padding: spacing.lg }]}>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.textMuted, textAlign: 'center' }}>
          Lesson not found or not available on your plan.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.md }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>
                {subjectName} · {topicName}
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff', marginTop: spacing.xs, lineHeight: 28 }}>
                {title}
              </Text>
              {isOffline ? (
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  OFFLINE · from downloaded pack
                </Text>
              ) : null}
            </View>
            {user ? (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  void (async () => {
                    await toggleMaterialBookmark(user.id, id!, bookmarked);
                    setBookmarked(!bookmarked);
                  })();
                }}
              >
                <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color="#fff" />
              </Pressable>
            ) : null}
          </View>
          {canUseTts() && body ? (
            <PrimaryButton
              label={ttsStarting ? 'Starting audio...' : speaking ? 'Stop audio' : 'Listen · TTS'}
              variant="outline"
              icon={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
              disabled={ttsStarting}
              onPress={() => void toggleSpeech()}
              style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
            />
          ) : null}
          <ReportContentButton
            contentType="review_material"
            contentId={id}
            label="Flag this lesson"
            style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
          />
        </LinearGradient>

        <View style={[styles.body, { paddingTop: spacing.lg }]}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <RichText content={body} fontSize={15} color={colors.text} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
