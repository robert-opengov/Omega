'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/ui/organisms/AuthForm';
import { Logo } from '@/components/ui/organisms/Logo';
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-background p-4">
      <div className="w-full max-w-md mb-8 flex justify-center">
        <Logo className="scale-125" />
      </div>
      <AuthForm onSubmit={handleLogin} />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
