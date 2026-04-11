'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getAuth0Client } from '@/lib/auth0-client';
import { ssoCallbackAction, checkUserExistsAction } from '@/app/actions/auth';
import { useAuth } from '@/providers';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard against StrictMode / HMR double-mount
    if (processed.current) return;
    processed.current = true;

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCallback() {
    try {
      const currentUrl = window.location.href;

      // Must have an authorization code from Auth0
      if (!currentUrl.includes('code=')) {
        router.replace('/login');
        return;
      }

      // 1. Get the Auth0 client and exchange the authorization code
      const client = await getAuth0Client();
      await client.handleRedirectCallback(currentUrl);

      // Clean the URL to prevent duplicate processing on refresh
      window.history.replaceState(
        {},
        document.title,
        window.location.origin + '/callback-handler',
      );

      // 2. Verify authentication succeeded
      const isAuthenticated = await client.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }

      // 3. Get user data and access token from Auth0
      const userData = await client.getUser();
      const token = await client.getTokenSilently();

      if (!userData || !token) {
        throw new Error('Failed to get user data or token');
      }

      // 4. Store tokens in HTTP-only cookies via server action
      const result = await ssoCallbackAction(token, 7200);
      if (!result.success) {
        throw new Error(result.error || 'Failed to store session');
      }

      // 5. Verify user exists in the GAB backend
      const userExists = await checkUserExistsAction(
        token,
        userData.email || '',
      );

      if (!userExists) {
        setError('You are not authorized to access this application.');
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      // 6. Hydrate AuthProvider state from the freshly-set cookies
      await refreshSession();

      // 7. Redirect to the app
      const redirectTo = searchParams.get('redirect') || '/home';
      router.replace(redirectTo);
    } catch (err) {
      console.error('SSO callback error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred during login.',
      );
      setTimeout(() => router.replace('/login'), 3000);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <div className="text-center space-y-2">
          <p className="text-danger text-sm">{error}</p>
          <p className="text-muted-foreground text-xs">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Processing login...</p>
      </div>
    </main>
  );
}

export default function CallbackHandlerPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
