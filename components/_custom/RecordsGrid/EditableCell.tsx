'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import type { GabField } from '@/lib/core/ports/field.repository';

export interface EditableCellProps {
  field: GabField;
  value: unknown;
  /** Called with the parsed/typed value the user committed. */
  onCommit: (next: unknown) => Promise<void> | void;
  /** Render the read-only display when not editing. */
  renderDisplay: (value: unknown) => ReactNode;
  /** Disable editing — falls back to read-only. */
  disabled?: boolean;
}

/**
 * Inline-editable cell. Click to enter edit mode (or single-click for booleans),
 * Enter / blur to commit, Escape to cancel. Supports the most common field
 * types — formula / lookup / summary / system fields are always rendered
 * read-only by the column builder before this component is ever reached.
 */
export function EditableCell({
  field,
  value,
  onCommit,
  renderDisplay,
  disabled = false,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(stringify(value));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      if (inputRef.current && 'select' in inputRef.current) {
        (inputRef.current as HTMLInputElement).select?.();
      }
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(stringify(value));
  }, [editing, value]);

  if (disabled) {
    return <>{renderDisplay(value)}</>;
  }

  // Booleans: toggle inline without entering edit mode.
  if (field.type === 'boolean' || field.type === 'checkbox') {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await onCommit(!value);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
          } finally {
            setPending(false);
          }
        }}
        className="text-left"
        aria-label="Toggle value"
        title={error ?? undefined}
      >
        {renderDisplay(value)}
      </button>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        onDoubleClick={(e) => e.stopPropagation()}
        className="w-full text-left hover:bg-muted/40 rounded px-1 -mx-1 py-0.5 -my-0.5"
        title="Click to edit"
      >
        {renderDisplay(value)}
      </button>
    );
  }

  const commit = async () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = parse(field, draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid value');
      return;
    }
    setPending(true);
    try {
      await onCommit(parsed);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setPending(false);
    }
  };

  const cancel = () => {
    setError(null);
    setDraft(stringify(value));
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  // Choice / select → native dropdown driven by field config (if present).
  if ((field.type === 'choice' || field.type === 'select') && field.config && typeof field.config === 'object') {
    const choices = (field.config as { choices?: Array<{ value: string; label?: string }> }).choices;
    if (Array.isArray(choices) && choices.length > 0) {
      return (
        <div className="flex items-center gap-1">
          <select
            ref={(el) => { inputRef.current = el; }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            className="rounded border border-border bg-background px-2 py-1 text-sm min-w-32"
          >
            <option value="">—</option>
            {choices.map((c) => (
              <option key={c.value} value={c.value}>{c.label ?? c.value}</option>
            ))}
          </select>
          <CommitButtons commit={commit} cancel={cancel} pending={pending} />
          {error && <span className="text-xs text-danger-text">{error}</span>}
        </div>
      );
    }
  }

  const inputType = inputTypeFor(field);

  return (
    <div className="flex items-center gap-1">
      <input
        ref={(el) => { inputRef.current = el; }}
        type={inputType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        disabled={pending}
        className="rounded border border-border bg-background px-2 py-1 text-sm w-full min-w-32"
      />
      <CommitButtons commit={commit} cancel={cancel} pending={pending} />
      {error && <span className="text-xs text-danger-text">{error}</span>}
    </div>
  );
}

function CommitButtons({
  commit,
  cancel,
  pending,
}: {
  commit: () => void;
  cancel: () => void;
  pending: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={commit}
        disabled={pending}
        aria-label="Save"
        className="p-1 rounded hover:bg-success-light text-success-text disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={cancel}
        disabled={pending}
        aria-label="Cancel"
        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </>
  );
}

function inputTypeFor(field: GabField): string {
  switch (field.type) {
    case 'number':
    case 'integer':
    case 'decimal':
    case 'currency':
      return 'number';
    case 'date':
      return 'date';
    case 'datetime':
    case 'timestamp':
      return 'datetime-local';
    case 'email':
      return 'email';
    case 'url':
      return 'url';
    case 'phone':
      return 'tel';
    default:
      return 'text';
  }
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parse(field: GabField, raw: string): unknown {
  if (raw === '') return null;
  switch (field.type) {
    case 'number':
    case 'decimal':
    case 'currency': {
      const n = Number(raw);
      if (Number.isNaN(n)) throw new Error('Must be a number');
      return n;
    }
    case 'integer': {
      const n = Number(raw);
      if (!Number.isInteger(n)) throw new Error('Must be an integer');
      return n;
    }
    case 'date':
    case 'datetime':
    case 'timestamp':
      return raw;
    case 'json':
    case 'object':
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error('Must be valid JSON');
      }
    default:
      return raw;
  }
}
