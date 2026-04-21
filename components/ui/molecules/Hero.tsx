'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import Image from 'next/image';
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
  /** URL or path to a background image displayed behind the content. */
  backgroundImage?: string;
  /**
   * How the background image fills the container.
   * @default 'cover'
   */
  backgroundFit?: 'cover' | 'contain';
  /**
   * Focal point — controls which part of the image stays visible when cropped.
   * @default 'center'
   */
  backgroundPosition?: 'top' | 'center' | 'bottom';
  /**
   * Semi-transparent overlay for text readability over images.
   * - `true` — solid dark overlay (`bg-black/50`)
   * - `'gradient'` — left-to-right dark fade
   * - `'brand'` — diagonal primary-color gradient (matches variant="gradient" direction, theme-aware)
   * - any other string — custom Tailwind class
   * @default false
   */
  overlay?: boolean | string;
  className?: string;
}

function resolveOverlay(overlay: HeroProps['overlay']): string | false {
  if (overlay === true) return 'bg-black/50';
  if (overlay === 'gradient') return 'bg-gradient-to-r from-black/70 via-black/40 to-transparent';
  if (overlay === 'brand') return 'bg-gradient-to-br from-primary/95 via-primary/80 to-primary/50';
  if (typeof overlay === 'string') return overlay;
  return false;
}

/**
 * Page hero with title, subtitle, CTAs, optional illustration, and optional
 * background image with overlay support.
 *
 * @example
 * <Hero
 *   title="Welcome"
 *   subtitle="Get started quickly."
 *   primaryAction={{ label: 'Start', href: '/start' }}
 *   variant="image"
 *   backgroundImage="/brand/hero.jpg"
 *   backgroundPosition="top"
 *   overlay
 * />
 */
export function Hero({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  illustration,
  align = 'left',
  variant = 'default',
  backgroundImage,
  backgroundFit = 'cover',
  backgroundPosition = 'center',
  overlay,
  className,
}: Readonly<HeroProps>) {
  const isCenter = align === 'center' && !illustration;
  const hasImage = !!backgroundImage;
  const isImageVariant = variant === 'image' && hasImage;

  const overlayClass = resolveOverlay(overlay);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl px-8 py-12 md:py-16',
        variant === 'gradient' && 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
        variant === 'default' && 'bg-card border border-border',
        variant === 'image' && !hasImage && 'bg-card',
        className,
      )}
    >
      {hasImage && (
        <Image
          src={backgroundImage}
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className={cn(
            backgroundFit === 'contain' ? 'object-contain' : 'object-cover',
            backgroundPosition === 'top' && 'object-top',
            backgroundPosition === 'bottom' && 'object-bottom',
            backgroundPosition === 'center' && 'object-center',
          )}
        />
      )}
      {hasImage && overlayClass && (
        <div className={cn('absolute inset-0', overlayClass)} />
      )}

      <div
        className={cn(
          'flex gap-8',
          hasImage && 'relative z-10',
          illustration ? 'flex-col md:flex-row md:items-center' : '',
          isCenter && 'flex-col items-center text-center',
        )}
      >
        <div className={cn('flex-1 min-w-0', isCenter && 'max-w-2xl')}>
          <h1
            className={cn(
              'text-3xl md:text-4xl font-bold leading-tight tracking-tight',
              isImageVariant ? 'text-white' : 'text-foreground',
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'mt-3 text-lg max-w-xl leading-relaxed',
                isImageVariant ? 'text-white/80' : 'text-muted-foreground',
              )}
            >
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
                  <Button variant={isImageVariant ? 'secondary' : 'outline'} size="lg">
                    {secondaryAction.label}
                  </Button>
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
