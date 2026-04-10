'use client';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/organisms/Logo';
import { UILink } from '@/components/ui/atoms/Link';
import { appConfig } from '@/config/app.config';

const DEFAULT_HERO = process.env.NEXT_PUBLIC_LOGIN_HERO_IMAGE || '/brand/login.png';

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  heroImage?: string;
}

/**
 * Split-screen auth layout matching the Grant Management Figma.
 * Left: form inside a white card on gray background. Right: full-bleed hero photo.
 * On mobile the hero is hidden and the form takes full width.
 */
export function AuthLayout({ children, className, heroImage = DEFAULT_HERO }: AuthLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <div className={cn('flex min-h-screen bg-muted', className)}>
      {/* ---- Form side (left) ---- */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Logo -- top-left, outside the card */}
        <div className="px-8 pt-6 pb-2">
          <Logo className="h-7" />
          <span className="block text-xs text-text-secondary mt-0.5">
            {appConfig.name}
          </span>
        </div>

        {/* Centered form card */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12">
          <div className="w-full max-w-[420px] bg-card rounded-lg shadow-medium p-8 sm:p-10">
            {children}
          </div>
        </div>

        {/* Footer -- copyright + legal links */}
        <div className="px-8 py-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span>&copy; {year} {appConfig.name}</span>
          <span className="hidden sm:inline" aria-hidden="true">|</span>
          <UILink href="#" size="sm" color="muted" display="inline">Terms of Use</UILink>
          <UILink href="#" size="sm" color="muted" display="inline">Privacy Policy</UILink>
          <UILink href="#" size="sm" color="muted" display="inline" className="hidden sm:inline-flex">Accessibility Statement</UILink>
        </div>
      </div>

      {/* ---- Hero side (right) — 24px padding, 24px border-radius per Figma ---- */}
      <div className="hidden lg:block lg:w-1/2 p-6 self-stretch">
        <div className="relative h-full w-full rounded-3xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-75"
          />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
