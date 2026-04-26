import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Forgot Password | OutSauce',
  description: 'Reset your OutSauce account password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
