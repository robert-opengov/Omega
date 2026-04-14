import { grantsRepo } from '@/lib/core';
import { AwardDetailView } from './_components/AwardDetailView';

interface AwardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AwardDetailPage({ params }: AwardDetailPageProps) {
  const { id } = await params;

  const [
    award,
    budgetSummary,
    budgetLines,
    drawdowns,
    expenditures,
    finSyncLog,
    conditions,
    complianceAlerts,
    reports,
    milestones,
    subRecipients,
    documents,
    recentActivity,
    subRecipientSpending,
  ] = await Promise.all([
    grantsRepo.getAward(id),
    grantsRepo.getBudgetSummary(id),
    grantsRepo.getBudgetVsActual(id),
    grantsRepo.getDrawdowns(id),
    grantsRepo.getExpenditures(id),
    grantsRepo.getFinSyncLog(id),
    grantsRepo.getConditions(id),
    grantsRepo.getComplianceAlerts(id),
    grantsRepo.getReports(id),
    grantsRepo.getMilestones(id),
    grantsRepo.getSubRecipients(id),
    grantsRepo.getDocuments(id),
    grantsRepo.getRecentActivity(id),
    grantsRepo.getSubRecipientSpending(id),
  ]);

  return (
    <AwardDetailView
      award={award}
      budgetSummary={budgetSummary}
      budgetLines={budgetLines}
      drawdowns={drawdowns}
      expenditures={expenditures}
      finSyncLog={finSyncLog}
      conditions={conditions}
      complianceAlerts={complianceAlerts}
      reports={reports}
      milestones={milestones}
      subRecipients={subRecipients}
      documents={documents}
      recentActivity={recentActivity}
      subRecipientSpending={subRecipientSpending}
    />
  );
}
