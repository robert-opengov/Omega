import { gabFieldRepo } from '@/lib/core';
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

  let fields: Awaited<ReturnType<typeof gabFieldRepo.listFields>> = { items: [], total: 0 };
  let loadError: string | null = null;
  try {
    fields = await gabFieldRepo.listFields(appId, tableId);
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
    <RecordsGrid
      appId={appId}
      tableId={tableId}
      fields={fields.items}
      title="Records"
    />
  );
}
