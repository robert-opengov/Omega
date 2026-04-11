'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/atoms';
import { getAuth0Client } from '@/lib/auth0-client';
import { auth0Config } from '@/config/auth0.config';

export interface SsoLoginButtonProps {
  className?: string;
}

/**
 * Initiates the Auth0 SSO login flow via `loginWithRedirect`.
 * The user is redirected to the Auth0 Universal Login page and
 * returns to `/callback-handler` after authenticating.
 */
export function SsoLoginButton({ className }: SsoLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSsoLogin() {
    setLoading(true);
    try {
      const client = await getAuth0Client();
      await client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: `${window.location.origin}/callback-handler`,
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
    } catch (error) {
      console.error('Error starting SSO login:', error);
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      loading={loading}
      icon={LogIn}
      onClick={handleSsoLogin}
      className={className}
    >
      Sign in with SSO
    </Button>
  );
}

export default SsoLoginButton;
