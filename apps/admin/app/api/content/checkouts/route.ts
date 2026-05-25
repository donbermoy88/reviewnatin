import { NextResponse } from 'next/server';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export async function GET() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('web_checkout_sessions')
    .select(`
      id,
      reference_code,
      status,
      provider,
      amount_php,
      source,
      utm_source,
      created_at,
      submitted_at,
      users ( email ),
      subscription_products ( sku )
    `)
    .in('status', ['pending', 'submitted'])
    .gt('expires_at', new Date().toISOString())
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rows: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 });
  }

  const body = (await request.json()) as { referenceCode?: string };
  if (!body.referenceCode?.trim()) {
    return NextResponse.json({ ok: false, error: 'referenceCode required' }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc('fulfill_web_checkout', {
    p_reference_code: body.referenceCode.trim(),
    p_auto_demo: false,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
