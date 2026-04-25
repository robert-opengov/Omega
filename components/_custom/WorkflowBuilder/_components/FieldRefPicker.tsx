'use client';

import { useMemo, useState } from 'react';
import { Braces, CalendarDays, CheckSquare, Hash, Mail, Search, Type } from 'lucide-react';
import { Input, Text } from '@/components/ui/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/molecules';
import { cn } from '@/lib/utils';
import type { GabField } from '@/lib/core/ports/field.repository';

const TYPE_ICONS: Record<string, typeof Type> = {
  text: Type,
  string: Type,
  number: Hash,
  currency: Hash,
  integer: Hash,
  date: CalendarDays,
  datetime: CalendarDays,
  boolean: CheckSquare,
  email: Mail,
};

export interface FieldRefPickerProps {
  fields: Pick<GabField, 'name' | 'type' | 'key'>[];
  onInsert: (ref: string) => void;
  disabled?: boolean;
}

export function FieldRefPicker({ fields, onInsert, disabled }: Readonly<FieldRefPickerProps>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return fields;
    const q = search.toLowerCase();
    return fields.filter((f) => f.name.toLowerCase().includes(q));
  }, [fields, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Insert field reference"
          title="Insert field reference"
          disabled={disabled}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground',
            'hover:bg-action-hover-primary hover:text-foreground',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:opacity-50',
          )}
        >
          <Braces className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields…"
            className="pl-7 h-8 text-xs"
            aria-label="Search fields"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <Text size="xs" color="muted">
                No fields found
              </Text>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((f) => {
                const Icon = TYPE_ICONS[f.type] ?? Type;
                return (
                  <li key={f.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(`[${f.name}]`);
                        setSearch('');
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-action-hover-primary"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate text-xs font-medium text-foreground">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{f.type}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FieldRefPicker;
