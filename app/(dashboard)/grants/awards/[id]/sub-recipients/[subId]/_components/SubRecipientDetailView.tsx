'use client';

import { Badge, Button } from '@/components/ui/atoms';
import { Breadcrumbs, BreakdownCard, SectionHeader } from '@/components/ui/molecules';
import type { AwardDetail, SubRecipientDetail } from '@/lib/core/ports/grants.repository';

interface SubRecipientDetailViewProps {
  award: AwardDetail;
  detail: SubRecipientDetail;
}

const invoiceStatusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  Approved: 'success',
  'Under Review': 'warning',
  Rejected: 'danger',
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function SubRecipientDetailView({ award, detail }: SubRecipientDetailViewProps) {
  const breadcrumbs = [
    { label: 'Grants', href: '/grants' },
    { label: 'Awards', href: '/grants/awards' },
    { label: award.name, href: `/grants/awards/${award.id}` },
    { label: 'Sub-Recipients', href: `/grants/awards/${award.id}` },
    { label: detail.organization },
  ];

  const bs = detail.budgetSummary;

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.25px] text-foreground">{detail.organization}</h1>
        <p className="text-sm text-muted-foreground mt-1">EIN: {detail.ein}</p>
      </div>

      <BreakdownCard
        title="Utilization Summary"
        segments={[
          { label: 'Expended', value: fmt(bs.expended), sublabel: `${bs.expendedPercentage}%` },
          { label: 'Remaining', value: fmt(bs.remaining), sublabel: `${bs.remainingPercentage}%` },
        ]}
        progressValue={bs.expendedPercentage}
        progressThresholds={{ warning: 75, danger: 90 }}
        details={[
          { label: 'Period Start', value: bs.periodStart },
          { label: 'Period End', value: bs.periodEnd },
          { label: 'Days Remaining', value: String(bs.daysRemaining) },
        ]}
      />

      <div className="space-y-4">
        <SectionHeader title="Invoices" description={`${detail.invoices.length} invoices`} />
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left text-xs font-semibold text-muted-foreground">
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3 text-right">Amount</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {detail.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={invoiceStatusVariant[inv.status] ?? 'default'} size="sm" shape="pill">
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">Approve</Button>
                      <Button variant="ghost" size="sm">Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
