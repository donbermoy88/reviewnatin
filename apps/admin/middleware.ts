import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const STAFF_ROLES = new Set(['admin', 'content_reviewer', 'content_author']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  const protectedPath =
    pathname.startsWith('/content') || pathname.startsWith('/api/content') || pathname === '/';

  if (!protectedPath) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();

  if (!profile?.role || !STAFF_ROLES.has(profile.role)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.searchParams.set('error', 'staff');
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
