import { authConfig } from '@/config/auth.config';
import { appConfig } from '@/config/app.config';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';
import { LoginClient } from './_components/LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect = '/home' } = await searchParams;
  const showPasswordLogin = authConfig.loginMode !== 'sso';
  const showSsoLogin = authConfig.loginMode !== 'password';
  const shouldAttemptSilent = showSsoLogin && authConfig.enableSilentLogin;

  return (
    <AuthLayout>
      <LoginClient
        redirectUrl={redirect}
        showPasswordLogin={showPasswordLogin}
        showSsoLogin={showSsoLogin}
        showSignupLink={appConfig.features.enableSignup}
        attemptSilentLogin={shouldAttemptSilent}
      />
    </AuthLayout>
  );
}
