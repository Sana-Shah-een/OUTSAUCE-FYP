'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, RefreshCcw } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [step, setStep] = useState<'otp' | 'password'>(email ? 'otp' : 'password');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If no email and not on password step, redirect to forgot-password
  useEffect(() => {
    if (!email && step === 'otp') {
      router.push('/forgot-password');
    }
  }, [email, step, router]);

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'recovery',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStep('password');
    setLoading(false);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  }

  return (
    <div className="flex flex-col w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-main">
          {step === 'otp' ? 'Verify Code' : 'Set New Password'}
        </h1>
        <p className="mt-1 text-sm text-text-muted font-medium">
          {step === 'otp' 
            ? `Enter the 6-digit code sent to ${email}` 
            : 'Enter your new password below'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success ? (
        <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <AlertDescription>Password updated successfully. Redirecting to login...</AlertDescription>
        </Alert>
      ) : (
        <>
          {step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                disabled={loading || otpCode.length !== 6}
                className="w-full rounded-full bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] border-none h-12 text-base font-bold transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-text-main font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
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
                  <p className="text-[10px] text-text-muted">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-text-main font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 pr-10 bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10 text-text-main placeholder:text-text-muted focus-visible:ring-brand-red/50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    Updating...
                  </span>
                ) : 'Update Password'}
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
