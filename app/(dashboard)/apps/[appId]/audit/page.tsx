import { gabAuditLogRepo, gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { AuditLogTable } from './_components/AuditLogTable';
import type { AuditLogPage, AuditLogQuery } from '@/lib/core/ports/audit-log.repository';

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{
    action?: string;
    tableId?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await featureGuard('app.audit');
  const { appId } = await params;
  const sp = await searchParams;

  const query: AuditLogQuery = {
    action: sp.action || undefined,
    tableId: sp.tableId || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    page: sp.page ? Number(sp.page) : 1,
    pageSize: sp.pageSize ? Number(sp.pageSize) : 25,
  };

  let data: AuditLogPage = { entries: [], total: 0, page: 1, pageSize: 25 };
  let tables: { id: string; name: string }[] = [];
  let loadError: string | null = null;
  try {
    const [auditRes, tablesRes] = await Promise.all([
      gabAuditLogRepo.listAppAudit(appId, query),
      gabTableRepo.listTables(appId).catch(() => ({ items: [], total: 0 })),
    ]);
    data = auditRes;
    tables = tablesRes.items.map((t) => ({ id: t.id, name: t.name }));
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load audit log';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load audit log</Text>
              <Text size="xs" color="muted">{loadError}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every privileged action across this app — schema changes, role assignments, record edits."
        condensed
      />
      <AuditLogTable
        entries={data.entries}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        tables={tables}
      />
    </div>
  );
}
