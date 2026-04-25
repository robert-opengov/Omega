'use client';

import { useState } from 'react';
import type { GabForm } from '@/lib/core/ports/form.repository';
import type { RuntimeField } from '@/components/_custom/FormRuntime';
import { FormLayoutRenderer } from '@/components/_custom/FormRuntime';

interface LivePreviewProps {
  form: GabForm;
  fields: RuntimeField[];
}

export function LivePreview({ form, fields }: Readonly<LivePreviewProps>) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  return (
    <FormLayoutRenderer
      form={form}
      fields={fields}
      values={values}
      onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
    />
  );
}
