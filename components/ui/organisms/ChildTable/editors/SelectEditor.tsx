'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { CellEditorProps } from './index';
import { EDITOR_BASE } from './editor-styles';
import { cn } from '@/lib/utils';

export function SelectEditor({
  value,
  onSave,
  onCancel,
  column,
  autoFocus = true,
}: CellEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const options = column.selectOptions ?? [];

  useEffect(() => {
    if (autoFocus) {
      setOpen(true);
      const idx = options.findIndex((o) => String(o.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [autoFocus, options, value]);

  useEffect(() => {
    if (open && listRef.current && activeIndex >= 0) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  const handleSelect = useCallback(
    (optionValue: string | number) => {
      onSave(optionValue);
    },
    [onSave],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) next++;
            return next < options.length ? next : prev;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) next--;
            return next >= 0 ? next : prev;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < options.length && !options[activeIndex].disabled) {
            handleSelect(options[activeIndex].value);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < options.length && !options[activeIndex].disabled) {
            handleSelect(options[activeIndex].value);
          } else {
            onCancel();
          }
          break;
      }
    },
    [open, activeIndex, options, handleSelect, onCancel],
  );

  const currentLabel =
    options.find((o) => String(o.value) === String(value))?.label ?? String(value ?? '');

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-label={`Select ${column.label}`}
    >
      <button
        type="button"
        className={cn(
          EDITOR_BASE,
          'flex h-8 w-full items-center justify-between px-2 text-left',
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">{currentLabel || '\u00A0'}</span>
        <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={cn(
            'absolute left-0 top-full z-form mt-0.5',
            'max-h-48 w-full overflow-auto',
            'rounded-[var(--radius)] border border-border bg-popover shadow-medium',
            'py-0.5',
          )}
        >
          {options.map((opt, i) => {
            const selected = String(opt.value) === String(value);
            return (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={selected}
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
                  if (!opt.disabled) handleSelect(opt.value);
                }}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    selected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </li>
            );
          })}
          {options.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">No options</li>
          )}
        </ul>
      )}
    </div>
  );
}
