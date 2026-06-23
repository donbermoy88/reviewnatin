import { describe, expect, it } from 'vitest';
import type { SubjectAnalytics, TopicAnalyticsRow } from '../api/analytics';
import { buildAnalyticsInsights } from './insights';

function topic(partial: Partial<TopicAnalyticsRow> & Pick<TopicAnalyticsRow, 'topicName'>): TopicAnalyticsRow {
  return {
    topicId: 't1',
    topicSlug: 't1',
    subjectName: 'Gen Info',
    accuracy: partial.accuracy ?? 30,
    attempts: partial.attempts ?? 5,
    correctCount: partial.correctCount ?? 1,
    ...partial,
  };
}

describe('buildAnalyticsInsights', () => {
  it('suggests reviewing weak topics when three or more exist', () => {
    const subjects: SubjectAnalytics[] = [
      {
        subjectName: 'Gen Info',
        averageAccuracy: 40,
        topics: [],
        weakTopics: [
          topic({ topicName: 'Ethics', accuracy: 30 }),
          topic({ topicName: 'Logic', accuracy: 35, topicSlug: 'logic' }),
          topic({ topicName: 'Filipino', accuracy: 28, topicSlug: 'filipino' }),
        ],
      },
    ];
    const insights = buildAnalyticsInsights(subjects, 55);
    expect(insights[0]?.title).toMatch(/Review 3 weak topics/i);
  });

  it('prompts first quiz when no data', () => {
    const insights = buildAnalyticsInsights([], null);
    expect(insights[0]?.title).toMatch(/first quiz/i);
  });
});
