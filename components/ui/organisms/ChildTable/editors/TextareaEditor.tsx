'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CellEditorProps } from './index';
import { EDITOR_BASE } from './editor-styles';
import { cn } from '@/lib/utils';

export function TextareaEditor({
  value,
  onChange,
  onSave,
  onCancel,
  autoFocus = true,
}: CellEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(String(value ?? ''));

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSave(localValue);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [localValue, onSave, onCancel],
  );

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={textareaRef}
        className={cn(
          EDITOR_BASE,
          'min-h-[80px] w-full resize-y px-2 py-1.5',
          'placeholder:text-muted-foreground',
        )}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(localValue)}
        rows={4}
        aria-label="Edit text"
      />
      <span className="text-xs text-muted-foreground">
        Ctrl+Enter to save &middot; Esc to cancel
      </span>
    </div>
  );
}
