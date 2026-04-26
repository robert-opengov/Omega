import { gabRelationshipRepo, gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { RelationshipsList } from './_components/RelationshipsList';

export default async function RelationshipsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.relationships');
  const { appId } = await params;

  const [relationshipsResult, tablesResult] = await Promise.allSettled([
    gabRelationshipRepo.listRelationships(appId),
    gabTableRepo.listTables(appId),
  ]);

  const loadError =
    relationshipsResult.status === 'rejected'
      ? relationshipsResult.reason instanceof Error
        ? relationshipsResult.reason.message
        : 'Failed to load relationships'
      : tablesResult.status === 'rejected'
        ? tablesResult.reason instanceof Error
          ? tablesResult.reason.message
          : 'Failed to load tables'
        : null;

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load relationships</Text>
              <Text size="xs" color="muted">{loadError}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const relationships =
    relationshipsResult.status === 'fulfilled' ? relationshipsResult.value.items : [];
  const tables = tablesResult.status === 'fulfilled' ? tablesResult.value.items : [];

  return (
    <RelationshipsList
      appId={appId}
      initialRelationships={relationships}
      tables={tables}
    />
  );
}
