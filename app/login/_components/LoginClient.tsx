'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/ui/organisms/AuthForm';
import { useAuth } from '@/providers';

const SILENT_LOGIN_TIMEOUT_MS = 2500;

interface LoginClientProps {
  readonly redirectUrl: string;
  readonly showPasswordLogin: boolean;
  readonly showSsoLogin: boolean;
  readonly showSignupLink: boolean;
  readonly attemptSilentLogin: boolean;
}

type RouterInstance = ReturnType<typeof useRouter>;

async function trySilentLogin(redirectUrl: string, router: RouterInstance): Promise<void> {
  const { getAuth0Client } = await import('@/lib/auth0-client');
  const { ssoCallbackAction, checkUserExistsAction } = await import('@/app/actions/auth');
  const client = await getAuth0Client();

  const token = await Promise.race([
    client.getTokenSilently(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('silent_login_timeout')), SILENT_LOGIN_TIMEOUT_MS),
    ),
  ]);

  const userData = await client.getUser();
  const result = await ssoCallbackAction(token, 7200);

  if (result.success && userData?.email && (await checkUserExistsAction(token, userData.email))) {
    router.replace(redirectUrl);
  }
}

export function LoginClient({
  redirectUrl,
  showPasswordLogin,
  showSsoLogin,
  showSignupLink,
  attemptSilentLogin,
}: LoginClientProps) {
  const { login } = useAuth();
  const router = useRouter();
  const attempted = useRef(false);
  const [silentBannerVisible, setSilentBannerVisible] = useState(attemptSilentLogin);

  useEffect(() => {
    if (!attemptSilentLogin || attempted.current) return;
    attempted.current = true;

    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('fromLogoutRoute') === '1') {
      sessionStorage.removeItem('fromLogoutRoute');
      setSilentBannerVisible(false);
      return;
    }

    const hardTimeout = setTimeout(() => setSilentBannerVisible(false), SILENT_LOGIN_TIMEOUT_MS);

    trySilentLogin(redirectUrl, router)
      .catch(() => {
        // login_required or timeout — fall through and show the form
      })
      .finally(() => {
        clearTimeout(hardTimeout);
        setSilentBannerVisible(false);
      });

    return () => clearTimeout(hardTimeout);
  }, [attemptSilentLogin, redirectUrl, router]);

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);
    if (result.success) {
      router.push(redirectUrl);
      return true;
    }
    return false;
  };

  return (
    <>
      {silentBannerVisible && (
        <div role="status" aria-live="polite" className="mb-4 text-xs text-text-secondary">
          Checking for existing session...
        </div>
      )}
      <AuthForm
        onSubmit={handleLogin}
        showPasswordLogin={showPasswordLogin}
        showSsoLogin={showSsoLogin}
        showSignupLink={showSignupLink}
      />
    </>
  );
}
