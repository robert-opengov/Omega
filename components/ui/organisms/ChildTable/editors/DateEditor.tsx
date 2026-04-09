'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CellEditorProps } from './index';
import { EDITOR_INPUT } from './editor-styles';
import { cn } from '@/lib/utils';

function toDateString(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val.slice(0, 10);
    return d.toISOString().slice(0, 10);
  }
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return '';
}

export function DateEditor({
  value,
  onChange,
  onSave,
  onCancel,
  onTabSave,
  autoFocus = true,
}: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(toDateString(value));

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
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
    <input
      ref={inputRef}
      type="date"
      className={cn(EDITOR_INPUT)}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(localValue)}
      aria-label="Edit date"
    />
  );
}
