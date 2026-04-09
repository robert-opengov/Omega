'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks';

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  /** @default 'Search...' */
  placeholder?: string;
  /** Debounce delay in ms. @default 300 */
  debounceMs?: number;
  className?: string;
}

/**
 * A search input with debounced value, clear button, and OpenGov-aligned
 * focus/transition patterns.
 *
 * @example
 * <SearchInput onChange={setQuery} placeholder="Search users..." />
 */
export function SearchInput({ value: controlledValue, onChange, placeholder = 'Search...', debounceMs = 300, className }: SearchInputProps) {
  const [internal, setInternal] = useState(controlledValue || '');
  const display = controlledValue !== undefined ? controlledValue : internal;
  const debounced = useDebounce(display, debounceMs);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInternal(v);
    onChange?.(v);
  }, [onChange]);

  const handleClear = useCallback(() => {
    setInternal('');
    onChange?.('');
  }, [onChange]);

  return (
    <div className={cn('relative', className)} role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full pl-9 pr-8 py-2 rounded border border-border bg-background text-sm transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      {display && (
        <button onClick={handleClear} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
