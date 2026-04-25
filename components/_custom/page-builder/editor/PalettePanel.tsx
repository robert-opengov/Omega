'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Input, Text, Button } from '@/components/ui/atoms';
import { Plus, Search } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  pageComponentRegistry,
  type PageComponentCategory,
  type PageComponentDefinition,
} from '@/lib/page-builder/page-component-registry';

export interface PalettePanelProps {
  onAdd: (def: PageComponentDefinition) => void;
}

/**
 * Searchable, category-grouped palette. Mirrors GAB Core's palette UX —
 * category headers + per-block "add" buttons. Includes any registered custom
 * components automatically (registered via `register-custom-components.ts`).
 */
export function PalettePanel({ onAdd }: PalettePanelProps) {
  const [query, setQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<PageComponentCategory | 'all'>('all');

  const grouped = useMemo(() => {
    const all = pageComponentRegistry.byCategory();
    const filter = (def: PageComponentDefinition) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        def.label.toLowerCase().includes(q) ||
        def.type.toLowerCase().includes(q) ||
        (def.description ?? '').toLowerCase().includes(q)
      );
    };
    const out: Record<PageComponentCategory, PageComponentDefinition[]> = {
      layout: [],
      containers: [],
      content: [],
      data: [],
      forms: [],
      navigation: [],
      media: [],
      charts: [],
      custom: [],
    };
    for (const cat of CATEGORY_ORDER) {
      out[cat] = all[cat].filter(filter).sort((a, b) => a.label.localeCompare(b.label));
    }
    return out;
  }, [query]);

  const categories = openCategory === 'all'
    ? CATEGORY_ORDER.filter((c) => grouped[c].length > 0)
    : ([openCategory] as PageComponentCategory[]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search blocks…"
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant={openCategory === 'all' ? 'secondary' : 'outline'}
          onClick={() => setOpenCategory('all')}
        >
          All
        </Button>
        {CATEGORY_ORDER.filter((c) => grouped[c].length > 0).map((c) => (
          <Button
            key={c}
            type="button"
            size="sm"
            variant={openCategory === c ? 'secondary' : 'outline'}
            onClick={() => setOpenCategory(c)}
          >
            {CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const items = grouped[cat];
          if (!items.length) return null;
          return (
            <div key={cat} className="space-y-1">
              <Text size="xs" color="muted" className="uppercase tracking-wide font-semibold">
                {CATEGORY_LABELS[cat]}
              </Text>
              {items.map((def) => (
                <Button
                  key={def.type}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 px-2"
                  onClick={() => onAdd(def)}
                  title={def.description}
                >
                  <Plus className="h-3 w-3 mr-1.5 shrink-0" />
                  <span className="text-xs truncate">{def.label}</span>
                </Button>
              ))}
            </div>
          );
        })}
        {categories.every((c) => !grouped[c].length) && (
          <Text size="xs" color="muted" className="text-center py-4">
            No matches.
          </Text>
        )}
      </div>
    </div>
  );
}
