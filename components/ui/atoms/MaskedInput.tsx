'use client';

import { useCallback, useRef, useState, forwardRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface MaskedInputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'onChange' | 'value' | 'type'> {
  /** Mask pattern using # for digits, any other char as literal separator. E.g. "###-####-###.##" */
  mask: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
}

function extractDigits(str: string): string {
  return str.replaceAll(/\D/g, '');
}

function applyMask(digits: string, mask: string): string {
  let result = '';
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[di];
      di++;
    } else {
      result += mask[i];
    }
  }
  return result;
}

function maxDigits(mask: string): number {
  return mask.split('').filter((c) => c === '#').length;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedInput(
  { mask, value: controlledValue, onChange, error = false, disabled = false, placeholder, className, ...rest },
  forwardedRef,
) {
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const value = controlledValue ?? internalValue;
  const max = maxDigits(mask);
  const displayValue = applyMask(extractDigits(value), mask);

  const defaultPlaceholder = placeholder ?? mask.replaceAll('#', '_');

  const ref = (forwardedRef as React.RefObject<HTMLInputElement>) ?? inputRef;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = extractDigits(e.target.value);
      const clamped = raw.slice(0, max);
      const formatted = applyMask(clamped, mask);
      if (controlledValue === undefined) setInternalValue(formatted);
      onChange?.(formatted);
    },
    [mask, max, onChange, controlledValue],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && inputRef.current) {
        const pos = inputRef.current.selectionStart ?? 0;
        if (pos > 0 && mask[pos - 1] !== '#') {
          e.preventDefault();
          const digits = extractDigits(displayValue);
          const newDigits = digits.slice(0, -1);
          const formatted = applyMask(newDigits, mask);
          if (controlledValue === undefined) setInternalValue(formatted);
          onChange?.(formatted);
        }
      }
    },
    [mask, displayValue, onChange, controlledValue],
  );

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={defaultPlaceholder}
      aria-invalid={error || undefined}
      className={cn(
        'flex h-10 w-full rounded border bg-transparent px-3 py-2 text-sm font-mono tracking-wider',
        'transition-colors duration-200',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-danger text-danger-text focus-visible:outline-danger'
          : 'border-input-border text-foreground',
        className,
      )}
      {...rest}
    />
  );
});

export default MaskedInput;
