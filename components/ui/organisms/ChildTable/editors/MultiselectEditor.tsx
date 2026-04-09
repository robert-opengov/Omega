'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import type { CellEditorProps } from './index';
import { EDITOR_BASE } from './editor-styles';
import { cn } from '@/lib/utils';

function parseSelection(value: unknown): Set<string> {
  if (Array.isArray(value)) return new Set(value.map(String));
  if (typeof value === 'string' && value.length > 0) {
    return new Set(value.split(',').map((s) => s.trim()));
  }
  return new Set();
}

export function MultiselectEditor({
  value,
  onSave,
  onCancel,
  column,
  autoFocus = true,
}: CellEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(() => parseSelection(value));
  const [activeIndex, setActiveIndex] = useState(0);
  const options = column.selectOptions ?? [];

  useEffect(() => {
    if (autoFocus) containerRef.current?.focus();
  }, [autoFocus]);

  const toggle = useCallback((optValue: string | number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(optValue);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const saveResult = useMemo(() => Array.from(selected).join(', '), [selected]);

  const handleDone = useCallback(() => {
    onSave(saveResult);
  }, [onSave, saveResult]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (options[activeIndex] && !options[activeIndex].disabled) {
            toggle(options[activeIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
        case 'Tab':
          e.preventDefault();
          handleDone();
          break;
      }
    },
    [activeIndex, options, toggle, onCancel, handleDone],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        EDITOR_BASE,
        'flex w-full flex-col overflow-hidden p-0',
        'min-w-[180px]',
      )}
      tabIndex={0}
      role="listbox"
      aria-multiselectable="true"
      aria-label={`Select ${column.label}`}
      onKeyDown={handleKeyDown}
    >
      <ul className="max-h-48 overflow-auto py-0.5">
        {options.map((opt, i) => {
          const checked = selected.has(String(opt.value));
          return (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={checked}
              aria-disabled={opt.disabled}
              data-active={i === activeIndex}
              className={cn(
                'flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm',
                'transition-colors duration-150',
                i === activeIndex && 'bg-accent text-accent-foreground',
                opt.disabled && 'pointer-events-none opacity-50',
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!opt.disabled) toggle(opt.value);
              }}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border',
                  checked && 'bg-primary border-primary',
                )}
              >
                {checked && <Check className="h-3 w-3 text-primary-foreground" />}
              </span>
              <span className="truncate">{opt.label}</span>
            </li>
          );
        })}
        {options.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-muted-foreground">No options</li>
        )}
      </ul>

      <div className="flex items-center justify-end border-t border-border px-2 py-1.5">
        <button
          type="button"
          className={cn(
            'rounded-[var(--radius-button)] bg-primary px-3 py-1 text-xs font-medium text-primary-foreground',
            'transition-colors duration-150 hover:opacity-90',
            'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            handleDone();
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
