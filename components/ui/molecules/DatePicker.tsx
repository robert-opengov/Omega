'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/atoms';

export interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
}

/**
 * A native date input with optional label and error state.
 *
 * @example
 * <DatePicker label="Start date" value={date} onChange={setDate} />
 *
 * @example
 * <DatePicker label="Deadline" required error="Required" />
 */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, error, required, disabled, min, max, className, id }, ref) => {
    const fieldId = id || (label ? label.toLowerCase().replaceAll(/\s+/g, '-') : 'date-picker');
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <Label htmlFor={fieldId} required={required}>{label}</Label>}
        <input
          ref={ref}
          id={fieldId}
          type="date"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          min={min}
          max={max}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            'w-full px-3 py-2 rounded border text-sm transition-all duration-200 ease-in-out bg-background text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            error && 'border-destructive focus-visible:outline-destructive',
            !error && 'border-input-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {error && <p id={`${fieldId}-error`} className="text-xs text-destructive" role="alert">{error}</p>}
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
export default DatePicker;
