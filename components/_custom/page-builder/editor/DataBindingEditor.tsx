'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { Input, Label, Select, Text } from '@/components/ui/atoms';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import type { DataShape } from '@/lib/page-builder/page-component-registry';
import { listTablesAction } from '@/app/actions/tables';
import { listFieldsAction } from '@/app/actions/fields';

export interface DataBindingEditorProps {
  appId: string;
  shape: DataShape;
  value?: DataBinding;
  onChange: (next: DataBinding | undefined) => void;
}

interface TableOption {
  key: string;
  name: string;
}

interface FieldOption {
  key: string;
  name: string;
  type: string;
}

/**
 * Visual editor for `DataBinding`. Loads the table list lazily, then loads
 * fields for the selected table. Shape determines available source types:
 *
 *   - `records`  → table | query
 *   - `record`   → record (table + recordId) | static
 *   - `scalar`   → query | static (uses fields[0] as the value)
 */
export function DataBindingEditor({ appId, shape, value, onChange }: DataBindingEditorProps) {
  const [tables, setTables] = useState<TableOption[] | null>(null);
  const [fields, setFields] = useState<FieldOption[] | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const source = value?.source ?? 'static';

  useEffect(() => {
    if (tables !== null) return;
    setLoadingTables(true);
    listTablesAction(appId).then((res) => {
      setLoadingTables(false);
      if (res.success && res.data) {
        setTables(res.data.items.map((t) => ({ key: t.key, name: t.name })));
      } else {
        setTables([]);
      }
    });
  }, [appId, tables]);

  useEffect(() => {
    const tableKey = value?.tableKey;
    if (!tableKey) {
      setFields(null);
      return;
    }
    setLoadingFields(true);
    listFieldsAction(appId, tableKey).then((res) => {
      setLoadingFields(false);
      if (res.success && res.data) {
        setFields(res.data.items.map((f) => ({ key: f.key, name: f.name, type: f.type })));
      } else {
        setFields([]);
      }
    });
  }, [appId, value?.tableKey]);

  function set(patch: Partial<DataBinding>) {
    onChange({ ...(value ?? { source: 'static' }), ...patch } as DataBinding);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Source</Label>
        <Select
          value={source}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const next = e.target.value as DataBinding['source'];
            if (next === 'static') {
              onChange(undefined);
            } else {
              onChange({ source: next, tableKey: value?.tableKey });
            }
          }}
        >
          <option value="static">None / static</option>
          {(shape === 'records' || shape === 'record') && <option value="table">Table</option>}
          {shape === 'record' && <option value="record">Specific record</option>}
          <option value="query">Custom query</option>
        </Select>
      </div>

      {(source === 'table' || source === 'record' || source === 'query') && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Table</Label>
          <Select
            value={value?.tableKey ?? ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set({ tableKey: e.target.value || undefined })}
            disabled={loadingTables}
          >
            <option value="">{loadingTables ? 'Loading…' : 'Select table'}</option>
            {(tables ?? []).map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {source === 'record' && value?.tableKey && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Record ID</Label>
          <Input
            value={value?.recordId ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              set({ recordId: e.target.value || undefined })
            }
            placeholder="123"
          />
        </div>
      )}

      {(source === 'table' || source === 'query') && value?.tableKey && (
        <>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Limit</Label>
            <Input
              type="number"
              value={value?.limit ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const v = e.target.value;
                set({ limit: v === '' ? undefined : Number(v) });
              }}
              placeholder="50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Sort by</Label>
              <Select
                value={value?.sortBy ?? ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  set({ sortBy: e.target.value || undefined })
                }
                disabled={loadingFields}
              >
                <option value="">—</option>
                {(fields ?? []).map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Direction</Label>
              <Select
                value={value?.sortDir ?? 'asc'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  set({ sortDir: e.target.value as 'asc' | 'desc' })
                }
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </Select>
            </div>
          </div>
        </>
      )}

      {source === 'query' && value?.tableKey && (
        <Text size="xs" color="muted">
          Filters can be added at runtime via the page filter bar.
        </Text>
      )}
    </div>
  );
}
