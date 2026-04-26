'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MailCheck, RefreshCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const isUnverified = searchParams.get('error') === 'unverified';
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(
    isUnverified ? { type: 'error', text: 'Please verify your email to continue.' } : null
  );

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }

    setVerifying(true);
    setMessage(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setVerifying(false);
    } else {
      setMessage({ type: 'success', text: 'Email verified successfully! Redirecting...' });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    }
  }

  async function handleResend() {
    if (!email) {
      setMessage({ type: 'error', text: 'Email address not found. Please try logging in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Verification code resent to your inbox!' });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col w-full items-center text-center space-y-6 py-4">
      <div className="relative">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20 shadow-[0_0_40px_rgba(196,30,30,0.15)] mb-2 animate-pulse">
          <MailCheck className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Verify your email</h1>
        <p className="text-sm text-text-muted font-medium max-w-[320px] mx-auto leading-relaxed">
          We&apos;ve sent a 6-digit verification code to <span className="text-text-main font-semibold">{email || 'your email'}</span>
        </p>
      </div>

      {message && (
        <Alert className={`max-w-[350px] animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          <AlertDescription className="font-medium">{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleVerifyOtp} className="w-full max-w-[320px] space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full h-14 text-center text-3xl font-bold tracking-[0.5em] bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 outline-none transition-all placeholder:text-text-muted/30 text-text-main"
              autoFocus
            />
          </div>
          
          <Button
            type="submit"
            disabled={verifying || otpCode.length !== 6}
            className="w-full rounded-full bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] border-none h-12 text-base font-bold transition-all duration-300 disabled:opacity-50"
          >
            {verifying ? (
              <span className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : 'Verify Account'}
          </Button>
        </div>
      </form>

      <div className="w-full max-w-[320px] space-y-4 pt-2">
        <div className="relative flex items-center gap-4 py-2">
          <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Didn&apos;t get a code?</span>
          <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
        </div>

        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={loading || verifying}
          className="w-full text-text-muted hover:text-brand-red hover:bg-brand-red/5 flex items-center justify-center gap-2 transition-all font-semibold h-10 rounded-full"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sending new code...' : 'Resend Code'}
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
