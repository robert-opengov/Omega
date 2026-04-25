'use client';

import type { GabForm } from '@/lib/core/ports/form.repository';
import type { RuntimeField } from './types';
import { FormLayoutRenderer } from './FormLayoutRenderer';

export interface FormLayoutDisplayProps {
  form: GabForm;
  fields: RuntimeField[];
  values?: Record<string, unknown>;
}

export function FormLayoutDisplay({
  form,
  fields,
  values = {},
}: Readonly<FormLayoutDisplayProps>) {
  return (
    <FormLayoutRenderer
      form={form}
      fields={fields}
      values={values}
      readOnly
      onChange={() => {
        // Display mode is read-only; no-op.
      }}
    />
  );
}
