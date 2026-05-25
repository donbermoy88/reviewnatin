import { supabase, isSupabaseConfigured } from '../supabase';

export type BarkadaMember = {
  userId: string;
  displayName: string;
  isOwner: boolean;
  joinedAt: string;
};

export type BarkadaChallengeResult = {
  userId: string;
  displayName: string;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
};

export type BarkadaGroup = {
  groupId: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  members: BarkadaMember[];
  activeChallenge: {
    id: string;
    questionCount: number;
    status: string;
    expiresAt: string;
    createdAt: string;
  } | null;
  challengeResults: BarkadaChallengeResult[];
};

export async function fetchMyBarkada(examSlug: string): Promise<BarkadaGroup | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_my_barkada', { p_exam_slug: examSlug });
  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const members = (row.members as Array<Record<string, unknown>>) ?? [];
  const results = (row.challenge_results as Array<Record<string, unknown>>) ?? [];
  const challenge = row.active_challenge as Record<string, unknown> | null;

  return {
    groupId: row.group_id as string,
    name: row.name as string,
    inviteCode: row.invite_code as string,
    isOwner: Boolean(row.is_owner),
    members: members.map((m) => ({
      userId: m.user_id as string,
      displayName: m.display_name as string,
      isOwner: Boolean(m.is_owner),
      joinedAt: m.joined_at as string,
    })),
    activeChallenge: challenge
      ? {
          id: challenge.id as string,
          questionCount: challenge.question_count as number,
          status: challenge.status as string,
          expiresAt: challenge.expires_at as string,
          createdAt: challenge.created_at as string,
        }
      : null,
    challengeResults: results.map((r) => ({
      userId: r.user_id as string,
      displayName: r.display_name as string,
      scorePercent: r.score_percent as number,
      correctCount: r.correct_count as number,
      totalCount: r.total_count as number,
      submittedAt: r.submitted_at as string,
    })),
  };
}

export async function createBarkadaGroup(examSlug: string, name?: string): Promise<{ groupId: string; inviteCode: string }> {
  const { data, error } = await supabase.rpc('create_barkada_group', {
    p_exam_slug: examSlug,
    p_name: name ?? 'My Barkada',
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return { groupId: row.group_id as string, inviteCode: row.invite_code as string };
}

export async function joinBarkadaGroup(inviteCode: string): Promise<{ groupId: string; name: string }> {
  const { data, error } = await supabase.rpc('join_barkada_group', { p_invite_code: inviteCode });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return { groupId: row.group_id as string, name: row.name as string };
}

export async function createBarkadaChallenge(
  groupId: string,
  questionCount = 10
): Promise<{ challengeId: string; examSlug: string; questionCount: number }> {
  const { data, error } = await supabase.rpc('create_barkada_challenge', {
    p_group_id: groupId,
    p_question_count: questionCount,
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return {
    challengeId: row.challenge_id as string,
    examSlug: row.exam_slug as string,
    questionCount: row.question_count as number,
  };
}

export async function submitBarkadaChallengeResult(
  challengeId: string,
  sessionId: string,
  scorePercent: number,
  correctCount: number,
  totalCount: number
): Promise<void> {
  const { error } = await supabase.rpc('submit_barkada_challenge_result', {
    p_challenge_id: challengeId,
    p_session_id: sessionId,
    p_score_percent: scorePercent,
    p_correct_count: correctCount,
    p_total_count: totalCount,
  });
  if (error) throw error;
}

export function buildBarkadaInviteMessage(inviteCode: string, groupName: string): string {
  return `Join my Barkada on ReviewNatin — "${groupName}"!\n\nOpen: reviewnatin://barkada?code=${inviteCode}\n\nOr enter code ${inviteCode} in the app → Barkada → Join.`;
}
