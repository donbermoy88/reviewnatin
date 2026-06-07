import { reportContent, type ReportReason } from './content-reports';

export type { ReportReason };

export async function reportQuestion(
  questionId: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  await reportContent({ contentType: 'question', contentId: questionId, reason, details });
}
