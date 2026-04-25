import { gabAppRepo, gabFieldRepo, gabFormRepo, gabTableRepo } from '@/lib/core';
import { Alert } from '@/components/ui/molecules';
import { FormPreviewPanel } from './_components/FormPreviewPanel';
import { toRuntimeField } from '@/components/_custom/FormRuntime/types';

export default async function FormPreviewPage({
  params,
}: {
  params: Promise<{ appId: string; formId: string }>;
}) {
  const { appId, formId } = await params;

  try {
    const form = await gabFormRepo.getForm(appId, formId);
    const [appRes, tableRes, fieldsRes] = await Promise.allSettled([
      gabAppRepo.getApp(appId),
      form.tableId ? gabTableRepo.getTable(appId, form.tableId) : Promise.resolve(null),
      form.tableId ? gabFieldRepo.listFields(appId, form.tableId) : Promise.resolve({ items: [], total: 0 }),
    ]);

    const applicationKey = appRes.status === 'fulfilled' ? appRes.value.key : undefined;
    const tableKey = tableRes.status === 'fulfilled' && tableRes.value ? tableRes.value.key : undefined;
    const fields =
      fieldsRes.status === 'fulfilled' ? fieldsRes.value.items.map(toRuntimeField) : [];

    return (
      <FormPreviewPanel
        form={form}
        fields={fields}
        applicationKey={applicationKey}
        tableKey={tableKey}
      />
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load form preview.';
    return <Alert variant="error" title="Could not load form preview">{message}</Alert>;
  }
}
