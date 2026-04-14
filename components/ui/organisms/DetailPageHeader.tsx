'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/atoms';
import { Breadcrumbs, type BreadcrumbItem, Tabs, TabsList, TabsTrigger } from '@/components/ui/molecules';

export interface DetailPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  metadata: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  tabs: Array<{ label: string; value: string; badge?: number }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function DetailPageHeader({
  breadcrumbs,
  title,
  description,
  badge,
  metadata,
  actions,
  tabs,
  activeTab,
  onTabChange,
  className,
}: DetailPageHeaderProps) {
  return (
    <div className={cn('border-b border-border bg-card', className)}>
      <div className="px-6 pt-4 space-y-2">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-[-0.25px] text-foreground">{title}</h1>
          {badge}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {metadata.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {metadata.map((m) => (
              <span key={m.label} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{m.label}:</span>{' '}
                {m.value}
              </span>
            ))}
          </div>
        )}

        {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="px-6 mt-2">
        <TabsList className="bg-transparent border-b-0 gap-0 h-auto p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {tab.label}
              {tab.badge !== undefined && (
                <Badge variant="danger" size="sm" shape="pill" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

export default DetailPageHeader;
