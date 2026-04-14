'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useMemo, type ElementType } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  label: string;
  value: string;
  icon?: ElementType;
  description?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  /** @default 'Search commands...' */
  placeholder?: string;
}

/**
 * A keyboard-driven command palette (⌘K style) for quick actions.
 *
 * Uses `bg-overlay` for the backdrop and `shadow-overlay` for the panel,
 * aligned with CDS-37 pattern.
 *
 * @example
 * <CommandPalette open={open} onOpenChange={setOpen} items={commands} />
 */
export function CommandPalette({ open, onOpenChange, items, placeholder = 'Search commands...' }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter((item) =>
      item.label.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower)
    );
  }, [items, query]);

  const handleSelect = (item: CommandItem) => {
    item.onSelect();
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQuery(''); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-overlay bg-overlay backdrop-blur-sm" />
        <Dialog.Content className={cn(
          'fixed left-1/2 top-[20%] z-overlay -translate-x-1/2 w-[95vw] max-w-lg rounded bg-card border border-border shadow-overlay overflow-hidden',
        )}>
          <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search and run commands</Dialog.Description>
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
              aria-label="Search commands"
              aria-controls="command-listbox"
            />
          </div>
          <div id="command-listbox" className="max-h-[300px] overflow-y-auto p-1" role="listbox" aria-label="Command results">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-foreground hover:bg-action-hover-primary focus-visible:bg-action-hover-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-all duration-200 ease-in-out"
                  >
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 text-left">
                      <p className="font-medium">{item.label}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CommandPalette;
