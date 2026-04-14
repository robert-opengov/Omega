'use client';

import { forwardRef, type ElementType, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const selectionCardVariants = cva(
  'relative flex flex-col items-start gap-2 rounded border p-4 min-h-[116px] text-left transition-all duration-200 ease-in-out cursor-pointer w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      selected: {
        false: 'bg-card border-border hover:border-primary/40 hover:shadow-soft',
        true: 'bg-primary-light border-primary shadow-soft',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: { selected: false, disabled: false },
  },
);

export interface SelectionCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'title'>,
    VariantProps<typeof selectionCardVariants> {
  /** Icon component rendered above the title. */
  icon?: ElementType;
  /** Custom leading content rendered instead of the icon. */
  leading?: ReactNode;
  /** Card title. */
  title: ReactNode;
  /** Short description below the title. */
  description?: ReactNode;
  /** Controlled selected state. */
  selected?: boolean;
  /** Called when the card is clicked. */
  onSelect?: () => void;
  disabled?: boolean;
}

/**
 * A selectable card primitive used for option-picking UIs
 * (e.g. role selection in onboarding wizards).
 *
 * Renders as a `<button>` with `role="radio"` for native keyboard + a11y support.
 * Wrap a group of SelectionCards in a container with `role="radiogroup"`
 * and an accessible label for proper semantics.
 *
 * @example
 * <div role="radiogroup" aria-label="Select your role">
 *   <SelectionCard
 *     icon={ClipboardEdit}
 *     title="Grant Administrator"
 *     description="I manage day-to-day compliance and reporting."
 *     selected={role === 'admin'}
 *     onSelect={() => setRole('admin')}
 *   />
 * </div>
 */
const SelectionCard = forwardRef<HTMLButtonElement, SelectionCardProps>(
  ({ icon: Icon, leading, title, description, selected = false, onSelect, disabled = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={onSelect}
        className={cn(selectionCardVariants({ selected, disabled: !!disabled }), className)}
        {...props}
      >
        {leading ?? (Icon && <Icon className="h-4 w-4 text-foreground shrink-0" />)}
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold leading-5 tracking-[-0.2px] text-foreground">
            {title}
          </span>
          {description && (
            <span className="text-xs leading-4 tracking-[0.17px] text-text-secondary">
              {description}
            </span>
          )}
        </div>
      </button>
    );
  },
);
SelectionCard.displayName = 'SelectionCard';

export { SelectionCard, selectionCardVariants };
export default SelectionCard;
