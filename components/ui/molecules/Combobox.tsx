'use client';

import { useState, useMemo, useRef, useId, useCallback, useEffect, type KeyboardEvent } from 'react';
import { ChevronDown, Check, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/use-click-outside';
import { Spinner } from '@/components/ui/atoms/Spinner';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Multi-select mode: value is comma-separated IDs (or use `values`/`onValuesChange`) */
  multiple?: boolean;
  /** Selected values for multi-select mode */
  values?: string[];
  /** Callback for multi-select mode */
  onValuesChange?: (values: string[]) => void;
  /** @default 'Select...' */
  placeholder?: string;
  /** @default true */
  searchable?: boolean;
  /** Show loading spinner in dropdown for async options */
  loading?: boolean;
  /** Called when the search query changes (for server-side filtering) */
  onSearchChange?: (query: string) => void;
  /** Error message for form integration */
  error?: string;
  /** Name attribute for hidden input (form submission) */
  name?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  multiple = false,
  values = [],
  onValuesChange,
  placeholder = 'Select...',
  searchable = true,
  loading = false,
  onSearchChange,
  error,
  name,
  disabled,
  className,
}: ComboboxProps) {
  const instanceId = useId();
  const listboxId = `${instanceId}-listbox`;
  const triggerId = `${instanceId}-trigger`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => { setOpen(false); setQuery(''); });

  const filtered = useMemo(() => {
    if (!query || onSearchChange) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  }, [options, query, onSearchChange]);

  const selected = options.find((o) => o.value === value);

  const selectedValues = useMemo(() => {
    if (!multiple) return [];
    return values;
  }, [multiple, values]);

  const selectedLabels = useMemo(() => {
    if (!multiple) return [];
    return options.filter((o) => selectedValues.includes(o.value));
  }, [multiple, options, selectedValues]);

  const handleSearchChange = useCallback((q: string) => {
    setQuery(q);
    setActiveIndex(-1);
    onSearchChange?.(q);
  }, [onSearchChange]);

  const handleSelect = useCallback((optionValue: string) => {
    if (multiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onValuesChange?.(next);
    } else {
      onChange?.(optionValue);
      setOpen(false);
      setQuery('');
    }
  }, [multiple, selectedValues, onValuesChange, onChange]);

  const removeValue = useCallback((val: string) => {
    onValuesChange?.(selectedValues.filter((v) => v !== val));
  }, [selectedValues, onValuesChange]);

  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) {
      setActiveIndex(-1);
      setQuery('');
    }
  }, [open, searchable]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          handleSelect(filtered[activeIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
    }
  };

  const activeDescendant = activeIndex >= 0 ? `${instanceId}-option-${activeIndex}` : undefined;

  const triggerLabel = multiple
    ? (selectedLabels.length > 0 ? `${selectedLabels.length} selected` : placeholder)
    : (selected?.label || placeholder);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {name && (
        <input type="hidden" name={name} value={multiple ? selectedValues.join(',') : (value ?? '')} />
      )}

      {/* Multi-select chips */}
      {multiple && selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selectedLabels.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-xs text-foreground"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removeValue(opt.value)}
                className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                aria-label={`Remove ${opt.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? activeDescendant : undefined}
        id={triggerId}
        className={cn(
          'flex w-full items-center justify-between rounded border bg-background px-3 py-2 text-sm transition-all duration-200 ease-in-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          error ? 'border-destructive' : 'border-input-border',
          disabled && 'opacity-50 cursor-not-allowed',
          !selected && !multiple && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      {open && (
        <div className="absolute z-dropdown mt-1 w-full rounded border border-border bg-card shadow-medium overflow-hidden">
          {searchable && (
            <div className="flex items-center border-b border-border px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="flex-1 bg-transparent py-2 px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search options"
                role="searchbox"
              />
              {loading && <Spinner size="sm" />}
            </div>
          )}
          <div ref={listRef} className="max-h-48 overflow-y-auto p-1" role="listbox" id={listboxId} aria-multiselectable={multiple || undefined}>
            {loading && filtered.length === 0 ? (
              <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No options found.</p>
            ) : (
              filtered.map((option, index) => {
                const isSelected = multiple
                  ? selectedValues.includes(option.value)
                  : option.value === value;
                return (
                  <button
                    key={option.value}
                    role="option"
                    id={`${instanceId}-option-${index}`}
                    data-index={index}
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-foreground transition-all duration-200 ease-in-out',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      index === activeIndex && 'bg-action-hover-primary',
                      isSelected && index !== activeIndex && 'bg-action-hover-primary',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <Check className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'opacity-100 text-primary' : 'opacity-0')} />
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Combobox;
