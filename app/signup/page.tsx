'use client';

import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/ui/organisms/SignupForm';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
    password: string;
  }) => {
    // Placeholder: replace with real registration API call
    console.log('Signup:', data);
    router.push('/login?registered=1');
    return true;
  };

  return (
    <AuthLayout>
      <SignupForm onSubmit={handleSignup} />
    </AuthLayout>
  );
}
