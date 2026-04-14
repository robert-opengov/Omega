'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface HeroAction {
  label: string;
  href: string;
}

export interface HeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  illustration?: ReactNode;
  align?: 'left' | 'center';
  variant?: 'default' | 'gradient' | 'image';
  className?: string;
}

export function Hero({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  illustration,
  align = 'left',
  variant = 'default',
  className,
}: Readonly<HeroProps>) {
  const isCenter = align === 'center' && !illustration;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl px-8 py-12 md:py-16',
        variant === 'gradient' && 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
        variant === 'default' && 'bg-card border border-border',
        variant === 'image' && 'bg-card',
        className,
      )}
    >
      <div
        className={cn(
          'flex gap-8',
          illustration ? 'flex-col md:flex-row md:items-center' : '',
          isCenter && 'flex-col items-center text-center',
        )}
      >
        <div className={cn('flex-1 min-w-0', isCenter && 'max-w-2xl')}>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-lg text-muted-foreground max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {(primaryAction || secondaryAction) && (
            <div className={cn('mt-6 flex gap-3 flex-wrap', isCenter && 'justify-center')}>
              {primaryAction && (
                <Link href={primaryAction.href}>
                  <Button variant="primary" size="lg">{primaryAction.label}</Button>
                </Link>
              )}
              {secondaryAction && (
                <Link href={secondaryAction.href}>
                  <Button variant="outline" size="lg">{secondaryAction.label}</Button>
                </Link>
              )}
            </div>
          )}
        </div>
        {illustration && (
          <div className="shrink-0 flex items-center justify-center md:w-[320px]" aria-hidden="true">
            {illustration}
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;
