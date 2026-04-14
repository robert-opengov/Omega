'use client';

import { AlertTriangle } from 'lucide-react';
import { SectionHeader, BreakdownCard, ValueItem, ComposeInput, LabeledProgressRow } from '@/components/ui/molecules';
import type { BudgetSummary, ActivityItem, SubRecipientSpending, AwardDetail } from '@/lib/core/ports/grants.repository';

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface OverviewTabProps {
  budgetSummary: BudgetSummary;
  recentActivity: ActivityItem[];
  subRecipientSpending: SubRecipientSpending[];
  award: AwardDetail;
}

export function OverviewTab({ budgetSummary, recentActivity, subRecipientSpending, award }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <ComposeInput avatar={{ fallback: 'S' }} submitLabel="Post" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <BreakdownCard
            title="Budget Summary"
            description={`Total Award: $${(budgetSummary.totalAward / 1000).toFixed(0)}k`}
            segments={[
              { label: 'Expended', value: currencyFormat.format(budgetSummary.expended), sublabel: `${budgetSummary.expendedPercentage}%` },
              { label: 'Remaining', value: currencyFormat.format(budgetSummary.remaining), sublabel: `${budgetSummary.remainingPercentage}%` },
            ]}
            progressValue={budgetSummary.expendedPercentage}
            progressThresholds={{ warning: 75, danger: 90 }}
            details={[
              { label: 'Period Start', value: budgetSummary.periodStart },
              { label: 'Period End', value: budgetSummary.periodEnd },
              { label: 'Days Remaining', value: String(budgetSummary.daysRemaining) },
            ]}
            action={{ label: 'View Budget Detail' }}
          />

          <div className="space-y-2">
            <SectionHeader title="Recent Activity" />
            <div className="rounded border border-border bg-card p-4">
              {recentActivity.map((item) => (
                <ValueItem
                  key={item.id}
                  layout="row"
                  value={item.amount}
                  valueColor={item.amountType === 'debit' ? 'danger' : 'success'}
                  title={item.source}
                  description={item.description}
                  tag={item.category}
                  tagColor={item.categoryVariant}
                  timestamp={item.timestamp}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="space-y-2">
            <SectionHeader title="Sub-Recipient Spending" />
            <div className="rounded border border-border bg-card p-4">
              {subRecipientSpending.map((sr) => (
                <LabeledProgressRow
                  key={sr.name}
                  label={sr.name}
                  value={sr.percentage}
                  icon={sr.warning ? AlertTriangle : undefined}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeader title="Award Details" />
            <div className="rounded border border-border bg-card p-4 space-y-3">
              {[
                { label: 'FAIN', value: award.fain },
                { label: 'CFDA/ALN', value: award.cfda },
                { label: 'Performance Period', value: award.performancePeriod },
                { label: 'Risk Level', value: award.risk },
              ].map((d) => (
                <div key={d.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="text-sm font-medium text-foreground text-right">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
