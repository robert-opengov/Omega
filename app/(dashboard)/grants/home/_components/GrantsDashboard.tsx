'use client';

import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/atoms';
import { MetricCard } from '@/components/ui/molecules';
import {
  SectionHeader,
  InfoCard,
  ValueItem,
  DeadlineItem,
  Alert,
} from '@/components/ui/molecules';
import type { DashboardSummary, ComplianceFlag, Invoice, Deadline } from '@/lib/core/ports/grants.repository';

interface GrantsDashboardProps {
  summary: DashboardSummary;
  flags: ComplianceFlag[];
  invoices: Invoice[];
  deadlines: Deadline[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

function formatInvoiceAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(abs);
  return amount < 0 ? `-${formatted}` : formatted;
}

export function GrantsDashboard({ summary, flags, invoices, deadlines }: GrantsDashboardProps) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.25px] text-foreground">Good afternoon, Sarah</h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s the latest across your grants portfolio</p>
      </div>

      <Alert variant="warning">
        2 reports due within 10 days — DOJ COPS Hiring (Apr 21) and HUD Lead Hazard (Apr 19)
      </Alert>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Funds under management"
          value={formatCurrency(summary.fundsUnderManagement)}
          description={`across ${summary.activeGrants} active grants`}
        />
        <MetricCard
          title="Spend to date"
          value={formatCurrency(summary.spendToDate)}
          description={`${summary.spendPercentage}% of total`}
        />
        <MetricCard
          title="Reports due this month"
          value={String(summary.reportsDueThisMonth)}
          description={`Next: ${summary.nextReportDueDays} days`}
        />
        <MetricCard title="Open compliance flags" value={String(summary.openComplianceFlags)}>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="danger" size="sm" shape="pill">{summary.criticalFlags} critical</Badge>
            <Badge variant="warning" size="sm" shape="pill">{summary.warningFlags} warnings</Badge>
          </div>
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Compliance Flags */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Compliance Flags" description={`${flags.length} items need attention`} />
          <div className="space-y-3">
            {flags.map((flag) => (
              <InfoCard
                key={flag.id}
                title={flag.title}
                description={flag.description}
                badge={
                  <Badge variant={flag.severity === 'Critical' ? 'danger' : 'warning'} size="sm" shape="pill">
                    {flag.severity}
                  </Badge>
                }
                actions={[{ label: flag.actionLabel }]}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar: Invoices + Deadlines */}
        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeader title="Invoices" description="Pending approval" />
            {invoices.map((inv) => (
              <ValueItem
                key={inv.id}
                value={formatInvoiceAmount(inv.amount)}
                valueColor="danger"
                title={inv.organization}
                description={`${inv.grantName} \u00b7 ${inv.date}`}
                actions={[{ label: 'Approve' }, { label: 'Review' }]}
                meta={
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {inv.waitingDays} days waiting
                  </span>
                }
              />
            ))}
          </div>

          <div className="space-y-4">
            <SectionHeader title="Upcoming Deadlines" />
            {deadlines.map((dl) => (
              <DeadlineItem
                key={dl.id}
                month={dl.month}
                daysRemaining={dl.daysRemaining}
                title={dl.title}
                description={dl.subtitle}
                action={{ label: 'Start' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
