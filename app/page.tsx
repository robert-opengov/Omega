import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { homeRedirect, loginRedirect } from '@/config/routes.config';
import { authConfig } from '@/config/auth.config';

export default async function RootPage() {
  if (!authConfig.enableAuth) {
    redirect(homeRedirect);
  }

  const user = await getCurrentUser();
  
  if (user) {
    redirect(homeRedirect);
  } else {
    redirect(loginRedirect);
  }
}
