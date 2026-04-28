'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MailCheck, RefreshCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const isUnverified = searchParams.get('error') === 'unverified';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    isUnverified ? { type: 'error', text: 'Please verify your email to continue.' } : null,
  );

  async function handleResend() {
    if (!email) {
      setMessage({ type: 'error', text: 'Email address not found. Please sign up again.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to resend the link.',
      });
    } else {
      setMessage({ type: 'success', text: 'A fresh verification link is on its way.' });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col w-full items-center text-center space-y-6 py-4">
      <div className="relative">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20 shadow-[0_0_40px_rgba(196,30,30,0.15)] mb-2">
          <MailCheck className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Check your inbox</h1>
        <p className="text-sm text-text-muted font-medium max-w-[360px] mx-auto leading-relaxed">
          We sent a verification link to{' '}
          <span className="text-text-main font-semibold">{email || 'your email'}</span>. Click it to
          finish creating your account.
        </p>
      </div>

      {message && (
        <Alert
          className={`max-w-[360px] animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}
        >
          <AlertDescription className="font-medium">{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="w-full max-w-[320px] space-y-4 pt-2">
        <p className="text-xs text-text-muted">
          Can&apos;t find the email? Check your spam folder, or resend below.
        </p>

        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={loading}
          className="w-full text-text-muted hover:text-brand-red hover:bg-brand-red/5 flex items-center justify-center gap-2 transition-all font-semibold h-10 rounded-full"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sending new link...' : 'Resend Link'}
        </Button>

        <Link href="/login" className="w-full block">
          <Button
            variant="outline"
            className="w-full rounded-full h-10 text-sm font-bold border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text-main transition-colors bg-transparent"
          >
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
