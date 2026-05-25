import { NextResponse } from 'next/server';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const body = (await request.json()) as {
    title?: string;
    body?: string;
    examSlug?: string | null;
  };

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ ok: false, error: 'Title and body required' }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  let examTypeId: string | null = null;

  if (body.examSlug) {
    const { data: exam } = await supabase
      .from('exam_types')
      .select('id')
      .eq('slug', body.examSlug)
      .maybeSingle();
    examTypeId = exam?.id ?? null;
  }

  const { error } = await supabase.from('announcements').insert({
    title: body.title.trim(),
    body: body.body.trim(),
    exam_type_id: examTypeId,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
