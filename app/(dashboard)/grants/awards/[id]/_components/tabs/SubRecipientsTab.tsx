'use client';

import { Badge, Chip, Avatar } from '@/components/ui/atoms';
import { ThresholdProgress } from '@/components/ui/atoms';
import type { SubRecipient, PaginatedResult } from '@/lib/core/ports/grants.repository';

interface SubRecipientsTabProps {
  subRecipients: PaginatedResult<SubRecipient>;
}

const riskVariantMap = { High: 'danger' as const, Medium: 'warning' as const, Low: 'success' as const };

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function SubRecipientsTab({ subRecipients }: SubRecipientsTabProps) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr className="text-left text-xs font-semibold text-muted-foreground">
            <th scope="col" className="px-4 py-3">Organization</th>
            <th scope="col" className="px-4 py-3">Risk</th>
            <th scope="col" className="px-4 py-3">Next Monitoring</th>
            <th scope="col" className="px-4 py-3">Utilization</th>
            <th scope="col" className="px-4 py-3 text-right">Expended</th>
            <th scope="col" className="px-4 py-3">Invoice Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {subRecipients.data.map((sr) => (
            <tr key={sr.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar fallback={sr.organization.charAt(0)} size="sm" />
                  <div>
                    <p className="font-medium text-foreground">{sr.organization}</p>
                    {sr.ein && <p className="text-xs text-muted-foreground">EIN: {sr.ein}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Chip label={sr.risk} color={riskVariantMap[sr.risk]} size="sm" />
              </td>
              <td className="px-4 py-3">
                <span className="text-muted-foreground">{sr.nextMonitoringDue}</span>
                {sr.isOverdue && (
                  <Badge variant="danger" size="sm" shape="pill" className="ml-2">Overdue</Badge>
                )}
              </td>
              <td className="px-4 py-3 w-36">
                <ThresholdProgress value={sr.utilization} size="sm" showLabel thresholds={{ warning: 75, danger: 90 }} />
              </td>
              <td className="px-4 py-3 text-right text-foreground">{fmt(sr.expendedAmount)}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={sr.invoiceStatus === 'Approved' ? 'success' : sr.invoiceStatus === 'Under Review' ? 'warning' : 'default'}
                  size="sm"
                  shape="pill"
                >
                  {sr.invoiceStatus}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
