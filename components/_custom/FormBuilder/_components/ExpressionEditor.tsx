'use client';

import { useState } from 'react';
import { Button, Textarea } from '@/components/ui/atoms';
import { parse } from '@/lib/form-rules/parser';
import { tokenize } from '@/lib/form-rules/tokenizer';

const OPERATOR_TOKENS = ['=', '!=', '>', '<', '>=', '<=', 'contains', 'notcontains', 'empty', 'notempty'];
const LOGICAL_TOKENS = ['and', 'or', 'not'];
const FUNCTION_TOKENS = ['iif', 'today', 'now', 'sum', 'count', 'min', 'max', 'abs', 'round', 'floor', 'ceil', 'len', 'concat', 'lower', 'upper', 'trim'];

interface ExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExpressionEditor({ value, onChange }: Readonly<ExpressionEditorProps>) {
  const [error, setError] = useState<string | null>(null);

  const append = (token: string) => {
    const spacer = value.length > 0 && !value.endsWith(' ') ? ' ' : '';
    onChange(`${value}${spacer}${token}`);
  };

  const validate = () => {
    if (!value.trim()) {
      setError(null);
      return;
    }
    try {
      parse(tokenize(value));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid expression');
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={validate}
        placeholder="Type an expression like {Amount} > 100"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <TokenBar label="Operators" tokens={OPERATOR_TOKENS} onInsert={append} />
      <TokenBar label="Logic" tokens={LOGICAL_TOKENS} onInsert={append} />
      <TokenBar
        label="Functions"
        tokens={FUNCTION_TOKENS}
        onInsert={(token) => append(`${token}()`)}
      />
    </div>
  );
}

function TokenBar({
  label,
  tokens,
  onInsert,
}: Readonly<{ label: string; tokens: string[]; onInsert: (token: string) => void }>) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {tokens.map((token) => (
          <Button key={token} type="button" size="sm" variant="outline" onClick={() => onInsert(token)}>
            {token}
          </Button>
        ))}
      </div>
    </div>
  );
}
