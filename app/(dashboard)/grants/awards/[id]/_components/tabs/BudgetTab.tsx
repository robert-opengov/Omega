'use client';

import { useState } from 'react';
import { Badge, Chip, ThresholdProgress } from '@/components/ui/atoms';
import { MetricCard } from '@/components/ui/molecules';
import { SectionHeader } from '@/components/ui/molecules';
import type { BudgetSummary, BudgetLine, Drawdown, Expenditure, FinSyncEntry, PaginatedResult } from '@/lib/core/ports/grants.repository';

type SubView = 'budget' | 'drawdowns' | 'expenditures' | 'finsync';

interface BudgetTabProps {
  budgetSummary: BudgetSummary;
  budgetLines: PaginatedResult<BudgetLine>;
  drawdowns: PaginatedResult<Drawdown>;
  expenditures: PaginatedResult<Expenditure>;
  finSyncLog: PaginatedResult<FinSyncEntry>;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

const methodVariant: Record<string, 'primary' | 'info'> = { ASAP: 'primary', Manual: 'info' };
const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = { Paid: 'success', Pending: 'warning', Rejected: 'danger' };

export function BudgetTab({ budgetSummary, budgetLines, drawdowns, expenditures, finSyncLog }: BudgetTabProps) {
  const [view, setView] = useState<SubView>('budget');

  const subViews: { label: string; value: SubView }[] = [
    { label: 'Budget vs. Actual', value: 'budget' },
    { label: 'Drawdowns', value: 'drawdowns' },
    { label: 'Expenditures', value: 'expenditures' },
    { label: 'FIN Sync Log', value: 'finsync' },
  ];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Period Elapsed" value={`${budgetSummary.periodElapsedPercentage}%`} description={`${budgetSummary.daysRemaining} days remaining`} />
        <MetricCard title="Budget Utilized" value={`${budgetSummary.utilizedPercentage}%`} description={fmt(budgetSummary.expended)}>
          <ThresholdProgress value={budgetSummary.utilizedPercentage} size="sm" thresholds={{ warning: 75, danger: 90 }} className="mt-2" />
        </MetricCard>
        <MetricCard title="Remaining Balance" value={fmt(budgetSummary.remaining)} description={`${budgetSummary.remainingPercentage}% of total`} />
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 rounded border border-border bg-muted p-1 w-fit">
        {subViews.map((sv) => (
          <button
            key={sv.value}
            type="button"
            onClick={() => setView(sv.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${view === sv.value ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {sv.label}
          </button>
        ))}
      </div>

      {view === 'budget' && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left text-xs font-semibold text-muted-foreground">
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3 text-right">Budgeted</th>
                <th scope="col" className="px-4 py-3 text-right">Expended</th>
                <th scope="col" className="px-4 py-3 text-right">Encumbered</th>
                <th scope="col" className="px-4 py-3 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {budgetLines.data.map((line) => (
                <tr key={line.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{line.category}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(line.budgeted)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(line.expended)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(line.encumbered)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(line.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'drawdowns' && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left text-xs font-semibold text-muted-foreground">
                <th scope="col" className="px-4 py-3">Ref</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3 text-right">Amount</th>
                <th scope="col" className="px-4 py-3">Method</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drawdowns.data.map((d) => (
                <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-foreground">{d.ref}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(d.amount)}</td>
                  <td className="px-4 py-3"><Chip label={d.method} color={methodVariant[d.method] ?? 'primary'} size="sm" /></td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[d.status] ?? 'default'} size="sm" shape="pill">{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'expenditures' && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left text-xs font-semibold text-muted-foreground">
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Vendor</th>
                <th scope="col" className="px-4 py-3 text-right">Amount</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenditures.data.map((e) => (
                <tr key={e.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3 text-foreground">{e.vendor}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(e.amount)}</td>
                  <td className="px-4 py-3"><Chip label={e.category} size="sm" /></td>
                  <td className="px-4 py-3"><Chip label={e.source} color={e.source === 'FIN' ? 'primary' : 'info'} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'finsync' && (
        <div className="space-y-4">
          <SectionHeader title="FIN Sync Log" description="Last sync: Apr 13, 2026 at 3:42 PM" />
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Transaction</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {finSyncLog.data.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{entry.timestamp}</td>
                    <td className="px-4 py-3 text-foreground">{entry.transaction}</td>
                    <td className="px-4 py-3 text-right text-foreground">{fmt(entry.amount)}</td>
                    <td className="px-4 py-3"><Chip label={entry.category} size="sm" /></td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.source === 'Synced' ? 'success' : 'warning'} size="sm" shape="pill">
                        {entry.source}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
