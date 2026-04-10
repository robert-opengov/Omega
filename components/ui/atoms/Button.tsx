'use client';

import { forwardRef, type ButtonHTMLAttributes, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-dark',
        secondary:
          'bg-background text-foreground border border-border hover:bg-action-hover-primary hover:border-primary/30',
        outline:
          'bg-background text-foreground border border-border hover:bg-action-hover-primary',
        danger:
          'bg-destructive text-destructive-foreground hover:brightness-90',
        ghost:
          'bg-transparent hover:bg-action-hover-primary text-muted-foreground hover:text-foreground',
        link:
          'bg-transparent text-primary hover:text-primary/80 underline-offset-4 hover:underline p-0',
      },
      size: {
        sm: 'h-6 px-2 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded',
        lg: 'h-10 px-4 text-base rounded',
        icon: 'h-8 w-8 p-0 rounded',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * If true, shows a loading spinner and disables the button.
   * @default false
   */
  loading?: boolean;
  /**
   * Optional icon component to display on the left side of the text.
   */
  icon?: ElementType;
  /**
   * Optional icon component to display on the right side of the text.
   */
  iconRight?: ElementType;
  /**
   * If true, the button will take up the full width of its container.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * If true, merges its props onto its immediate child.
   * @default false
   */
  asChild?: boolean;
}

/**
 * Accessible button component aligned with CDS-37 design system.
 *
 * @example
 * <Button>Submit</Button>
 *
 * @example
 * <Button variant="secondary" icon={PlusIcon}>Add Item</Button>
 *
 * @example
 * <Button variant="danger" loading={isDeleting}>Delete</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, icon: Icon, iconRight: IconRight, fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {size !== 'icon' && children && <span>Loading...</span>}
          </>
        ) : (
          <>
            {Icon && <Icon className="h-4 w-4" />}
            {children && <span>{children}</span>}
            {IconRight && <IconRight className="h-4 w-4" />}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
