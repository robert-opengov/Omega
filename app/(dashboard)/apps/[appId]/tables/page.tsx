import { gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { TablesList } from './_components/TablesList';

export default async function TablesPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.tables');
  const { appId } = await params;

  let tables: Awaited<ReturnType<typeof gabTableRepo.listTables>> = { items: [], total: 0 };
  let loadError: string | null = null;
  try {
    tables = await gabTableRepo.listTables(appId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load tables';
  }

  return (
    <TablesList
      appId={appId}
      initialTables={tables.items}
      loadError={loadError}
    />
  );
}
