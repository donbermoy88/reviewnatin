import { NextResponse } from 'next/server';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const body = (await request.json()) as {
    examSlug?: string;
    eventType?: string;
    eventDate?: string;
    sourceUrl?: string;
    notes?: string;
  };

  if (!body.examSlug || !body.eventType || !body.eventDate) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: exam, error: examError } = await supabase
    .from('exam_types')
    .select('id')
    .eq('slug', body.examSlug)
    .maybeSingle();

  if (examError || !exam) {
    return NextResponse.json({ ok: false, error: 'Exam not found' }, { status: 404 });
  }

  const { error } = await supabase.from('exam_schedules').insert({
    exam_type_id: exam.id,
    event_type: body.eventType,
    event_date: body.eventDate,
    source_url: body.sourceUrl ?? null,
    notes: body.notes ?? null,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
