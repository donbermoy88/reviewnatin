import { NextResponse } from 'next/server';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const { id } = await params;
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      stem,
      choices,
      correct_choice_id,
      explanation_en,
      explanation_fil,
      difficulty,
      status,
      is_verified,
      topics (
        slug,
        name,
        subject_areas (
          slug,
          name,
          exam_types ( slug, name )
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const topic = data.topics as {
    slug?: string;
    name?: string;
    subject_areas?: {
      slug?: string;
      name?: string;
      exam_types?: { slug?: string; name?: string } | { slug?: string; name?: string }[];
    };
  } | null;

  const examTypes = topic?.subject_areas?.exam_types;
  const exam = Array.isArray(examTypes) ? examTypes[0] : examTypes;

  return NextResponse.json({
    ok: true,
    question: {
      id: data.id,
      stem: data.stem,
      choices: data.choices,
      correctChoiceId: data.correct_choice_id,
      explanationEn: data.explanation_en,
      explanationFil: data.explanation_fil,
      difficulty: data.difficulty,
      status: data.status,
      isVerified: data.is_verified,
      topicSlug: topic?.slug,
      topicName: topic?.name,
      subjectSlug: topic?.subject_areas?.slug,
      subjectName: topic?.subject_areas?.name,
      examSlug: exam?.slug,
      examName: exam?.name,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    stem?: string;
    explanationEn?: string;
    explanationFil?: string;
    status?: 'draft' | 'in_review' | 'published' | 'archived';
  };

  const supabase = getAdminSupabase();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.stem?.trim()) updates.stem = body.stem.trim();
  if (body.explanationEn !== undefined) updates.explanation_en = body.explanationEn;
  if (body.explanationFil !== undefined) updates.explanation_fil = body.explanationFil;
  if (body.status) {
    updates.status = body.status;
    if (body.status === 'published') updates.is_verified = true;
  }

  const { error } = await supabase.from('questions').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
