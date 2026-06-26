import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Login — CrunchAI',
  description: 'Sign in to your CrunchAI account',
};

export default function LoginPage() {
  return <LoginClient />;
}
