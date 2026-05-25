export type ExamCountdown = {
  daysLeft: number;
  label: string;
  tone: 'past' | 'urgent' | 'soon' | 'normal';
  targetLabel: string;
};

export function formatExamCountdown(targetDateIso: string, today = new Date()): ExamCountdown {
  const target = new Date(`${targetDateIso.slice(0, 10)}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = target.getTime() - todayStart.getTime();
  const daysLeft = Math.ceil(diffMs / 86400000);

  const targetLabel = target.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (daysLeft < 0) {
    return {
      daysLeft,
      label: 'Exam date passed — update your target in onboarding',
      tone: 'past',
      targetLabel,
    };
  }

  if (daysLeft === 0) {
    return { daysLeft, label: 'Exam day is today — good luck!', tone: 'urgent', targetLabel };
  }

  if (daysLeft === 1) {
    return { daysLeft, label: '1 day until exam day', tone: 'urgent', targetLabel };
  }

  if (daysLeft <= 7) {
    return { daysLeft, label: `${daysLeft} days until exam day`, tone: 'urgent', targetLabel };
  }

  if (daysLeft <= 30) {
    return { daysLeft, label: `${daysLeft} days until exam day`, tone: 'soon', targetLabel };
  }

  return { daysLeft, label: `${daysLeft} days until exam day`, tone: 'normal', targetLabel };
}
