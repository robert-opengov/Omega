import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthForm } from '@/components/ui/organisms/AuthForm';

const noop = async () => false;

describe('AuthForm — defense-in-depth guard', () => {
  it('falls back to password form when both flags are false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AuthForm onSubmit={noop} showPasswordLogin={false} showSsoLogin={false} />,
    );

    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      'AuthForm rendered with no login methods enabled. Falling back to password.',
    );

    warnSpy.mockRestore();
  });

  it('renders only SSO when showPasswordLogin=false and showSsoLogin=true', () => {
    render(
      <AuthForm onSubmit={noop} showPasswordLogin={false} showSsoLogin={true} />,
    );

    expect(screen.queryByLabelText('Username or email')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with sso/i })).toBeInTheDocument();
  });

  it('renders only password when showPasswordLogin=true and showSsoLogin=false', () => {
    render(
      <AuthForm onSubmit={noop} showPasswordLogin={true} showSsoLogin={false} />,
    );

    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in with sso/i })).not.toBeInTheDocument();
  });

  it('renders both when both flags are true', () => {
    render(
      <AuthForm onSubmit={noop} showPasswordLogin={true} showSsoLogin={true} />,
    );

    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with sso/i })).toBeInTheDocument();
  });
});
