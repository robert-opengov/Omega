'use client';

import { forwardRef, type ButtonHTMLAttributes, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button variant styles aligned with OpenGov Capital Design System DNA.
 *
 * Key visual differences from generic Tailwind buttons:
 * - **Inset box-shadow gradients** on primary/secondary/danger for subtle depth
 * - **`font-medium` (500)** instead of semibold — matches OpenGov `$font-weight-medium`
 * - **`duration-300`** transitions — matches OpenGov `$transition-natural`
 * - **Outline-based focus** with 2px offset — matches OpenGov `focus-default` mixin
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium tracking-[0.0125em] transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground border border-primary/80 shadow-[inset_0_2em_1.8em_-1em_hsl(var(--primary-h)_var(--primary-s)_calc(var(--primary-l)+15%)_/_0.7)] hover:shadow-[inset_0_1em_1em_-1em_hsl(var(--primary-h)_var(--primary-s)_calc(var(--primary-l)+15%)_/_0.7)] active:shadow-inset-dark',
        secondary:
          'bg-background text-foreground border border-border shadow-[inset_0_-2em_1.8em_-1em_var(--muted)] hover:border-muted-foreground hover:shadow-[inset_0_-1em_1em_-1em_var(--muted)]',
        outline:
          'bg-background hover:bg-muted text-foreground border border-border shadow-above',
        danger:
          'bg-destructive text-destructive-foreground border border-destructive/80 shadow-[inset_0_2em_1.8em_-1em_hsl(var(--danger-h)_var(--danger-s)_calc(var(--danger-l)+10%)_/_0.5)] hover:shadow-[inset_0_1em_1em_-1em_hsl(var(--danger-h)_var(--danger-s)_calc(var(--danger-l)+10%)_/_0.5)] active:shadow-inset-dark',
        ghost:
          'bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground',
        link:
          'bg-transparent text-primary hover:text-primary/80 underline-offset-4 hover:underline p-0 shadow-none',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded',
        md: 'h-10 px-4 text-sm rounded',
        lg: 'h-12 px-6 text-base rounded-md',
        icon: 'h-10 w-10 p-0 rounded',
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
 * A highly customizable, accessible button component aligned with
 * OpenGov Capital Design System visual DNA.
 *
 * Features inset box-shadow gradients for depth, OpenGov-style focus
 * outlines, and full dark/light mode support via HSL design tokens.
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
