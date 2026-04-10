'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label } from '@/components/ui/atoms';
import { UILink } from '@/components/ui/atoms/Link';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  organization: z.string().min(1, 'Organization is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export interface SignupFormProps {
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
    password: string;
  }) => Promise<boolean>;
  className?: string;
  subtitle?: string;
}

const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'One uppercase letter',
  'One lowercase letter',
  'One number or special character',
];

/**
 * Signup form matching Grant Management Figma (170:13147).
 * Renders inside AuthLayout's card slot.
 */
export function SignupForm({ onSubmit, className, subtitle = 'All fields are required.' }: SignupFormProps) {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onFormSubmit = async (data: SignupFormData) => {
    setServerError('');
    setSuccess(false);
    try {
      const ok = await onSubmit(data);
      if (ok) setSuccess(true);
      else setServerError('Could not create account. Please try again.');
    } catch {
      setServerError('An unexpected error occurred.');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[1.2] text-foreground">
          Create an account
        </h1>
        {subtitle && (
          <p className="text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>

      {serverError && (
        <div role="alert" className="bg-danger-light border border-danger-light-border rounded p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-danger-text">{serverError}</span>
        </div>
      )}
      {success && (
        <div role="status" className="bg-success-light border border-success-light-border rounded p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-success-text">Account created successfully</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            disabled={isSubmitting}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-sm text-danger-text">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            disabled={isSubmitting}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-sm text-danger-text">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            disabled={isSubmitting}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-danger-text">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            type="text"
            disabled={isSubmitting}
            {...register('organization')}
          />
          {errors.organization && (
            <p className="text-sm text-danger-text">{errors.organization.message}</p>
          )}
        </div>

        {/* Password requirements */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Password Requirements:</p>
          <ul className="text-xs text-text-secondary space-y-0.5 list-disc list-inside">
            {PASSWORD_REQUIREMENTS.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Create a Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              disabled={isSubmitting}
              {...register('password')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors duration-200"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-danger-text">{errors.password.message}</p>
          )}
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          By creating an account, you agree to our{' '}
          <UILink href="#" display="inline" size="sm" color="muted">Terms of Use</UILink>
          {' '}and{' '}
          <UILink href="#" display="inline" size="sm" color="muted">Privacy Policy</UILink>.
        </p>

        <Button type="submit" fullWidth loading={isSubmitting} disabled={success} className="h-10">
          {success ? 'Account created' : 'Create Account'}
        </Button>
      </form>

      <p className="text-sm text-text-secondary">
        Have an account?{' '}
        <UILink href="/login" display="inline" size="sm">Sign in</UILink>
      </p>
    </div>
  );
}

export default SignupForm;
