'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Input, Label, Select, Text } from '@/components/ui/atoms';
import { Alert } from '@/components/ui/molecules';
import { cn } from '@/lib/utils';
import {
  NO_VALUE_OPERATORS,
  getOperatorsForFieldType,
  validateFilterConditions,
} from '@/lib/rbac/row-filter-operators';
import type {
  FilterCondition,
  RowFilterConfig,
} from '@/lib/core/ports/app-role.repository';

interface FieldOption {
  key: string;
  name: string;
  type: string;
}

interface RowFilterBuilderProps {
  fields: FieldOption[];
  value: RowFilterConfig | null;
  onChange: (next: RowFilterConfig | null) => void;
  /** Hide the heading; useful when caller renders its own. */
  compact?: boolean;
}

const BETWEEN_OPS = new Set(['between_date', 'not_between_date']);

function emptyCondition(field?: FieldOption): FilterCondition {
  return {
    fieldKey: field?.key ?? '',
    operator: '',
    source: { type: 'static', value: '' },
  };
}

function valueAsString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(',');
  if (typeof v === 'object') return '';
  return String(v);
}

export function RowFilterBuilder({
  fields,
  value,
  onChange,
  compact,
}: RowFilterBuilderProps) {
  const config = useMemo<RowFilterConfig>(
    () => value ?? { combinator: 'all', conditions: [] },
    [value],
  );

  const [errors, setErrors] = useState<string[]>([]);

  function updateConditions(next: FilterCondition[]) {
    if (next.length === 0) {
      onChange(null);
    } else {
      onChange({ combinator: config.combinator, conditions: next });
    }
    setErrors(validateFilterConditions(next));
  }

  function setCombinator(combinator: 'all' | 'any') {
    onChange({ combinator, conditions: config.conditions });
  }

  function addCondition() {
    updateConditions([...config.conditions, emptyCondition(fields[0])]);
  }

  function removeCondition(idx: number) {
    updateConditions(config.conditions.filter((_, i) => i !== idx));
  }

  function patchCondition(idx: number, patch: Partial<FilterCondition>) {
    updateConditions(
      config.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );
  }

  function patchSource(idx: number, patch: Partial<FilterCondition['source']>) {
    const cur = config.conditions[idx];
    patchCondition(idx, { source: { ...cur.source, ...patch } });
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <Text size="sm" weight="medium">
          Row filter
        </Text>
      )}
      {config.conditions.length > 0 && (
        <div className="flex items-center gap-2">
          <Text size="xs" color="muted">
            Match
          </Text>
          <Select
            selectSize="sm"
            value={config.combinator}
            onChange={(e) => setCombinator(e.target.value as 'all' | 'any')}
            className="w-24"
            aria-label="Combinator"
          >
            <option value="all">ALL</option>
            <option value="any">ANY</option>
          </Select>
          <Text size="xs" color="muted">
            of the following:
          </Text>
        </div>
      )}

      {config.conditions.length === 0 ? (
        <Text size="sm" color="muted">
          No conditions. Add one to restrict matching records.
        </Text>
      ) : (
        <ul className="space-y-2">
          {config.conditions.map((c, idx) => {
            const field = fields.find((f) => f.key === c.fieldKey);
            const operators = getOperatorsForFieldType(field?.type);
            const noValue = NO_VALUE_OPERATORS.has(c.operator);
            const isBetween = BETWEEN_OPS.has(c.operator);
            return (
              <li
                key={idx}
                className="flex flex-wrap items-end gap-2 rounded border border-border bg-muted/40 px-3 py-2"
              >
                <div className="flex-1 min-w-[160px]">
                  <Label htmlFor={`cond-field-${idx}`}>Field</Label>
                  <Select
                    id={`cond-field-${idx}`}
                    selectSize="sm"
                    value={c.fieldKey}
                    onChange={(e) =>
                      patchCondition(idx, { fieldKey: e.target.value, operator: '' })
                    }
                  >
                    <option value="">Select field…</option>
                    {fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <Label htmlFor={`cond-op-${idx}`}>Operator</Label>
                  <Select
                    id={`cond-op-${idx}`}
                    selectSize="sm"
                    value={c.operator}
                    onChange={(e) => patchCondition(idx, { operator: e.target.value })}
                  >
                    <option value="">Select operator…</option>
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor={`cond-src-${idx}`}>Value source</Label>
                  <Select
                    id={`cond-src-${idx}`}
                    selectSize="sm"
                    value={c.source.type}
                    onChange={(e) =>
                      patchSource(idx, {
                        type: e.target.value as 'static' | 'user_attribute',
                        value: undefined,
                        key: undefined,
                      })
                    }
                    disabled={noValue}
                  >
                    <option value="static">Static value</option>
                    <option value="user_attribute">User attribute</option>
                  </Select>
                </div>

                {!noValue && c.source.type === 'static' && (
                  <div className="flex-[2] min-w-[200px]">
                    <Label htmlFor={`cond-val-${idx}`}>Value</Label>
                    {isBetween ? (
                      <div className="flex gap-2">
                        <Input
                          inputSize="sm"
                          id={`cond-val-from-${idx}`}
                          aria-label="From"
                          value={
                            (c.source.value as { from?: string } | null)?.from ?? ''
                          }
                          onChange={(e) =>
                            patchSource(idx, {
                              value: {
                                ...((c.source.value as object) ?? {}),
                                from: e.target.value,
                              },
                            })
                          }
                          placeholder="from"
                        />
                        <Input
                          inputSize="sm"
                          id={`cond-val-to-${idx}`}
                          aria-label="To"
                          value={
                            (c.source.value as { to?: string } | null)?.to ?? ''
                          }
                          onChange={(e) =>
                            patchSource(idx, {
                              value: {
                                ...((c.source.value as object) ?? {}),
                                to: e.target.value,
                              },
                            })
                          }
                          placeholder="to"
                        />
                      </div>
                    ) : (
                      <Input
                        inputSize="sm"
                        id={`cond-val-${idx}`}
                        value={valueAsString(c.source.value)}
                        onChange={(e) =>
                          patchSource(idx, {
                            value:
                              c.operator === 'in'
                                ? e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : e.target.value,
                          })
                        }
                        placeholder={
                          c.operator === 'in' ? 'comma,separated,values' : 'value'
                        }
                      />
                    )}
                  </div>
                )}

                {!noValue && c.source.type === 'user_attribute' && (
                  <div className="flex-[2] min-w-[200px]">
                    <Label htmlFor={`cond-attr-${idx}`}>User attribute key</Label>
                    <Input
                      inputSize="sm"
                      id={`cond-attr-${idx}`}
                      value={c.source.key ?? ''}
                      onChange={(e) => patchSource(idx, { key: e.target.value })}
                      placeholder="e.g. department"
                    />
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(idx)}
                  aria-label={`Remove condition ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {errors.length > 0 && (
        <Alert variant="error" title="Filter validation">
          <ul className="list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addCondition}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add condition
        </Button>
        {config.conditions.length > 0 && (
          <Badge variant="default" size="sm" className={cn('ml-auto')}>
            {config.conditions.length} condition
            {config.conditions.length === 1 ? '' : 's'}
          </Badge>
        )}
      </div>
    </div>
  );
}
