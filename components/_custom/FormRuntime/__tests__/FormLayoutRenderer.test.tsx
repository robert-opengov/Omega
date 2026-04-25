import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { GabForm } from '@/lib/core/ports/form.repository';
import type { RuntimeField } from '../types';
import { FormLayoutRenderer } from '../FormLayoutRenderer';

const fields: RuntimeField[] = [
  { id: 'field_a', key: 'amount', name: 'Amount', type: 'text', required: false },
  { id: 'field_b', key: 'notes', name: 'Notes', type: 'text', required: false },
  { id: 'field_c', key: 'status', name: 'Status', type: 'text', required: false },
];

const form: GabForm = {
  id: 'form_1',
  key: 'request',
  name: 'Request',
  tableId: 'table_1',
  description: null,
  config: {},
  isDefault: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  layout: {
    sections: [
      {
        id: 'section_1',
        title: 'Main',
        items: [
          { id: 'item_amount', type: 'field', fieldId: 'field_a' },
          { id: 'item_notes', type: 'field', fieldId: 'field_b' },
          { id: 'item_status', type: 'field', fieldId: 'field_c' },
        ],
      },
    ],
    rules: [
      {
        id: 'rule_visibility',
        type: 'visibility',
        targetItemId: 'item_notes',
        expression: "{amount} = 'show'",
      },
      {
        id: 'rule_required',
        type: 'required',
        targetItemId: 'item_amount',
        expression: "{status} = 'must'",
      },
      {
        id: 'rule_validation',
        type: 'validation',
        targetItemId: 'item_amount',
        expression: '{amount} notempty',
        errorMessage: 'Amount is required',
      },
      {
        id: 'rule_set_value',
        type: 'setValue',
        targetItemId: 'item_status',
        expression: "{amount} = 'auto'",
        valueExpression: "'approved'",
      },
    ],
  },
};

function Harness({ initialValues }: Readonly<{ initialValues: Record<string, unknown> }>) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  return (
    <FormLayoutRenderer
      form={form}
      fields={fields}
      values={values}
      onChange={(key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
      }}
      onSubmit={vi.fn()}
    />
  );
}

describe('FormLayoutRenderer', () => {
  it('applies visibility rule to hide field items', () => {
    render(<Harness initialValues={{ amount: 'hidden' }} />);
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('hidden'), {
      target: { value: 'show' },
    });
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('applies required/validation rule output', () => {
    render(<Harness initialValues={{ status: 'must', amount: '' }} />);
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('applies setValue rules and updates target field', () => {
    render(<Harness initialValues={{ amount: 'auto', status: '' }} />);
    expect(screen.getByDisplayValue('approved')).toBeInTheDocument();
  });
});
