import { gabReportRepo, gabTableRepo } from '@/lib/core';
import { ReportsPanel } from './_components/ReportsPanel';

export default async function AppReportsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  const [reportsRes, tablesRes] = await Promise.allSettled([
    gabReportRepo.listReports(appId),
    gabTableRepo.listTables(appId),
  ]);

  const reports = reportsRes.status === 'fulfilled' ? reportsRes.value : [];
  const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.items : [];

  const initialError =
    reportsRes.status === 'rejected'
      ? reportsRes.reason instanceof Error
        ? reportsRes.reason.message
        : 'Failed to load reports.'
      : null;

  return (
    <ReportsPanel
      appId={appId}
      initialReports={reports}
      tables={tables}
      initialError={initialError}
    />
  );
}
