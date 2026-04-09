'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:bg-muted text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        outline: 'border border-border bg-transparent hover:bg-muted text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
      },
      size: {
        sm: 'h-8 px-2.5',
        md: 'h-10 px-3',
        lg: 'h-12 px-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof toggleVariants> {
  /** Controlled pressed state. */
  pressed?: boolean;
  /** Callback when the toggle is pressed or released. */
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * A two-state toggle button (on/off) with OpenGov-aligned transitions and focus.
 *
 * @example
 * <Toggle pressed={isBold} onPressedChange={setIsBold}>
 *   <BoldIcon className="h-4 w-4" />
 * </Toggle>
 */
const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, variant, size, pressed, onPressedChange, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={pressed}
        data-state={pressed ? 'on' : 'off'}
        className={cn(toggleVariants({ variant, size, className }))}
        onClick={() => onPressedChange?.(!pressed)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle, toggleVariants };
export default Toggle;
