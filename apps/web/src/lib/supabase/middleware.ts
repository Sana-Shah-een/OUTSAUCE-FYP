import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Cookie name prefixes used by Supabase auth */
const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-';

/**
 * Clears all Supabase auth cookies and redirects to /login.
 * Called when a stale / invalid refresh token is detected — e.g. after
 * `npx supabase start` wipes the local DB, or a production token expires.
 */
function clearSessionAndRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);

  // Delete every Supabase auth cookie so the browser starts fresh
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

  // ── Permanent fix: stale / invalid refresh token ──────────────────────────
  // This happens when the local Supabase instance is restarted (db wiped) or
  // a production refresh token has been revoked / expired. Instead of letting
  // the error propagate and loop, we clear the bad cookies and redirect to
  // login so the user can start a fresh session.
  if (
    error &&
    (error.message.toLowerCase().includes('refresh token') ||
      error.message.toLowerCase().includes('invalid_grant') ||
      error.name === 'AuthApiError')
  ) {
    return clearSessionAndRedirect(request);
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = ['/dashboard', '/hunts', '/leads', '/network', '/messages', '/ai-tools', '/settings', '/billing', '/admin'];
  if (!user && protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}
