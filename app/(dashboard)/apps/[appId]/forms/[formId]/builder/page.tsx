import { gabFieldRepo, gabFormRepo } from '@/lib/core';
import { Alert } from '@/components/ui/molecules';
import { FormBuilder } from '@/components/_custom/FormBuilder';
import { toRuntimeField } from '@/components/_custom/FormRuntime/types';

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ appId: string; formId: string }>;
}) {
  const { appId, formId } = await params;

  try {
    const form = await gabFormRepo.getForm(appId, formId);
    const fields = form.tableId
      ? (await gabFieldRepo.listFields(appId, form.tableId)).items.map(toRuntimeField)
      : [];

    return <FormBuilder appId={appId} form={form} fields={fields} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load form builder.';
    return <Alert variant="error" title="Could not load form builder">{message}</Alert>;
  }
}
