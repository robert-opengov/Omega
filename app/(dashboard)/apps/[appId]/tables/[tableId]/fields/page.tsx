import { gabFieldRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { FieldsEditor } from './_components/FieldsEditor';

export default async function FieldsPage({
  params,
}: {
  params: Promise<{ appId: string; tableId: string }>;
}) {
  await featureGuard('app.tables');
  const { appId, tableId } = await params;

  let fields: Awaited<ReturnType<typeof gabFieldRepo.listFields>> = { items: [], total: 0 };
  let loadError: string | null = null;
  try {
    fields = await gabFieldRepo.listFields(appId, tableId, { includeSystem: true });
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load fields';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load fields</Text>
              <Text size="xs" color="muted">{loadError}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FieldsEditor
      appId={appId}
      tableId={tableId}
      initialFields={fields.items}
    />
  );
}
