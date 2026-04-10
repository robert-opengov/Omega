'use client';

import { forwardRef, type ButtonHTMLAttributes, type ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from './Tooltip';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon component to render. */
  icon: ElementType;
  /** Accessible label (also used as tooltip text). */
  label: string;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** @default 'ghost' */
  variant?: 'ghost' | 'outline' | 'primary';
}

const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
const iconSizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
const variantMap = {
  ghost: 'hover:bg-action-hover-primary text-muted-foreground hover:text-foreground',
  outline: 'border border-border hover:bg-action-hover-primary text-muted-foreground hover:text-foreground',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
};

/**
 * A square icon-only button wrapped in a {@link Tooltip}.
 *
 * @example
 * <IconButton icon={TrashIcon} label="Delete" variant="outline" />
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, size = 'md', variant = 'ghost', className, ...props }, ref) => {
    return (
      <Tooltip content={label}>
        <button
          ref={ref}
          aria-label={label}
          className={cn(
            'inline-flex items-center justify-center rounded transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50',
            sizeMap[size],
            variantMap[variant],
            className
          )}
          {...props}
        >
          <Icon className={iconSizeMap[size]} />
        </button>
      </Tooltip>
    );
  }
);
IconButton.displayName = 'IconButton';

export { IconButton };
export default IconButton;
