import { supabase, isSupabaseConfigured } from '../supabase';

export type UserBadge = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  earnedAt: string;
};

export type NewBadge = {
  slug: string;
  title: string;
  emoji: string;
};

export async function fetchUserBadges(): Promise<UserBadge[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_user_badges', {});

  if (error) throw error;

  return ((data ?? []) as {
    slug: string;
    title: string;
    description: string;
    emoji: string;
    earned_at: string;
  }[]).map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    earnedAt: row.earned_at,
  }));
}

export async function awardUserBadges(): Promise<NewBadge[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('award_user_badges', {});

  if (error) return [];

  return (data ?? []) as NewBadge[];
}
