'use client';

import { useState, useRef, useEffect, useId, useCallback, type KeyboardEvent } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/use-click-outside';

export interface AddressSuggestion {
  id: string;
  label: string;
  sublabel?: string;
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: GeocodedLocation) => void;
  suggestions?: AddressSuggestion[];
  onSearch?: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Provider-agnostic address autocomplete input. The parent handles geocoding
 * via `onSearch` and passes `suggestions` back — works with Esri, Google,
 * Mapbox, or any geocoding API.
 *
 * Uses WAI-ARIA combobox pattern for full accessibility.
 */
export function AddressInput({
  value,
  onChange,
  onSelect,
  suggestions = [],
  onSearch,
  loading = false,
  placeholder = 'Search for an address...',
  error,
  disabled,
  className,
}: AddressInputProps) {
  const instanceId = useId();
  const listboxId = `${instanceId}-listbox`;
  const inputId = `${instanceId}-input`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useClickOutside(containerRef, () => setOpen(false));

  const showDropdown = open && (suggestions.length > 0 || loading);

  const handleInputChange = useCallback((val: string) => {
    onChange(val);
    onSearch?.(val);
    setOpen(val.length >= 2);
    setActiveIndex(-1);
  }, [onChange, onSearch]);

  const handleSelectSuggestion = useCallback((suggestion: AddressSuggestion) => {
    onChange(suggestion.label);
    setOpen(false);
    setActiveIndex(-1);
    onSelect({
      lat: 0,
      lng: 0,
      address: suggestion.label,
    });
  }, [onChange, onSelect]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelectSuggestion(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const activeDescendant = activeIndex >= 0 ? `${instanceId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (value.length >= 2 && suggestions.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded border bg-background pl-9 pr-8 py-2 text-sm transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'placeholder:text-muted-foreground',
            error ? 'border-destructive' : 'border-input-border',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      {showDropdown && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-dropdown mt-1 w-full rounded border border-border bg-card shadow-medium overflow-hidden max-h-60 overflow-y-auto"
        >
          {loading && suggestions.length === 0 ? (
            <li className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${instanceId}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'flex items-start gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                  index === activeIndex && 'bg-action-hover-primary',
                )}
              >
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-foreground truncate">{suggestion.label}</p>
                  {suggestion.sublabel && (
                    <p className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</p>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default AddressInput;
