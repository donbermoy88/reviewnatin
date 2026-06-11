import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from './primary-button';
import { useAppTheme } from '../hooks/use-app-theme';
import type { Question } from '../lib/types';

type Props = {
  visible: boolean;
  questions: Question[];
  currentIndex: number;
  answeredIndices: Set<number>;
  onJump: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
};

type Section = { name: string; items: number[] };

/** Group questions into subject sections, preserving first-appearance order. */
function buildSections(questions: Question[]): Section[] {
  const sections: Section[] = [];
  const byName = new Map<string, Section>();
  questions.forEach((q, i) => {
    const name = q.topic?.subject?.name ?? 'Questions';
    let section = byName.get(name);
    if (!section) {
      section = { name, items: [] };
      byName.set(name, section);
      sections.push(section);
    }
    section.items.push(i);
  });
  return sections;
}

/**
 * Exam progress / question navigator for strict exams (mock & board). Shows
 * every question grouped by subject section, marks answered vs current, and
 * lets the user jump to any item. Submit is always available.
 */
export function QuestionNavigator({
  visible,
  questions,
  currentIndex,
  answeredIndices,
  onJump,
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const sections = useMemo(() => buildSections(questions), [questions]);
  const answeredCount = answeredIndices.size;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.primary,
            borderTopLeftRadius: radii.xxl,
            borderTopRightRadius: radii.xxl,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.md,
            maxHeight: '85%',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: '#fff' }}>Exam Progress</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                {answeredCount}/{questions.length}
              </Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close navigator">
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <View key={section.name} style={{ marginBottom: spacing.lg }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.25)',
                    paddingBottom: spacing.xs,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' }}>{section.name}</Text>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    {section.items.length} question{section.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {section.items.map((i) => {
                    const isCurrent = i === currentIndex;
                    const isAnswered = answeredIndices.has(i);
                    const bg = isCurrent
                      ? 'rgba(255,255,255,0.18)'
                      : isAnswered
                        ? '#fff'
                        : 'rgba(255,255,255,0.12)';
                    const fg = isAnswered && !isCurrent ? colors.primary : '#fff';
                    return (
                      <Pressable
                        key={i}
                        onPress={() => onJump(i)}
                        accessibilityRole="button"
                        accessibilityLabel={`Go to question ${i + 1}${isAnswered ? ', answered' : ''}${isCurrent ? ', current' : ''}`}
                        style={{
                          width: 48,
                          height: 44,
                          borderRadius: radii.lg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: bg,
                          borderWidth: isCurrent ? 2 : 0,
                          borderColor: colors.accent,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: fg }}>{i + 1}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <PrimaryButton
            label={`Submit exam (${answeredCount}/${questions.length} answered)`}
            variant="white"
            size="lg"
            onPress={onSubmit}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    </Modal>
  );
}
