'use client';

import { CheckCircle, Clock, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/atoms';
import { SectionHeader, SummaryCard } from '@/components/ui/molecules';
import { Timeline, type TimelineItem } from '@/components/ui/organisms';
import type { Report, Milestone } from '@/lib/core/ports/grants.repository';

const reportStatusMap: Record<string, 'default' | 'inProgress' | 'success'> = {
  'Draft': 'default',
  'Not Started': 'default',
  'In Progress': 'inProgress',
  'Submitted': 'success',
};

interface ReportsTabProps {
  reports: Report[];
  milestones: Milestone[];
}

export function ReportsTab({ reports, milestones }: ReportsTabProps) {
  const nowReports = reports.filter((r) => r.group === 'now');
  const nextReports = reports.filter((r) => r.group === 'next');

  return (
    <div className="space-y-6">
      {/* Now */}
      {nowReports.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Now" description="Reports due this period" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nowReports.map((r) => (
              <SummaryCard
                key={r.id}
                title={r.title}
                size="sm"
                footer={
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Due: {r.dueDate}
                  </span>
                }
                badge={
                  <Badge variant={reportStatusMap[r.status] ?? 'default'} size="sm" shape="pill">
                    {r.status}
                  </Badge>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Next */}
      {nextReports.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Next" description="Upcoming reports" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nextReports.map((r) => (
              <SummaryCard
                key={r.id}
                title={r.title}
                size="sm"
                footer={
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Due: {r.dueDate}
                  </span>
                }
                badge={
                  <Badge variant={reportStatusMap[r.status] ?? 'default'} size="sm" shape="pill">
                    {r.status}
                  </Badge>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {milestones.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Milestones" />
          <Timeline
            items={milestones.map((m): TimelineItem => ({
              id: m.id,
              title: m.title,
              date: m.date,
              icon: m.completed ? CheckCircle : Circle,
              variant: m.completed ? 'success' : 'default',
              avatar: m.assignee ? { fallback: m.assignee.name.charAt(0), src: m.assignee.avatar, label: m.assignee.name } : undefined,
            }))}
            orientation="horizontal"
          />
        </div>
      )}
    </div>
  );
}
