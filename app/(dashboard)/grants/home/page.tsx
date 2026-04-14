import { grantsRepo } from '@/lib/core';
import { GrantsDashboard } from './_components/GrantsDashboard';

export default async function GrantsHomePage() {
  const [summary, flags, invoices, deadlines] = await Promise.all([
    grantsRepo.getDashboardSummary(),
    grantsRepo.getComplianceFlags(),
    grantsRepo.getRecentInvoices(),
    grantsRepo.getUpcomingDeadlines(),
  ]);

  return (
    <GrantsDashboard
      summary={summary}
      flags={flags}
      invoices={invoices}
      deadlines={deadlines}
    />
  );
}
