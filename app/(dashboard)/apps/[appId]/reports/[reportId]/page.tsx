import Link from 'next/link';
import {
  gabAppRepo,
  gabDataRepo,
  gabFieldRepo,
  gabReportRepo,
  gabTableRepo,
} from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Alert } from '@/components/ui/molecules';
import { ReportBuilder } from '@/components/_custom/ReportBuilder';

const ROW_LIMIT = 500;

export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ appId: string; reportId: string }>;
}) {
  await featureGuard('app.reports');
  const { appId, reportId } = await params;

  const [reportRes, tablesRes, appRes] = await Promise.allSettled([
    gabReportRepo.getReport(appId, reportId),
    gabTableRepo.listTables(appId),
    gabAppRepo.getApp(appId),
  ]);

  if (reportRes.status === 'rejected') {
    const msg =
      reportRes.reason instanceof Error
        ? reportRes.reason.message
        : 'Failed to load report.';
    return (
      <div className="space-y-3">
        <Link
          href={`/apps/${appId}/reports`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to reports
        </Link>
        <Alert variant="error">{msg}</Alert>
      </div>
    );
  }

  const report = reportRes.value;
  const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.items : [];
  const app = appRes.status === 'fulfilled' ? appRes.value : null;
  const appKey = app?.key ?? appId;

  const sourceTable = tables.find((t) => t.id === report.tableId);

  let fields: Awaited<ReturnType<typeof gabFieldRepo.listFields>>['items'] = [];
  if (report.tableId) {
    try {
      const res = await gabFieldRepo.listFields(appId, report.tableId);
      fields = res.items;
    } catch {
      fields = [];
    }
  }

  let rows: Awaited<ReturnType<typeof gabDataRepo.fetchRows>>['data'] = [];
  let rowsError: string | null = null;
  if (sourceTable) {
    try {
      const res = await gabDataRepo.fetchRows({
        applicationKey: appKey,
        tableKey: sourceTable.key,
        limit: ROW_LIMIT,
        offset: 0,
      });
      rows = res.data;
    } catch (err) {
      rowsError = err instanceof Error ? err.message : 'Failed to load records.';
    }
  }

  return (
    <ReportBuilder
      appId={appId}
      appKey={appKey}
      report={report}
      tables={tables}
      fields={fields}
      rows={rows}
      rowsError={rowsError}
    />
  );
}
