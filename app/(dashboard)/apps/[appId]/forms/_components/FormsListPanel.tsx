'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, Input, Select, Text } from '@/components/ui/atoms';
import { Card, CardContent, EmptyState, Modal } from '@/components/ui/molecules';
import {
  createFormAction,
  deleteFormAction,
  setDefaultFormAction,
  type ActionResult,
} from '@/app/actions/forms';
import type { GabForm } from '@/lib/core/ports/form.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import { useModuleEnabled } from '@/providers/module-flags-provider';
import { FORM_TEMPLATES, getFormTemplate } from '@/lib/forms/form-templates';
import { cn } from '@/lib/utils';

interface FormsListPanelProps {
  appId: string;
  initialForms: GabForm[];
  tables: GabTable[];
}

export function FormsListPanel({ appId, initialForms, tables }: Readonly<FormsListPanelProps>) {
  const [forms, setForms] = useState(initialForms);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [tableId, setTableId] = useState('');
  const [templateId, setTemplateId] = useState<string>('blank');
  const templatesEnabled = useModuleEnabled('app.formTemplates');

  const onCreate = () => {
    setError(null);
    startTransition(async () => {
      const tpl = templatesEnabled ? getFormTemplate(templateId) : undefined;
      const result = await createFormAction(appId, {
        name,
        tableId: tableId || undefined,
        ...(tpl && tpl.id !== 'blank' ? { layout: tpl.layout } : {}),
      });
      handleMutation(result, (created) => {
        setForms((prev) => [created, ...prev]);
        setCreateOpen(false);
        setName('');
        setTableId('');
        setTemplateId('blank');
      });
    });
  };

  const onDelete = (formId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteFormAction(appId, formId);
      handleMutation(result, () => {
        setForms((prev) => prev.filter((form) => form.id !== formId));
      });
    });
  };

  const onSetDefault = (formId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await setDefaultFormAction(appId, formId);
      handleMutation(result, () => {
        setForms((prev) => prev.map((form) => ({ ...form, isDefault: form.id === formId })));
      });
    });
  };

  const handleMutation = <T,>(result: ActionResult<T>, onSuccess: (data: T) => void) => {
    if (!result.success || !result.data) {
      setError(result.error ?? 'Request failed');
      return;
    }
    onSuccess(result.data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Forms</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New form
        </Button>
      </div>
      {error ? <Text size="sm" className="text-destructive">{error}</Text> : null}
      <Card>
        <CardContent className="p-4">
          {forms.length === 0 ? (
            <EmptyState title="No forms yet" description="Create your first form for this app." />
          ) : (
            <ul className="space-y-2">
              {forms.map((form) => (
                <li key={form.id} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{form.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.isDefault ? 'Default form' : 'Custom form'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/apps/${appId}/forms/${form.id}`}
                        className="inline-flex h-6 items-center rounded border border-border px-2 text-xs font-semibold text-foreground hover:bg-action-hover-primary"
                      >
                        Preview
                      </Link>
                      <Link
                        href={`/apps/${appId}/forms/${form.id}/builder`}
                        className="inline-flex h-6 items-center rounded border border-border px-2 text-xs font-semibold text-foreground hover:bg-action-hover-primary"
                      >
                        Edit
                      </Link>
                      <Button type="button" size="sm" variant="outline" onClick={() => onSetDefault(form.id)}>
                        Set default
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => onDelete(form.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Form"
        description="Start a new form and edit it in the builder."
        size={templatesEnabled ? 'lg' : 'md'}
      >
        <div className="space-y-3">
          <Input placeholder="Form name" value={name} onChange={(event) => setName(event.target.value)} />
          <Select value={tableId} onChange={(event) => setTableId(event.target.value)}>
            <option value="">No table</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </Select>
          {templatesEnabled && (
            <div className="space-y-1.5">
              <Text size="sm" weight="medium">Start from</Text>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FORM_TEMPLATES.map((tpl) => {
                  const selected = templateId === tpl.id;
                  return (
                    <li key={tpl.id}>
                      <button
                        type="button"
                        onClick={() => setTemplateId(tpl.id)}
                        aria-pressed={selected}
                        className={cn(
                          'w-full text-left rounded border p-3 transition-colors',
                          selected
                            ? 'border-primary ring-1 ring-primary bg-action-hover-primary/40'
                            : 'border-border hover:bg-action-hover-primary/20',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Text size="sm" weight="medium">{tpl.title}</Text>
                          <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {tpl.tag}
                          </span>
                        </div>
                        <Text size="xs" color="muted">{tpl.description}</Text>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending || !name.trim()} onClick={onCreate}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
