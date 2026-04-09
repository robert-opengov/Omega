export type { ChildTableColumn } from '../core/models';

export interface CellEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  onTabSave?: (event: { value: unknown; shiftKey: boolean }) => void;
  column: import('../core/models').ChildTableColumn;
  rowId: string;
  autoFocus?: boolean;
}

export { EDITOR_BASE, EDITOR_INPUT, EDITOR_SELECT, EDITOR_ERROR } from './editor-styles';

export { TextEditor } from './TextEditor';
export { NumberEditor } from './NumberEditor';
export { DateEditor } from './DateEditor';
export { SelectEditor } from './SelectEditor';
export { MultiselectEditor } from './MultiselectEditor';
export { CheckboxEditor } from './CheckboxEditor';
export { TextareaEditor } from './TextareaEditor';
export { EmailEditor } from './EmailEditor';
export { PhoneEditor } from './PhoneEditor';
export { FileEditor } from './FileEditor';
export { EditorHost, type EditorHostProps } from './EditorHost';
