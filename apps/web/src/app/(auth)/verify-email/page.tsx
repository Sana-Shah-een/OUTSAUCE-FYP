import { Suspense } from 'react';
import { VerifyEmailView } from '@/components/auth/verify-email-view';

export const metadata = {
  title: 'Verify Email | OutSauce',
  description: 'Please verify your email address to continue using OutSauce.',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailView />
    </Suspense>
  );
}
