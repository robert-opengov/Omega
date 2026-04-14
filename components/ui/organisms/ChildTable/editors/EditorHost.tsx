'use client';

import { useRef, useEffect, useCallback, type JSX } from 'react';
import type { ChildTableColumn } from '../core/models';
import type { CellEditorProps } from './index';
import { TextEditor } from './TextEditor';
import { NumberEditor } from './NumberEditor';
import { DateEditor } from './DateEditor';
import { SelectEditor } from './SelectEditor';
import { MultiselectEditor } from './MultiselectEditor';
import { CheckboxEditor } from './CheckboxEditor';
import { TextareaEditor } from './TextareaEditor';
import { EmailEditor } from './EmailEditor';
import { PhoneEditor } from './PhoneEditor';
import { FileEditor } from './FileEditor';

type EditorComponent = (props: CellEditorProps) => JSX.Element;

const EDITOR_MAP: Record<string, EditorComponent> = {
  text: TextEditor,
  pii: TextEditor,
  user: TextEditor,
  formula: TextEditor,
  number: NumberEditor,
  integer: NumberEditor,
  currency: NumberEditor,
  date: DateEditor,
  datetime: DateEditor,
  select: SelectEditor,
  multiselect: MultiselectEditor,
  checkbox: CheckboxEditor,
  textarea: TextareaEditor,
  email: EmailEditor,
  phone: PhoneEditor,
  file: FileEditor,
  attachment: FileEditor,
};

export interface EditorHostProps {
  column: ChildTableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  onTabSave?: (event: { value: unknown; shiftKey: boolean }) => void;
  rowId: string;
  autoFocus?: boolean;
}

export function EditorHost({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  onTabSave,
  rowId,
  autoFocus = true,
}: EditorHostProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onSave(value);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSave, value]);

  const stopPropagation = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const Editor = EDITOR_MAP[column.type] ?? TextEditor;

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 z-editable flex items-center"
      onKeyDown={stopPropagation}
      role="dialog"
      aria-label={`Editing ${column.label}`}
    >
      <Editor
        value={value}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        onTabSave={onTabSave}
        column={column}
        rowId={rowId}
        autoFocus={autoFocus}
      />
    </div>
  );
}
