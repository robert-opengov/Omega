'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label } from '@/components/ui/atoms';
import { UILink } from '@/components/ui/atoms/Link';
import { AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface AuthFormProps {
  onSubmit: (username: string, password: string) => Promise<boolean>;
  className?: string;
}

/**
 * Sign-in form matching Grant Management Figma (170:13511).
 * Renders inside AuthLayout's card slot.
 */
export function AuthForm({ onSubmit, className }: AuthFormProps) {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onFormSubmit = async (data: LoginFormData) => {
    setServerError('');
    setSuccess(false);
    try {
      const ok = await onSubmit(data.email, data.password);
      if (ok) setSuccess(true);
      else setServerError('Invalid credentials. Please try again.');
    } catch {
      setServerError('An unexpected error occurred.');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <h1 className="text-[28px] font-bold leading-[1.2] text-foreground">
        Sign in
      </h1>

      {serverError && (
        <div role="alert" className="bg-danger-light border border-danger-light-border rounded p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-danger-text">{serverError}</span>
        </div>
      )}
      {success && (
        <div role="status" className="bg-success-light border border-success-light-border rounded p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-success-text">Signed in successfully</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Username or email</Label>
          <Input
            id="email"
            type="text"
            disabled={isSubmitting}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-danger-text">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
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

        <UILink href="#" display="standalone" size="sm" className="inline-flex items-center gap-1">
          Forgot Password <ArrowRight className="h-3.5 w-3.5" />
        </UILink>

        <p className="text-xs text-text-secondary leading-relaxed">
          By continuing, you agree to our{' '}
          <UILink href="#" display="inline" size="sm" color="muted">Terms of Use</UILink>
          {' '}and{' '}
          <UILink href="#" display="inline" size="sm" color="muted">Privacy Policy</UILink>.
        </p>

        <Button type="submit" fullWidth loading={isSubmitting} disabled={success} className="h-10">
          {success ? 'Signed in' : 'Continue'}
        </Button>
      </form>

      <p className="text-sm text-text-secondary">
        {"Don't have an account? "}
        <UILink href="/signup" display="inline" size="sm">Sign up</UILink>
      </p>
    </div>
  );
}

export default AuthForm;
