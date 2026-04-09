'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Phone } from 'lucide-react';
import type { CellEditorProps } from './index';
import { EDITOR_INPUT } from './editor-styles';
import { cn } from '@/lib/utils';

export function PhoneEditor({
  value,
  onChange,
  onSave,
  onCancel,
  onTabSave,
  autoFocus = true,
}: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(String(value ?? ''));

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange(e.target.value);
    },
    [onChange],
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
      <Phone className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="tel"
        className={cn(EDITOR_INPUT, 'pl-7')}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(localValue)}
        placeholder="+1 (555) 000-0000"
        aria-label="Edit phone number"
      />
    </div>
  );
}
