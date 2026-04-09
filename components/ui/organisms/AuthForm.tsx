'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label } from '@/components/ui/atoms';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface AuthFormProps {
  /** Called on form submission. Must return `true` on success. */
  onSubmit: (username: string, password: string) => Promise<boolean>;
  className?: string;
}

/**
 * Generic authentication form with Zod validation, accessible error
 * feedback, and password visibility toggle.
 *
 * Uses OpenGov-aligned shadow and radius tokens for the card wrapper.
 *
 * @example
 * <AuthForm onSubmit={async (u, p) => { const ok = await login(u, p); return ok; }} />
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
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {serverError && (
        <div role="alert" className="mb-4 bg-danger-light border border-danger-light-border rounded p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-danger-text">{serverError}</span>
        </div>
      )}
      {success && (
        <div role="status" className="mb-4 bg-success-light border border-success-light-border rounded p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-success-text">Signed in successfully</span>
        </div>
      )}
      <div className="bg-card rounded-2xl shadow-medium p-8 border border-border">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" required>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              {...register('email')}
              className="h-11"
            />
            {errors.email && (
              <p className="text-sm text-danger-text">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" required>Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                disabled={isSubmitting}
                {...register('password')}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 ease-in-out"
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
          <Button type="submit" fullWidth loading={isSubmitting} disabled={success} className="h-11 mt-2">
            {success ? 'Signed in' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AuthForm;
