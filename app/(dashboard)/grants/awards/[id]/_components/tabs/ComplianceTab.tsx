'use client';

import type { ElementType, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { StatusDot } from '@/components/ui/atoms';
import { SectionHeader, ExpandableListItem, InfoCard } from '@/components/ui/molecules';
import { UILink } from '@/components/ui/atoms';
import { FileText } from 'lucide-react';
import type { Condition, ComplianceAlert } from '@/lib/core/ports/grants.repository';

const conditionStatusMap: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' | 'inProgress' }> = {
  'Met': { label: 'Met', variant: 'success' },
  'In Progress': { label: 'In Progress', variant: 'inProgress' },
  'N/A': { label: 'N/A', variant: 'default' },
  'Not Met': { label: 'Not Met', variant: 'danger' },
};

const alertIconMap: Record<string, ElementType | ReactNode> = {
  ai: Sparkles,
  pending: <StatusDot color="primary" size="md" className="mt-1.5" />,
  warning: <StatusDot color="warning" size="md" className="mt-1.5" />,
};

interface ComplianceTabProps {
  conditions: Condition[];
  alerts: ComplianceAlert[];
}

export function ComplianceTab({ conditions, alerts }: ComplianceTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Conditions list */}
      <div className="lg:col-span-2 space-y-4">
        <SectionHeader title="Conditions" description={`${conditions.length} conditions`} />
        <div>
          {conditions.map((c) => (
            <ExpandableListItem
              key={c.id}
              title={c.title}
              description={c.subtitle}
              status={conditionStatusMap[c.status] ?? { label: c.status, variant: 'default' as const }}
              sections={[
                ...(c.evidence?.length ? [{
                  label: 'Evidence:' as React.ReactNode,
                  content: (
                    <div className="space-y-1">
                      {c.evidence.map((link: { label: string; href: string }) => (
                        <UILink key={link.href} href={link.href} size="sm" className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {link.label}
                        </UILink>
                      ))}
                    </div>
                  ) as React.ReactNode,
                }] : []),
                ...(c.notes ? [{ label: 'Note:' as React.ReactNode, content: c.notes as React.ReactNode }] : []),
              ]}
              actions={[{ label: 'Upload Evidence', variant: 'outline' as const }]}
            />
          ))}
        </div>
      </div>

      {/* AI Compliance Alerts sidebar */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground">AI Compliance Alerts</h3>
        </div>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <InfoCard
              key={alert.id}
              title={alert.title}
              description={alert.description}
              icon={alertIconMap[alert.icon] ?? Sparkles}
              variant={alert.highlighted ? 'highlighted' : 'default'}
              actions={[{ label: 'Review' }]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
