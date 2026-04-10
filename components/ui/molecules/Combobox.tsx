'use client';

import { useState, useMemo, useRef } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/use-click-outside';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** @default 'Select...' */
  placeholder?: string;
  /** @default true */
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * A searchable dropdown combobox with CDS-37-aligned shadows and transitions.
 *
 * @example
 * <Combobox
 *   options={[{ label: 'Option 1', value: '1' }]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 */
export function Combobox({ options, value, onChange, placeholder = 'Select...', searchable = true, disabled, className }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="combobox-label"
        id="combobox-trigger"
        className={cn(
          'flex w-full items-center justify-between rounded border border-input-border bg-background px-3 py-2 text-sm transition-all duration-200 ease-in-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          disabled && 'opacity-50 cursor-not-allowed',
          !selected && 'text-muted-foreground'
        )}
      >
        <span id="combobox-label" className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-[var(--z-dropdown)] mt-1 w-full rounded border border-border bg-card shadow-medium overflow-hidden">
          {searchable && (
            <div className="flex items-center border-b border-border px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent py-2 px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoFocus
                aria-label="Search options"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto p-1" role="listbox" aria-labelledby="combobox-label">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground" id="combobox-empty">No options found.</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => { onChange?.(option.value); setOpen(false); setQuery(''); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-action-hover-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-all duration-200 ease-in-out',
                    option.value === value && 'bg-action-hover-primary'
                  )}
                >
                  <Check className={cn('h-3.5 w-3.5', option.value === value ? 'opacity-100 text-primary' : 'opacity-0')} />
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Combobox;
