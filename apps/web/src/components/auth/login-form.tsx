'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, MailWarning, CheckCircle2, XCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';
  const callbackFailed = searchParams.get('error') === 'auth_callback_failed';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailUnverified, setEmailUnverified] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailUnverified(false);
    setLoading(true);

    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      
      if (
        message.toLowerCase().includes('email not confirmed') ||
        message.toLowerCase().includes('not confirmed')
      ) {
        setEmailUnverified(true);
      } else {
        setError(message);
      }
      setLoading(false);
      return;
    }

    if (session?.user && !session.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setEmailUnverified(true);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 flex flex-col w-full">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-main">Welcome back</h1>
        <p className="mt-1 text-sm text-text-muted font-medium">
          Sign in to your Outsauce account
        </p>
      </div>

      {isVerified && (
        <Alert className="bg-emerald-500/10 border-emerald-500/25 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <AlertDescription className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              Email confirmed! You can now sign in.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {callbackFailed && (
        <Alert className="bg-red-500/10 border-red-500/25 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <AlertDescription className="text-red-600 dark:text-red-400 font-semibold text-sm">
              Verification link expired or is invalid. Please request a new one.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {error && !emailUnverified && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {emailUnverified && (
        <Alert className="bg-amber-500/10 border-amber-500/25 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <MailWarning className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <AlertDescription className="text-amber-600 dark:text-amber-400 font-semibold text-sm">
                Your email address is not verified yet.
              </AlertDescription>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium leading-relaxed">
                Please check your inbox for the verification code we sent you.
              </p>
              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}&error=unverified`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-2 transition-colors mt-1"
              >
                Go to Verify Email →
              </Link>
            </div>
          </div>
        </Alert>
      )}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-text-main font-medium">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-red hover:text-brand-red/80 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10 bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10 text-text-main placeholder:text-text-muted focus-visible:ring-brand-red/50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
            Signing in...
          </span>
        ) : 'Sign in'}
      </Button>

      <div className="relative flex items-center gap-4">
        <Separator className="flex-1 bg-black/10 dark:bg-white/10" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Or continue with</span>
        <Separator className="flex-1 bg-black/10 dark:bg-white/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="w-full rounded-full h-11 text-base font-semibold border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-text-main transition-colors bg-transparent"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </Button>

      <p className="text-center text-sm text-text-muted font-medium mt-2">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-brand-red hover:text-brand-red/80 transition-colors">
          Sign up
        </Link>
      </p>
    </form>
  );
}
