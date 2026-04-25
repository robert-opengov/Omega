'use client';

import { Activity, Database, GitBranch, Users, type LucideIcon } from 'lucide-react';
import { MetricCard } from '@/components/ui/molecules';

/**
 * Client wrapper around `MetricCard` so we can pass Lucide icon components
 * across the server → client boundary. Next.js 16 RSC strictly forbids
 * forwarding component references from a Server Component, so the icons
 * must be imported in a `'use client'` file.
 */

type IconKey = 'tables' | 'relationships' | 'roles' | 'activity';

const ICONS: Record<IconKey, LucideIcon> = {
  tables: Database,
  relationships: GitBranch,
  roles: Users,
  activity: Activity,
};

export interface OverviewMetric {
  iconKey: IconKey;
  title: string;
  value: string;
}

export function AppOverviewMetrics({ metrics }: { metrics: OverviewMetric[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          icon={ICONS[metric.iconKey]}
        />
      ))}
    </div>
  );
}
