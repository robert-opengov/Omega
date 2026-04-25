'use client';

import { useState, useTransition } from 'react';
import { Button, Text } from '@/components/ui/atoms';
import { FormLayoutRenderer, type RuntimeField } from '@/components/_custom/FormRuntime';
import { createRowAction } from '@/app/actions/data';
import type { GabForm } from '@/lib/core/ports/form.repository';

interface FormPreviewPanelProps {
  form: GabForm;
  fields: RuntimeField[];
  applicationKey?: string;
  tableKey?: string;
}

export function FormPreviewPanel({
  form,
  fields,
  applicationKey,
  tableKey,
}: Readonly<FormPreviewPanelProps>) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(applicationKey && tableKey);

  const submit = (payload: Record<string, unknown>) => {
    if (!applicationKey || !tableKey) return;
    setError(null);
    startTransition(async () => {
      const result = await createRowAction(tableKey, applicationKey, payload);
      if (!result.success) {
        setError(result.error ?? 'Failed to submit');
        return;
      }
      setSubmitted(true);
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Form Preview</h1>
      {!canSubmit ? (
        <Text size="sm" color="muted">
          This form is not attached to a table yet, so submit is disabled.
        </Text>
      ) : null}
      {error ? <Text size="sm" className="text-destructive">{error}</Text> : null}
      {submitted ? <Text size="sm" className="text-success-text">Preview submit succeeded.</Text> : null}
      <FormLayoutRenderer
        form={form}
        fields={fields}
        values={values}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        onSubmit={canSubmit ? submit : undefined}
      />
      {!canSubmit ? (
        <Button type="button" disabled>
          Submit disabled
        </Button>
      ) : null}
      {isPending ? <Text size="xs" color="muted">Submitting…</Text> : null}
    </div>
  );
}
