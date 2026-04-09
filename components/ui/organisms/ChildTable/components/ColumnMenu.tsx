'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FilterOperator } from '../core/models';

type OperatorOrNone = FilterOperator | 'none';

const OPERATOR_OPTIONS: { value: OperatorOrNone; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'contains', label: 'Contains' },
  { value: 'notEquals', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
  { value: 'greaterThan', label: 'Greater than' },
  { value: 'lessThan', label: 'Less than' },
];

export interface ColumnMenuProps {
  readonly hasFilter: boolean;
  readonly filterValue: unknown;
  readonly filterOperator?: FilterOperator;
  readonly onFilter: (operator: FilterOperator, value: unknown) => void;
  readonly onClearFilter: () => void;
  readonly onClose: () => void;
}

export function ColumnMenu({
  hasFilter,
  filterValue,
  filterOperator = 'contains',
  onFilter,
  onClearFilter,
  onClose,
}: ColumnMenuProps) {
  const [operator, setOperator] = useState<OperatorOrNone>(
    hasFilter ? filterOperator : 'none',
  );
  const [value, setValue] = useState(filterValue != null ? String(filterValue) : '');

  const needsValue = operator !== 'isEmpty' && operator !== 'isNotEmpty' && operator !== 'none';

  const handleApply = () => {
    if (operator === 'none') {
      onClearFilter();
    } else {
      onFilter(operator, needsValue ? value : null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Filter by condition */}
      <div className="px-4 pt-3 pb-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px]">
          Filter by condition:
        </span>
      </div>

      <div className="px-4 mb-2">
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as OperatorOrNone)}
          className="w-full h-9 px-3 rounded border border-border bg-background text-foreground text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {OPERATOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by value */}
      <div className="px-4 pt-2 pb-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px]">
          Filter by value:
        </span>
      </div>

      <div className="px-4 mb-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search..."
          disabled={!needsValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply();
          }}
          className="w-full h-9 px-3 rounded border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Footer with OK / Cancel */}
      <div className="flex justify-end gap-2 px-4 py-3 bg-muted border-t border-border rounded-b-lg">
        <button
          type="button"
          onClick={handleApply}
          className={cn(
            'min-h-[32px] px-4 text-sm font-medium rounded transition-all duration-300 ease-in-out',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
        >
          OK
        </button>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'min-h-[32px] px-4 text-sm font-medium rounded border border-muted-foreground/30 transition-all duration-300 ease-in-out',
            'bg-background text-foreground hover:bg-foreground/[0.04]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ColumnMenu;
