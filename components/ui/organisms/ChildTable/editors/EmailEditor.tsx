'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Mail } from 'lucide-react';
import type { CellEditorProps } from './index';
import { EDITOR_INPUT, EDITOR_ERROR } from './editor-styles';
import { cn } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailEditor({
  value,
  onChange,
  onSave,
  onCancel,
  onTabSave,
  autoFocus = true,
}: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(String(value ?? ''));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const validate = useCallback((v: string) => {
    if (v.length === 0) return true;
    return EMAIL_REGEX.test(v);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLocalValue(v);
      setInvalid(!validate(v));
      onChange(v);
    },
    [onChange, validate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave(localValue);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onTabSave?.({ value: localValue, shiftKey: e.shiftKey });
      }
    },
    [localValue, onSave, onCancel, onTabSave],
  );

  return (
    <div className="relative w-full">
      <Mail className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="email"
        className={cn(EDITOR_INPUT, 'pl-7', invalid && EDITOR_ERROR)}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(localValue)}
        placeholder="email@example.com"
        aria-label="Edit email"
        aria-invalid={invalid}
      />
    </div>
  );
}
