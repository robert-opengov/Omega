'use client';

import { forwardRef, useCallback, type InputHTMLAttributes } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'size'> {
  /** Current numeric value. */
  value?: number;
  /** Called when the value changes via stepper or direct input. */
  onChange?: (value: number) => void;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Increment/decrement step. @default 1 */
  step?: number;
  /** Error message. When provided, renders an error state. */
  error?: string;
  /** Visual size of the input. */
  size?: 'sm' | 'md';
  /** Accessible label for the decrease button. @default 'Decrease' */
  decreaseLabel?: string;
  /** Accessible label for the increase button. @default 'Increase' */
  increaseLabel?: string;
}

/**
 * A number input with increment/decrement stepper buttons.
 *
 * Aligned with CDS-37 TextFieldNumber: compact steppers, shared
 * border styling, full keyboard support for arrow keys.
 *
 * @example
 * <NumberInput value={5} onChange={setValue} min={0} max={100} />
 *
 * @example
 * <NumberInput value={qty} onChange={setQty} step={5} error="Too many" />
 */
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value = 0, onChange, min, max, step = 1, error, disabled, size = 'md', decreaseLabel = 'Decrease', increaseLabel = 'Increase', className, id, ...props }, ref) => {
    const clamp = useCallback(
      (v: number) => {
        let clamped = v;
        if (min !== undefined) clamped = Math.max(min, clamped);
        if (max !== undefined) clamped = Math.min(max, clamped);
        return clamped;
      },
      [min, max]
    );

    const handleIncrement = () => onChange?.(clamp(value + step));
    const handleDecrement = () => onChange?.(clamp(value - step));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseFloat(e.target.value);
      if (!Number.isNaN(parsed)) onChange?.(clamp(parsed));
    };

    const isSm = size === 'sm';
    const atMin = min !== undefined && value <= min;
    const atMax = max !== undefined && value >= max;

    const stepperClass = cn(
      'flex items-center justify-center shrink-0 border-input-border text-muted-foreground transition-colors duration-200',
      'hover:bg-action-hover-primary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed',
      'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
      isSm ? 'w-7 h-7' : 'w-9 h-9'
    );

    return (
      <div className={cn('inline-flex', className)}>
        <div
          className={cn(
            'inline-flex items-center rounded border bg-background transition-all duration-200',
            error ? 'border-destructive' : 'border-input-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || atMin}
            aria-label={decreaseLabel}
            className={cn(stepperClass, 'rounded-l border-r')}
          >
            <Minus className={isSm ? 'h-3 w-3' : 'h-4 w-4'} />
          </button>
          <input
            ref={ref}
            id={id}
            type="number"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            aria-invalid={!!error || undefined}
            className={cn(
              'w-16 text-center bg-transparent text-foreground font-medium border-none focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              isSm ? 'h-7 text-xs' : 'h-9 text-sm'
            )}
            {...props}
          />
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || atMax}
            aria-label={increaseLabel}
            className={cn(stepperClass, 'rounded-r border-l')}
          >
            <Plus className={isSm ? 'h-3 w-3' : 'h-4 w-4'} />
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

export { NumberInput };
export default NumberInput;
