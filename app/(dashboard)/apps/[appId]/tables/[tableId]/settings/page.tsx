import { gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { TableSettingsForm } from './_components/TableSettingsForm';

export default async function TableSettingsPage({
  params,
}: {
  params: Promise<{ appId: string; tableId: string }>;
}) {
  await featureGuard('app.tables');
  const { appId, tableId } = await params;

  let table: Awaited<ReturnType<typeof gabTableRepo.getTable>> | null = null;
  let loadError: string | null = null;
  try {
    table = await gabTableRepo.getTable(appId, tableId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load table';
  }

  if (loadError || !table) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load table</Text>
              <Text size="xs" color="muted">{loadError ?? 'Unknown error'}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <TableSettingsForm appId={appId} table={table} />;
}
