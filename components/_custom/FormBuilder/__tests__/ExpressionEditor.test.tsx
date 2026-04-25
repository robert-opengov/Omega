import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ExpressionEditor } from '../_components/ExpressionEditor';

describe('ExpressionEditor', () => {
  it('appends tokens when operator button is clicked', () => {
    const onChange = vi.fn();
    render(<ExpressionEditor value="{Amount}" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(onChange).toHaveBeenCalledWith('{Amount} =');
  });

  it('shows parse error on blur for invalid expression', () => {
    const Harness = () => {
      const [value, setValue] = React.useState('{Amount} =');
      return <ExpressionEditor value={value} onChange={setValue} />;
    };
    render(<Harness />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(screen.getByText(/Parse error/i)).toBeInTheDocument();
  });
});
