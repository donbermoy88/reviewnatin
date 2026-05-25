import { NextResponse } from 'next/server';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const body = (await request.json()) as {
    examSlug?: string;
    subjectSlug?: string;
    topicSlug?: string;
    title?: string;
    materialBody?: string;
    materialType?: 'lesson' | 'cheat_sheet';
    isPremium?: boolean;
  };

  if (!body.examSlug || !body.subjectSlug || !body.topicSlug || !body.title?.trim() || !body.materialBody?.trim()) {
    return NextResponse.json({ ok: false, error: 'examSlug, subjectSlug, topicSlug, title, materialBody required' }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  const { data: topic, error: topicErr } = await supabase
    .from('topics')
    .select('id, subject_areas!inner ( slug, exam_types!inner ( slug ) )')
    .eq('slug', body.topicSlug)
    .eq('subject_areas.slug', body.subjectSlug)
    .eq('subject_areas.exam_types.slug', body.examSlug)
    .maybeSingle();

  if (topicErr) {
    return NextResponse.json({ ok: false, error: topicErr.message }, { status: 500 });
  }
  if (!topic?.id) {
    return NextResponse.json({ ok: false, error: 'Topic not found for exam/subject/topic slugs' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('review_materials')
    .insert({
      topic_id: topic.id,
      title: body.title.trim(),
      body: body.materialBody.trim(),
      material_type: body.materialType ?? 'lesson',
      is_premium: body.isPremium ?? false,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
