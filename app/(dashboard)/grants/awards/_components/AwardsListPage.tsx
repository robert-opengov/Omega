'use client';

import { Clock } from 'lucide-react';
import { SectionHeader, SummaryCard } from '@/components/ui/molecules';
import { Badge, Chip } from '@/components/ui/atoms';
import { ThresholdProgress } from '@/components/ui/atoms';
import type { Award, PaginatedResult } from '@/lib/core/ports/grants.repository';

interface AwardsListPageProps {
  awards: PaginatedResult<Award>;
  lastViewed: Award[];
}

const riskVariantMap = {
  High: 'danger' as const,
  Medium: 'warning' as const,
  Low: 'success' as const,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export function AwardsListPage({ awards, lastViewed }: AwardsListPageProps) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.25px] text-foreground">Active Awards</h1>
        <p className="text-sm text-muted-foreground mt-1">{awards.total} active grants</p>
      </div>

      {/* Last Viewed */}
      {lastViewed.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Last Viewed" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lastViewed.map((a) => (
              <SummaryCard
                key={a.id}
                title={a.name}
                description={a.fain}
                footer={
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Due: {a.nextReportDueDays} days
                  </span>
                }
                badge={<Chip label={a.risk} color={riskVariantMap[a.risk]} size="sm" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Awards Table */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs font-semibold text-muted-foreground">
              <th scope="col" className="px-4 py-3">Award Name</th>
              <th scope="col" className="px-4 py-3">Amount</th>
              <th scope="col" className="px-4 py-3">Utilization</th>
              <th scope="col" className="px-4 py-3">Next Report</th>
              <th scope="col" className="px-4 py-3">Risk</th>
              <th scope="col" className="px-4 py-3">Period End</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {awards.data.map((a) => (
              <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.fain}</p>
                </td>
                <td className="px-4 py-3 text-foreground">{formatCurrency(a.amount)}</td>
                <td className="px-4 py-3 w-40">
                  <ThresholdProgress value={a.utilization} size="sm" showLabel thresholds={{ warning: 75, danger: 90 }} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.nextReportDueDays} days</td>
                <td className="px-4 py-3">
                  <Chip label={a.risk} color={riskVariantMap[a.risk]} size="sm" />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.periodEnd}</td>
                <td className="px-4 py-3">
                  <Badge variant="success" size="sm" shape="pill">{a.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
