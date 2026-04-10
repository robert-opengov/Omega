'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/ui/organisms/AuthForm';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';
import { useAuth } from '@/providers';
import { Suspense } from 'react';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/home';

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);
    if (result.success) {
      router.push(redirectUrl);
      return true;
    }
    return false;
  };

  return (
    <AuthLayout>
      <AuthForm onSubmit={handleLogin} />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <LoginContent />
    </Suspense>
  );
}
