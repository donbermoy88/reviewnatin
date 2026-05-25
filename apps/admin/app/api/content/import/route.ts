import { NextResponse } from 'next/server';
import { importQuestionsFromCsv, previewQuestionImport } from '@/lib/content-import';
import { isAdminConfigured } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Admin Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY in apps/admin/.env.local' },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const action = String(form.get('action') ?? 'preview');
    const publish = form.get('publish') === 'true';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing CSV file' }, { status: 400 });
    }

    const csvText = await file.text();

    if (action === 'preview') {
      const result = await previewQuestionImport(csvText);
      return NextResponse.json(result);
    }

    if (action === 'import') {
      const result = await importQuestionsFromCsv(csvText, { publish });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
