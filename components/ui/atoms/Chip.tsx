'use client';

import { forwardRef, type HTMLAttributes, type ElementType, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Chip variant styles aligned with CDS-37 design system.
 *
 * Four visual styles: default (filled), outlined, minimal, and strong.
 */
const chipVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold tracking-[0.0125em] transition-all duration-200 ease-in-out rounded select-none',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground',
        outlined: 'bg-transparent border border-border text-foreground',
        minimal: 'bg-transparent text-muted-foreground',
        strong: 'bg-foreground text-background',
      },
      size: {
        xs: 'h-5 px-1.5 text-[0.625rem]',
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-xs',
        lg: 'h-10 px-4 text-sm',
      },
      color: {
        neutral: '',
        primary: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'default', color: 'primary', className: 'bg-primary/10 text-primary' },
      { variant: 'default', color: 'success', className: 'bg-success-light text-success-text' },
      { variant: 'default', color: 'warning', className: 'bg-warning-light text-warning-text' },
      { variant: 'default', color: 'danger', className: 'bg-danger-light text-danger-text' },
      { variant: 'default', color: 'info', className: 'bg-info-light text-info-text' },
      { variant: 'outlined', color: 'primary', className: 'border-primary/40 text-primary' },
      { variant: 'outlined', color: 'success', className: 'border-success/40 text-success-text' },
      { variant: 'outlined', color: 'warning', className: 'border-warning/40 text-warning-text' },
      { variant: 'outlined', color: 'danger', className: 'border-destructive/40 text-danger-text' },
      { variant: 'outlined', color: 'info', className: 'border-info/40 text-info-text' },
      { variant: 'strong', color: 'primary', className: 'bg-primary text-primary-foreground' },
      { variant: 'strong', color: 'success', className: 'bg-success text-white' },
      { variant: 'strong', color: 'warning', className: 'bg-warning text-white' },
      { variant: 'strong', color: 'danger', className: 'bg-destructive text-white' },
      { variant: 'strong', color: 'info', className: 'bg-info text-white' },
    ],
    defaultVariants: { variant: 'default', size: 'md', color: 'neutral', disabled: false },
  }
);

export interface ChipProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof chipVariants> {
  /** Text label for the chip. */
  label: string;
  /** Optional leading icon component. */
  icon?: ElementType;
  /** Optional avatar element rendered before the label. */
  avatar?: ReactNode;
  /** When provided, renders a dismiss button and calls this handler on click. */
  onDelete?: () => void;
  disabled?: boolean;
}

/**
 * A standalone chip for categorizing, filtering, or tagging content.
 *
 * Unlike Badge (status indicator) or TagInput (multi-value field),
 * Chip is an interactive pill that can be dismissed or used as a filter.
 *
 * @example
 * <Chip label="Engineering" />
 *
 * @example
 * <Chip label="Active" color="success" variant="outlined" onDelete={() => {}} />
 *
 * @example
 * <Chip label="Jane" avatar={<Avatar size="sm" fallback="J" />} />
 */
const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ label, icon: Icon, avatar, onDelete, variant, size, color, disabled, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(chipVariants({ variant, size, color, disabled: !!disabled }), className)}
        {...props}
      >
        {avatar && <span className="flex -ml-0.5 shrink-0">{avatar}</span>}
        {!avatar && Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
        {onDelete && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex items-center justify-center shrink-0 -mr-0.5 h-4 w-4 rounded hover:bg-foreground/10 transition-colors duration-200"
            aria-label={`Remove ${label}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };
export default Chip;
