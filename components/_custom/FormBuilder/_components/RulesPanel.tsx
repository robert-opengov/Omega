'use client';

import { Button, Input, Select } from '@/components/ui/atoms';
import { ExpressionEditor } from './ExpressionEditor';
import type { FormRule } from '@/lib/core/ports/form.repository';
import { createRule } from '../types';

interface RulesPanelProps {
  rules: FormRule[];
  itemOptions: Array<{ value: string; label: string }>;
  onChange: (rules: FormRule[]) => void;
}

export function RulesPanel({ rules, itemOptions, onChange }: Readonly<RulesPanelProps>) {
  const addRule = () => onChange([...rules, createRule()]);
  const removeRule = (id: string) => onChange(rules.filter((rule) => rule.id !== id));
  const updateRule = (id: string, patch: Partial<FormRule>) =>
    onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Form Rules</h3>
        <Button type="button" size="sm" onClick={addRule}>
          Add rule
        </Button>
      </div>
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rules yet.</p>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="space-y-3 rounded border border-border p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Select
                  aria-label="Rule type"
                  value={rule.type}
                  onChange={(event) =>
                    updateRule(rule.id, { type: event.target.value as FormRule['type'] })
                  }
                >
                  <option value="visibility">visibility</option>
                  <option value="required">required</option>
                  <option value="readOnly">readOnly</option>
                  <option value="setValue">setValue</option>
                  <option value="validation">validation</option>
                </Select>
                <Select
                  aria-label="Rule target"
                  value={rule.targetItemId}
                  onChange={(event) => updateRule(rule.id, { targetItemId: event.target.value })}
                >
                  <option value="">Select target item</option>
                  {itemOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeRule(rule.id)}
                >
                  Remove
                </Button>
              </div>
              <ExpressionEditor
                value={rule.expression}
                onChange={(value) => updateRule(rule.id, { expression: value })}
              />
              {rule.type === 'setValue' ? (
                <ExpressionEditor
                  value={rule.valueExpression ?? ''}
                  onChange={(value) => updateRule(rule.id, { valueExpression: value })}
                />
              ) : null}
              {rule.type === 'validation' ? (
                <Input
                  placeholder="Error message"
                  value={rule.errorMessage ?? ''}
                  onChange={(event) => updateRule(rule.id, { errorMessage: event.target.value })}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
