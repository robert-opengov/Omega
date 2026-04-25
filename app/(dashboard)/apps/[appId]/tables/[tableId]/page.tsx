import { gabAppRepo, gabFieldRepo, gabTableRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { RecordsGrid } from '@/components/_custom/RecordsGrid';

export default async function TableRecordsPage({
  params,
}: {
  params: Promise<{ appId: string; tableId: string }>;
}) {
  const { appId, tableId } = await params;

  const [fieldsResult, appResult, tableResult] = await Promise.allSettled([
    gabFieldRepo.listFields(appId, tableId),
    gabAppRepo.getApp(appId),
    gabTableRepo.getTable(appId, tableId),
  ]);

  const loadError =
    fieldsResult.status === 'rejected'
      ? fieldsResult.reason instanceof Error
        ? fieldsResult.reason.message
        : 'Failed to load fields'
      : null;

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

  const fields = fieldsResult.status === 'fulfilled' ? fieldsResult.value : { items: [], total: 0 };
  const app = appResult.status === 'fulfilled' ? appResult.value : null;
  const table = tableResult.status === 'fulfilled' ? tableResult.value : null;

  return (
    <RecordsGrid
      appId={appId}
      tableId={tableId}
      applicationKey={app?.key ?? appId}
      tableKey={table?.key ?? tableId}
      fields={fields.items}
      title="Records"
      editable
    />
  );
}
