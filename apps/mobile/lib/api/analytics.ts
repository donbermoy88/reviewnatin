import type { Question, QuestionChoice } from '../types';
import { cleanStem } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { isDailyLimitError } from './iap';
import type { PracticeFetchError } from './catalog';
import { shuffleQuestionChoices } from '../question-randomization';
import { rowList } from './result';

type PracticeQuestionRow = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  difficulty: number;
  topic_name: string;
  subject_name: string;
  exam_slug: string;
};

export type TopicAnalyticsRow = {
  topicId: string;
  topicSlug: string;
  topicName: string;
  subjectName: string;
  accuracy: number;
  attempts: number;
  correctCount: number;
};

export type SubjectAnalytics = {
  subjectName: string;
  topics: TopicAnalyticsRow[];
  averageAccuracy: number;
  weakTopics: TopicAnalyticsRow[];
};

function mapPracticeQuestion(row: PracticeQuestionRow): Question {
  return shuffleQuestionChoices({
    id: row.id,
    stem: cleanStem(row.stem),
    choices: row.choices,
    difficulty: row.difficulty,
    topic: {
      name: row.topic_name,
      subject: {
        name: row.subject_name,
        exam_slug: row.exam_slug,
      },
    },
  });
}

export async function fetchTopicAnalytics(
  examSlug: string
): Promise<{ subjects: SubjectAnalytics[]; allTopics: TopicAnalyticsRow[] }> {
  if (!isSupabaseConfigured) {
    return { subjects: [], allTopics: [] };
  }

  const { data, error } = await supabase.rpc('get_exam_topic_analytics', {
    p_exam_slug: examSlug,
  });

  if (error) throw error;

  const rows: TopicAnalyticsRow[] = ((data ?? []) as Array<{
    topic_id: string;
    topic_slug: string;
    topic_name: string;
    subject_name: string;
    accuracy: number;
    attempts: number;
    correct_count: number;
  }>).map((row) => ({
    topicId: row.topic_id,
    topicSlug: row.topic_slug,
    topicName: row.topic_name,
    subjectName: row.subject_name,
    accuracy: Number(row.accuracy ?? 0),
    attempts: row.attempts ?? 0,
    correctCount: row.correct_count ?? 0,
  }));

  const bySubject = new Map<string, TopicAnalyticsRow[]>();
  for (const topic of rows) {
    const list = bySubject.get(topic.subjectName) ?? [];
    list.push(topic);
    bySubject.set(topic.subjectName, list);
  }

  const subjects: SubjectAnalytics[] = [...bySubject.entries()].map(([subjectName, topics]) => {
    const withAttempts = topics.filter((t) => t.attempts > 0);
    const averageAccuracy =
      withAttempts.length > 0
        ? Math.round(withAttempts.reduce((sum, t) => sum + t.accuracy, 0) / withAttempts.length)
        : 0;

    return {
      subjectName,
      topics: topics.sort((a, b) => a.accuracy - b.accuracy),
      averageAccuracy,
      weakTopics: topics.filter((t) => t.attempts >= 3 && t.accuracy < 70).slice(0, 3),
    };
  });

  subjects.sort((a, b) => a.averageAccuracy - b.averageAccuracy);

  return { subjects, allTopics: rows };
}

export async function fetchWeakAreaQuestions(
  examSlug: string,
  limit = 10
): Promise<{ questions: Question[]; error?: PracticeFetchError }> {
  if (!isSupabaseConfigured) return { questions: [] };

  const { data, error } = await supabase.rpc('get_weak_area_questions', {
    p_exam_slug: examSlug,
    p_limit: limit,
  });

  if (error) {
    if (isDailyLimitError(error)) return { questions: [], error: 'daily_limit' };
    throw error;
  }

  return {
    questions: rowList<PracticeQuestionRow>(data).map(mapPracticeQuestion),
  };
}
