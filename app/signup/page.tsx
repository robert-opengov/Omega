import { redirect } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import { SignupContent } from './signup-content';

export default function SignupPage() {
  if (!appConfig.features.enableSignup) {
    redirect('/login');
  }

  return <SignupContent />;
}
