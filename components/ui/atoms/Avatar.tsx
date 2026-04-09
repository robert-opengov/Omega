'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium overflow-hidden',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Image source URL for the avatar. */
  src?: string;
  /** Alt text for the avatar image. */
  alt?: string;
  /** Fallback name used to generate initials when no image is available. */
  fallback?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * A circular avatar component with image support and initial fallback.
 *
 * @example
 * <Avatar src="/photo.jpg" alt="John Doe" />
 *
 * @example
 * <Avatar fallback="Jane Smith" size="lg" />
 */
export function Avatar({ src, alt, fallback, size, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={cn(avatarVariants({ size }), className)} role="img" aria-label={alt || fallback || 'Avatar'}>
      {src && !imgError ? (
        <img src={src} alt={alt || ''} className="h-full w-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <span>{fallback ? getInitials(fallback) : '?'}</span>
      )}
    </div>
  );
}

export default Avatar;
