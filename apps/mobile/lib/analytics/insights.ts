import type { SubjectAnalytics } from '../api/analytics';

export type AnalyticsInsight = {
  id: string;
  icon: 'trending-down' | 'trending-up' | 'flash' | 'bulb' | 'checkmark-circle';
  title: string;
  subtitle: string;
  tone: 'primary' | 'success' | 'warn' | 'neutral';
};

export function buildAnalyticsInsights(
  subjects: SubjectAnalytics[],
  accuracyPercent: number | null
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const weakTopics = subjects.flatMap((s) => s.weakTopics);
  const withData = subjects.filter((s) => s.topics.some((t) => t.attempts > 0));

  if (weakTopics.length >= 3) {
    insights.push({
      id: 'weak-topics',
      icon: 'trending-down',
      title: `Review ${Math.min(weakTopics.length, 3)} weak topics today`,
      subtitle: weakTopics
        .slice(0, 3)
        .map((t) => t.topicName)
        .join(' · '),
      tone: 'warn',
    });
  } else if (weakTopics.length > 0) {
    insights.push({
      id: 'weak-focus',
      icon: 'flash',
      title: `Focus on ${weakTopics[0].topicName}`,
      subtitle: `${Math.round(weakTopics[0].accuracy)}% accuracy · ${weakTopics[0].attempts} tries`,
      tone: 'warn',
    });
  }

  if (withData.length >= 2) {
    const strongest = [...withData].sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0];
    if (strongest.averageAccuracy >= 70) {
      insights.push({
        id: 'strong-subject',
        icon: 'trending-up',
        title: `Strong in ${strongest.subjectName}`,
        subtitle: `${Math.round(strongest.averageAccuracy)}% average accuracy — keep the momentum`,
        tone: 'success',
      });
    }

    const weakest = [...withData].sort((a, b) => a.averageAccuracy - b.averageAccuracy)[0];
    if (weakest.averageAccuracy < 60 && weakest.subjectName !== strongest?.subjectName) {
      insights.push({
        id: 'weak-subject',
        icon: 'bulb',
        title: `Build up ${weakest.subjectName}`,
        subtitle: `${Math.round(weakest.averageAccuracy)}% avg — add 10 quick questions today`,
        tone: 'primary',
      });
    }
  }

  if (accuracyPercent != null) {
    insights.push({
      id: 'accuracy',
      icon: accuracyPercent >= 70 ? 'checkmark-circle' : 'bulb',
      title: `${accuracyPercent}% overall accuracy`,
      subtitle:
        accuracyPercent >= 75
          ? 'Solid baseline — try a mock exam this week'
          : 'Keep practicing daily to lift your average',
      tone: accuracyPercent >= 70 ? 'success' : 'neutral',
    });
  } else if (insights.length === 0) {
    insights.push({
      id: 'start',
      icon: 'flash',
      title: 'Start your first quiz',
      subtitle: 'Charts and weak-area insights unlock after a few sessions',
      tone: 'primary',
    });
  }

  return insights.slice(0, 3);
}
