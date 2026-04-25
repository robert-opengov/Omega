'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Button, Text } from '@/components/ui/atoms';
import type { GabForm, PublicFormField, PublicFormSettings } from '@/lib/core/ports/form.repository';
import { toRuntimeField, type RuntimeField } from '@/components/_custom/FormRuntime/types';
import { FormLayoutRenderer } from '@/components/_custom/FormRuntime';
import { submitPublicFormAction } from '@/app/actions/public-forms';

interface PublicFormRunnerProps {
  token: string;
  form: GabForm;
  fields: PublicFormField[];
  settings: PublicFormSettings;
}

export function PublicFormRunner({ token, form, fields, settings }: Readonly<PublicFormRunnerProps>) {
  const runtimeFields = useMemo(() => fields.map(toRuntimeField), [fields]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const redirectDelayMs = Number(settings.redirectDelayMs ?? 2000);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitPublicFormAction(token, { ...values, __honeypot: honeypot });
      if (!result.success || !result.data) {
        setError(result.error ?? 'Failed to submit form.');
        return;
      }

      setSuccess(result.data.confirmationMessage);
      const redirectUrl = result.data.redirectUrl;
      if (redirectUrl) {
        setTimeout(() => {
          window.location.assign(redirectUrl);
        }, Number.isFinite(redirectDelayMs) ? redirectDelayMs : 2000);
      }
    });
  };

  useEffect(() => {
    const initialValues: Record<string, unknown> = {};
    runtimeFields.forEach((field) => {
      if (field.defaultValue != null) initialValues[field.key] = field.defaultValue;
    });
    setValues(initialValues);
  }, [runtimeFields]);

  if (success) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-foreground">Submission received</h1>
        <Text size="sm" color="muted">{success}</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{form.name}</h1>
      {form.description ? <Text size="sm" color="muted">{form.description}</Text> : null}
      {error ? <Text size="sm" className="text-destructive">{error}</Text> : null}
      <input
        type="text"
        name="__honeypot"
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
      />
      <FormLayoutRenderer
        form={form}
        fields={runtimeFields}
        values={values}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        onSubmit={submit}
      />
      <Button type="button" onClick={submit} disabled={isPending}>
        {isPending ? 'Submitting…' : 'Submit'}
      </Button>
    </div>
  );
}
