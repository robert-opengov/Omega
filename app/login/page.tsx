'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/ui/organisms/AuthForm';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';
import { useAuth } from '@/providers';
import { auth0Config } from '@/config/auth0.config';
import { getAuth0Client } from '@/lib/auth0-client';
import { ssoCallbackAction, checkUserExistsAction } from '@/app/actions/auth';
import { Suspense } from 'react';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/home';

  const [silentLoginInProgress, setSilentLoginInProgress] = useState(
    auth0Config.useExternalLogin,
  );
  const silentLoginAttempted = useRef(false);

  useEffect(() => {
    if (!auth0Config.useExternalLogin) return;
    if (silentLoginAttempted.current) return;
    silentLoginAttempted.current = true;

    // Skip silent login if coming from logout
    if (
      typeof window !== 'undefined' &&
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

      // Silent login succeeded — user has an active Auth0 session
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
      // Expected: `login_required` error when no Auth0 session exists.
      // Silently fall through to show the login form.
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

  // Show a minimal loader while attempting silent login
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
        showSsoLogin={auth0Config.useExternalLogin}
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
