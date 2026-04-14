'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/atoms';
import { DetailPageHeader } from '@/components/ui/organisms';
import { OverviewTab } from './tabs/OverviewTab';
import { BudgetTab } from './tabs/BudgetTab';
import { ComplianceTab } from './tabs/ComplianceTab';
import { ReportsTab } from './tabs/ReportsTab';
import { SubRecipientsTab } from './tabs/SubRecipientsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import type {
  AwardDetail,
  BudgetSummary,
  BudgetLine,
  Drawdown,
  Expenditure,
  FinSyncEntry,
  Condition,
  ComplianceAlert,
  Report,
  Milestone,
  SubRecipient,
  GrantDocument,
  ActivityItem,
  SubRecipientSpending,
  PaginatedResult,
} from '@/lib/core/ports/grants.repository';

interface AwardDetailViewProps {
  award: AwardDetail;
  budgetSummary: BudgetSummary;
  budgetLines: PaginatedResult<BudgetLine>;
  drawdowns: PaginatedResult<Drawdown>;
  expenditures: PaginatedResult<Expenditure>;
  finSyncLog: PaginatedResult<FinSyncEntry>;
  conditions: Condition[];
  complianceAlerts: ComplianceAlert[];
  reports: Report[];
  milestones: Milestone[];
  subRecipients: PaginatedResult<SubRecipient>;
  documents: PaginatedResult<GrantDocument>;
  recentActivity: ActivityItem[];
  subRecipientSpending: SubRecipientSpending[];
}

const TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Budget & Drawdowns', value: 'budget' },
  { label: 'Compliance', value: 'compliance', badge: 2 },
  { label: 'Reports', value: 'reports' },
  { label: 'Sub-Recipients', value: 'sub-recipients' },
  { label: 'Documents', value: 'documents' },
];

export function AwardDetailView({
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
}: AwardDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const breadcrumbs = [
    { label: 'Grants', href: '/grants' },
    { label: 'Awards', href: '/grants/awards' },
    { label: award.name },
  ];

  const metadata = [
    { label: 'FAIN', value: award.fain },
    { label: 'Award', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(award.amount) },
    { label: 'CFDA/ALN', value: award.cfda },
    { label: 'Performance Period', value: award.performancePeriod },
  ];

  return (
    <div>
      <DetailPageHeader
        breadcrumbs={breadcrumbs}
        title={award.name}
        description={award.fain}
        badge={
          <Badge variant={award.risk === 'High' ? 'danger' : award.risk === 'Medium' ? 'warning' : 'success'} size="sm" shape="pill">
            {award.risk === 'High' ? 'High-Risk' : award.risk}
          </Badge>
        }
        metadata={metadata}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            budgetSummary={budgetSummary}
            recentActivity={recentActivity}
            subRecipientSpending={subRecipientSpending}
            award={award}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetTab
            budgetSummary={budgetSummary}
            budgetLines={budgetLines}
            drawdowns={drawdowns}
            expenditures={expenditures}
            finSyncLog={finSyncLog}
          />
        )}
        {activeTab === 'compliance' && (
          <ComplianceTab conditions={conditions} alerts={complianceAlerts} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab reports={reports} milestones={milestones} />
        )}
        {activeTab === 'sub-recipients' && (
          <SubRecipientsTab subRecipients={subRecipients} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab documents={documents} />
        )}
      </div>
    </div>
  );
}
