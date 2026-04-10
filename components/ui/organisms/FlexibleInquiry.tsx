'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Select, Input } from '@/components/ui/atoms';
import { X, Plus } from 'lucide-react';

export interface InquiryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { label: string; value: string }[];
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface FlexibleInquiryProps {
  fields: InquiryField[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  maxConditions?: number;
  logicOperator?: 'and' | 'or';
  onLogicOperatorChange?: (op: 'and' | 'or') => void;
  className?: string;
}

const operatorsByType: Record<string, { label: string; value: string }[]> = {
  text: [
    { label: 'contains', value: 'contains' },
    { label: 'equals', value: 'equals' },
    { label: 'starts with', value: 'starts_with' },
    { label: 'ends with', value: 'ends_with' },
    { label: 'is empty', value: 'is_empty' },
  ],
  number: [
    { label: '=', value: 'eq' },
    { label: '≠', value: 'neq' },
    { label: '>', value: 'gt' },
    { label: '≥', value: 'gte' },
    { label: '<', value: 'lt' },
    { label: '≤', value: 'lte' },
  ],
  date: [
    { label: 'is', value: 'is' },
    { label: 'before', value: 'before' },
    { label: 'after', value: 'after' },
    { label: 'between', value: 'between' },
  ],
  select: [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'is_not' },
  ],
};

function inputTypeFor(fieldType: string): string {
  if (fieldType === 'number') return 'number';
  if (fieldType === 'date') return 'date';
  return 'text';
}

let nextId = 0;
function generateId(): string {
  return `filter-${++nextId}-${Date.now()}`;
}

export function FlexibleInquiry({
  fields,
  filters,
  onFiltersChange,
  maxConditions = 10,
  logicOperator = 'and',
  onLogicOperatorChange,
  className,
}: Readonly<FlexibleInquiryProps>) {
  const updateFilter = useCallback(
    (id: string, patch: Partial<FilterCondition>) => {
      onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    [filters, onFiltersChange],
  );

  const removeFilter = useCallback(
    (id: string) => {
      onFiltersChange(filters.filter((f) => f.id !== id));
    },
    [filters, onFiltersChange],
  );

  const addFilter = useCallback(() => {
    if (filters.length >= maxConditions || fields.length === 0) return;
    const newFilter: FilterCondition = {
      id: generateId(),
      field: fields[0].key,
      operator: operatorsByType[fields[0].type]?.[0]?.value ?? 'equals',
      value: '',
    };
    onFiltersChange([...filters, newFilter]);
  }, [filters, maxConditions, fields, onFiltersChange]);

  const getFieldType = (key: string) => fields.find((f) => f.key === key)?.type ?? 'text';
  const getFieldOptions = (key: string) => fields.find((f) => f.key === key)?.options;

  return (
    <div className={cn('rounded border border-border bg-card p-4 space-y-3', className)}>
      {filters.length > 1 && onLogicOperatorChange && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Match</span>
          <button
            onClick={() => onLogicOperatorChange(logicOperator === 'and' ? 'or' : 'and')}
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded border transition-colors duration-200',
              'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10',
            )}
          >
            {logicOperator === 'and' ? 'ALL' : 'ANY'}
          </button>
          <span className="text-xs text-muted-foreground">conditions</span>
        </div>
      )}

      {filters.map((filter, index) => {
        const fieldType = getFieldType(filter.field);
        const operators = operatorsByType[fieldType] ?? operatorsByType.text;
        const selectOptions = getFieldOptions(filter.field);

        return (
          <div key={filter.id} className="flex items-center gap-2 flex-wrap">
            {index > 0 && (
              <span className="text-xs text-muted-foreground w-10 text-center shrink-0">
                {logicOperator === 'and' ? 'AND' : 'OR'}
              </span>
            )}
            {index === 0 && filters.length > 1 && <span className="w-10 shrink-0" />}

            <Select
              value={filter.field}
              onChange={(e) => {
                const newType = getFieldType(e.target.value);
                const newOps = operatorsByType[newType] ?? operatorsByType.text;
                updateFilter(filter.id, {
                  field: e.target.value,
                  operator: newOps[0]?.value ?? 'equals',
                  value: '',
                });
              }}
              className="w-40"
            >
              {fields.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </Select>

            <Select
              value={filter.operator}
              onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
              className="w-32"
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </Select>

            {selectOptions ? (
              <Select
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                className="flex-1 min-w-[120px]"
              >
                <option value="">Select…</option>
                {selectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ) : (
              <Input
                type={inputTypeFor(fieldType)}
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                placeholder="Value…"
                className="flex-1 min-w-[120px]"
              />
            )}

            <button
              onClick={() => removeFilter(filter.id)}
              className="p-1.5 rounded hover:bg-action-hover-primary text-muted-foreground transition-colors duration-200"
              aria-label="Remove condition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      <Button
        variant="ghost"
        size="sm"
        onClick={addFilter}
        disabled={filters.length >= maxConditions}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add condition
      </Button>
    </div>
  );
}

export default FlexibleInquiry;
