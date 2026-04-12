'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/ui/organisms/AuthForm';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';
import { useAuth } from '@/providers';
import { getAuth0Client } from '@/lib/auth0-client';
import { ssoCallbackAction, checkUserExistsAction } from '@/app/actions/auth';

function LoginContent() {
  const { login, isSsoEnabled, isPasswordEnabled, enableSilentLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/home';

  const shouldAttemptSilentLogin = isSsoEnabled && enableSilentLogin;

  const [silentLoginInProgress, setSilentLoginInProgress] = useState(shouldAttemptSilentLogin);
  const silentLoginAttempted = useRef(false);

  useEffect(() => {
    if (!shouldAttemptSilentLogin) return;
    if (silentLoginAttempted.current) return;
    silentLoginAttempted.current = true;

    if (
      globalThis.window !== undefined &&
      sessionStorage.getItem('fromLogoutRoute') === '1'
    ) {
      sessionStorage.removeItem('fromLogoutRoute');
      setSilentLoginInProgress(false);
      return;
    }

    attemptSilentLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attemptSilentLogin() {
    try {
      const client = await getAuth0Client();
      const token = await client.getTokenSilently();

      const userData = await client.getUser();
      const result = await ssoCallbackAction(token, 7200);

      if (result.success && userData?.email) {
        const userExists = await checkUserExistsAction(token, userData.email);
        if (userExists) {
          router.replace(redirectUrl);
          return;
        }
      }
    } catch {
      // Expected: `login_required` when no Auth0 session exists.
    }
    setSilentLoginInProgress(false);
  }

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);
    if (result.success) {
      router.push(redirectUrl);
      return true;
    }
    return false;
  };

  if (silentLoginInProgress) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <AuthLayout>
      <AuthForm
        onSubmit={handleLogin}
        showPasswordLogin={isPasswordEnabled}
        showSsoLogin={isSsoEnabled}
      />
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
