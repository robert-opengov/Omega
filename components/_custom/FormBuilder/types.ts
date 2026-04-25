import type {
  FormDisplayMode,
  FormLayout,
  FormLayoutItem,
  FormLayoutSection,
  FormRule,
  GabForm,
} from '@/lib/core/ports/form.repository';
import type { RuntimeField } from '../FormRuntime';

export interface FormBuilderState {
  name: string;
  layout: FormLayout;
}

export interface FormBuilderProps {
  appId: string;
  form: GabForm;
  fields: RuntimeField[];
}

export type BuilderSelection =
  | { type: 'section'; sectionId: string }
  | { type: 'item'; sectionId: string; itemId: string }
  | { type: 'rules' };

export interface LayoutTreeDragResult {
  layout: FormLayout;
}

function uid(): string {
  return `fb_${Math.random().toString(36).slice(2, 11)}`;
}

export function ensureLayout(layout: FormLayout): FormLayout {
  if (layout.sections.length > 0) return layout;
  return {
    ...layout,
    sections: [{ id: uid(), title: 'Section 1', items: [] }],
  };
}

export function createSection(mode: FormDisplayMode = 'stacked'): FormLayoutSection {
  return {
    id: uid(),
    title: 'New section',
    displayMode: mode,
    items: [],
  };
}

export function createFieldItem(fieldId: string): FormLayoutItem {
  return {
    id: uid(),
    type: 'field',
    fieldId,
  };
}

export function createRule(): FormRule {
  return {
    id: uid(),
    type: 'visibility',
    targetItemId: '',
    expression: '',
  };
}
