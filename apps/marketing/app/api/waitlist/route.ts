import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Waitlist not configured' }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; platform?: string; examInterest?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'Valid email required' }, { status: 400 });
  }

  const supabase = createClient(url, key);
  const { error } = await supabase.from('waitlist_signups').insert({
    email,
    platform: body.platform ?? 'web',
    exam_interest: body.examInterest ?? null,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
