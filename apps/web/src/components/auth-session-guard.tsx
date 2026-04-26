'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * AuthSessionGuard
 *
 * A zero-UI component that sits in the root layout and handles invalid /
 * stale Supabase sessions on the CLIENT side.
 *
 * Why this is needed:
 *   The middleware handles the server-side case (on every navigation).
 *   But if a page is already open and the token goes bad mid-session
 *   (e.g. Supabase is restarted, or a tab is left open overnight),
 *   the browser-side Supabase client will fire a TOKEN_REFRESHED error.
 *   This component catches that event and cleanly signs the user out,
 *   then redirects them to /login.
 */
export function AuthSessionGuard() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_OUT with no session means either the user logged out normally
      // or a token refresh silently failed. Either way, send to /login.
      if (event === 'SIGNED_OUT' && !session) {
        router.push('/login');
        return;
      }

      // TOKEN_REFRESHED fires when the client tries to renew the token.
      // If session is null here, the refresh failed (invalid token).
      if (event === 'TOKEN_REFRESHED' && !session) {
        supabase.auth.signOut().finally(() => {
          router.push('/login');
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Renders nothing — purely behavioural
  return null;
}
