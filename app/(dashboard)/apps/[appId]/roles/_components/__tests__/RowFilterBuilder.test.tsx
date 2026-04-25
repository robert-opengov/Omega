import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { RowFilterBuilder } from '../RowFilterBuilder';

const FIELDS = [
  { key: 'status', name: 'Status', type: 'select' },
  { key: 'amount', name: 'Amount', type: 'number' },
  { key: 'created_at', name: 'Created', type: 'datetime' },
];

describe('RowFilterBuilder', () => {
  it('starts with no conditions and renders the empty state', () => {
    const onChange = vi.fn();
    render(<RowFilterBuilder fields={FIELDS} value={null} onChange={onChange} />);
    expect(screen.getByText(/No conditions/i)).toBeInTheDocument();
  });

  it('adds a condition pre-populated with the first field', () => {
    const onChange = vi.fn();
    render(<RowFilterBuilder fields={FIELDS} value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Add condition/i }));

    expect(onChange).toHaveBeenCalledWith({
      combinator: 'all',
      conditions: [
        { fieldKey: 'status', operator: '', source: { type: 'static', value: '' } },
      ],
    });
  });

  it('filters operators by field type', () => {
    const onChange = vi.fn();
    render(
      <RowFilterBuilder
        fields={FIELDS}
        value={{
          combinator: 'all',
          conditions: [
            { fieldKey: 'amount', operator: '', source: { type: 'static', value: '' } },
          ],
        }}
        onChange={onChange}
      />,
    );

    const opSelect = screen.getByLabelText(/Operator/i) as HTMLSelectElement;
    const optionValues = Array.from(opSelect.options).map((o) => o.value);

    expect(optionValues).toContain('greater_than');
    expect(optionValues).not.toContain('contains');
  });

  it('hides the value input when a no-value operator is selected', () => {
    const onChange = vi.fn();
    render(
      <RowFilterBuilder
        fields={FIELDS}
        value={{
          combinator: 'all',
          conditions: [
            { fieldKey: 'status', operator: 'empty', source: { type: 'static' } },
          ],
        }}
        onChange={onChange}
      />,
    );

    expect(screen.queryByLabelText(/^Value$/)).toBeNull();
  });

  it('removing the last condition emits null', () => {
    const onChange = vi.fn();
    render(
      <RowFilterBuilder
        fields={FIELDS}
        value={{
          combinator: 'all',
          conditions: [
            { fieldKey: 'status', operator: 'is_equal', source: { type: 'static', value: 'open' } },
          ],
        }}
        onChange={onChange}
      />,
    );

    const list = screen.getByRole('list');
    fireEvent.click(within(list).getByRole('button', { name: /Remove condition/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows two inputs for between_date operator', () => {
    const onChange = vi.fn();
    render(
      <RowFilterBuilder
        fields={FIELDS}
        value={{
          combinator: 'all',
          conditions: [
            {
              fieldKey: 'created_at',
              operator: 'between_date',
              source: { type: 'static', value: { from: '', to: '' } },
            },
          ],
        }}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText(/^From$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^To$/)).toBeInTheDocument();
  });
});
