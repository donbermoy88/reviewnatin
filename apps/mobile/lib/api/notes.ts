import { supabase, isSupabaseConfigured } from '../supabase';

export type StudyNote = {
  id: string;
  title: string;
  body: string;
  examTypeId: string | null;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  title: string;
  body: string;
  exam_type_id: string | null;
  updated_at: string;
};

function mapNote(row: NoteRow): StudyNote {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    examTypeId: row.exam_type_id,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotes(userId: string): Promise<StudyNote[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('user_notes')
    .select('id, title, body, exam_type_id, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as NoteRow[]).map(mapNote);
}

export async function createNote(
  userId: string,
  examTypeId: string | null,
  fields?: { title?: string; body?: string }
): Promise<StudyNote> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('user_notes')
    .insert({
      user_id: userId,
      exam_type_id: examTypeId,
      title: fields?.title ?? '',
      body: fields?.body ?? '',
    })
    .select('id, title, body, exam_type_id, updated_at')
    .single();
  if (error) throw error;
  return mapNote(data as NoteRow);
}

export async function updateNote(
  noteId: string,
  fields: { title: string; body: string }
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('user_notes')
    .update({ title: fields.title, body: fields.body, updated_at: new Date().toISOString() })
    .eq('id', noteId);
  if (error) throw error;
}

export async function deleteNote(noteId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('user_notes').delete().eq('id', noteId);
  if (error) throw error;
}
