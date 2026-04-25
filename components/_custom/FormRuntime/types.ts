import type { GabField } from '@/lib/core/ports/field.repository';
import type { PublicFormField } from '@/lib/core/ports/form.repository';

export interface RuntimeField {
  id: string;
  key: string;
  name: string;
  type: string;
  required: boolean;
  config?: Record<string, unknown> | null;
  defaultValue?: unknown;
  tableId?: string;
}

export function toRuntimeField(field: GabField | PublicFormField): RuntimeField {
  return {
    id: field.id,
    key: field.key,
    name: field.name,
    type: field.type,
    required: Boolean(field.required),
    config: field.config as Record<string, unknown> | null | undefined,
    defaultValue: field.defaultValue,
    tableId: 'tableId' in field ? field.tableId : undefined,
  };
}
