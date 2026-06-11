import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createListScreenStyles } from '../../lib/themed-styles';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { createNote, deleteNote, fetchNotes, updateNote, type StudyNote } from '../../lib/api/notes';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

type Editing = { id: string | null; title: string; body: string };

export default function NotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing, fonts, radii } = theme;
  const styles = useMemo(() => createListScreenStyles(theme), [theme]);
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const goal = await resolveOnboardingGoal(user.id);
      const exam = await fetchExamBySlug(goal?.examSlug ?? DEFAULT_EXAM_SLUG);
      setExamTypeId(exam?.id ?? null);
      setNotes(await fetchNotes(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (!user || !editing || saving) return;
    const title = editing.title.trim();
    const body = editing.body.trim();
    if (!title && !body) {
      setEditing(null);
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await updateNote(editing.id, { title, body });
      } else {
        await createNote(user.id, examTypeId, { title, body });
      }
      setNotes(await fetchNotes(user.id));
      setEditing(null);
    } catch {
      Alert.alert('Hindi na-save', 'Pakisubukan ulit.');
    } finally {
      setSaving(false);
    }
  }, [user, editing, saving, examTypeId]);

  const remove = useCallback(
    (note: StudyNote) => {
      Alert.alert('I-delete ang note?', 'Hindi na ito maibabalik.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteNote(note.id);
                setNotes((prev) => prev.filter((n) => n.id !== note.id));
                setEditing(null);
              } catch {
                Alert.alert('Hindi na-delete', 'Pakisubukan ulit.');
              }
            })();
          },
        },
      ]);
    },
    []
  );

  if (!user) {
    return (
      <StackShell title="Study notes" subtitle="Mga personal mong study notes">
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="Kailangan mo ng account para mag-save ng notes."
          actionLabel="Log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  // ── EDITOR ───────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <StackShell title={editing.id ? 'Edit note' : 'New note'}>
        <View style={{ gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}>
          <TextInput
            value={editing.title}
            onChangeText={(t) => setEditing((e) => (e ? { ...e, title: t } : e))}
            placeholder="Pamagat"
            placeholderTextColor={colors.textLight}
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 18,
              color: colors.text,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
            }}
          />
          <TextInput
            value={editing.body}
            onChangeText={(t) => setEditing((e) => (e ? { ...e, body: t } : e))}
            placeholder="Isulat ang notes mo…"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 15,
              lineHeight: 22,
              color: colors.text,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              minHeight: 220,
            }}
          />
          <PrimaryButton label={saving ? 'Sina-save…' : 'I-save ang note'} size="lg" disabled={saving} onPress={() => void save()} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <PrimaryButton label="Kanselahin" variant="outline" style={{ flex: 1 }} onPress={() => setEditing(null)} />
            {editing.id ? (
              <PrimaryButton
                label="I-delete"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  const current = notes.find((n) => n.id === editing.id);
                  if (current) remove(current);
                }}
              />
            ) : null}
          </View>
        </View>
      </StackShell>
    );
  }

  // ── LIST ─────────────────────────────────────────────────────────────────
  return (
    <StackShell title="Study notes" subtitle={`${notes.length} note${notes.length === 1 ? '' : 's'}`}>
      <PrimaryButton
        label="+ Bagong note"
        size="lg"
        style={{ marginBottom: spacing.md }}
        onPress={() => setEditing({ id: null, title: '', body: '' })}
      />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={32} color={colors.primary} />}
          title="Wala pang notes"
          description="Itala ang mga formula, mnemonics, at paalala. I-tap ang “Bagong note” para magsimula."
        />
      ) : (
        <View style={{ gap: spacing.sm, paddingBottom: insets.bottom + spacing.xl }}>
          {notes.map((note) => (
            <Pressable
              key={note.id}
              style={styles.card}
              onPress={() => setEditing({ id: note.id, title: note.title, body: note.body })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
                <Text style={[styles.cardStem, { flex: 1 }]} numberOfLines={1}>
                  {note.title || 'Walang pamagat'}
                </Text>
                <Pressable onPress={() => remove(note)} hitSlop={8} style={{ justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
              {note.body ? (
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                  {note.body}
                </Text>
              ) : null}
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textLight, marginTop: 6 }}>
                {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </StackShell>
  );
}
