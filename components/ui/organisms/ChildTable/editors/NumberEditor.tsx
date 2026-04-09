'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CellEditorProps } from './index';
import { EDITOR_INPUT } from './editor-styles';
import { cn } from '@/lib/utils';

export function NumberEditor({
  value,
  onChange,
  onSave,
  onCancel,
  onTabSave,
  column,
  autoFocus = true,
}: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(String(value ?? ''));

  const step = column.type === 'integer' ? '1' : 'any';

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const parseNumber = useCallback(
    (raw: string): number | null => {
      if (raw.trim() === '') return null;
      const n = column.type === 'integer' ? parseInt(raw, 10) : parseFloat(raw);
      return Number.isNaN(n) ? null : n;
    },
    [column.type],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange(parseNumber(e.target.value));
    },
    [onChange, parseNumber],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave(parseNumber(localValue));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onTabSave?.({ value: parseNumber(localValue), shiftKey: e.shiftKey });
      }
    },
    [localValue, parseNumber, onSave, onCancel, onTabSave],
  );

  return (
    <input
      ref={inputRef}
      type="number"
      step={step}
      className={cn(EDITOR_INPUT)}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(parseNumber(localValue))}
      aria-label="Edit number"
    />
  );
}
