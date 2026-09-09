import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Create account — DoubtAI' };

export default function RegisterPage() {
  return <RegisterForm />;
}
