import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { homeRedirect, loginRedirect } from '@/config/routes.config';

export default async function RootPage() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect(homeRedirect);
  } else {
    redirect(loginRedirect);
  }
}
