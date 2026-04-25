import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RulesPanel } from '../_components/RulesPanel';

describe('RulesPanel', () => {
  it('adds and removes rules through state callbacks', () => {
    const onChange = vi.fn();
    render(<RulesPanel rules={[]} itemOptions={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Add rule/i }));
    expect(onChange).toHaveBeenCalledTimes(1);

    const rule = {
      id: 'rule_1',
      type: 'visibility',
      targetItemId: 'item_1',
      expression: '{Amount} > 0',
    } as const;

    onChange.mockClear();
    render(
      <RulesPanel
        rules={[rule]}
        itemOptions={[{ value: 'item_1', label: 'Item' }]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
