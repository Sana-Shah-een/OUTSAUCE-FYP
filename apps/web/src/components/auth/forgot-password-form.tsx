'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const errorMessage = error.message || 'An unexpected error occurred';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'A network error occurred';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 flex flex-col w-full">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-main">Reset Password</h1>
        <p className="mt-1 text-sm text-text-muted font-medium">
          Enter your email to receive a reset link
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <AlertDescription>
            We sent a reset link to <span className="font-semibold">{email}</span>. Click it to set a new password.
          </AlertDescription>
        </Alert>
      )}

      {!success && (
        <>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-text-main font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10 text-text-main placeholder:text-text-muted focus-visible:ring-brand-red/50"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-full bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] border-none h-11 text-base font-semibold transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                Sending...
              </span>
            ) : 'Send Reset Link'}
          </Button>
        </>
      )}

      <p className="text-center text-sm text-text-muted font-medium mt-2">
        Remembered your password?{' '}
        <Link href="/login" className="text-brand-red hover:text-brand-red/80 transition-colors">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
