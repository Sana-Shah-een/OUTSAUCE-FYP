import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-';

function clearSessionAndRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);

  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX)) {
      response.cookies.delete(name);
    }
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error &&
    (error.message.toLowerCase().includes('refresh token') ||
      error.message.toLowerCase().includes('invalid_grant') ||
      error.name === 'AuthApiError')
  ) {
    return clearSessionAndRedirect(request);
  }

  const protectedPaths = ['/dashboard', '/hunts', '/leads', '/network', '/messages', '/ai-tools', '/settings', '/billing', '/admin'];
  if (!user && protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}
