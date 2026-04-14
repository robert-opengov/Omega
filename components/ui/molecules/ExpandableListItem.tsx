'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button, type BadgeVariant } from '@/components/ui/atoms';
import type { ComponentAction } from '@/components/ui/types';

export interface ExpandableListItemSection {
  label: ReactNode;
  content: ReactNode;
}

export interface ExpandableListItemProps {
  title: ReactNode;
  description?: ReactNode;
  status: { label: string; variant: BadgeVariant };
  /** Arbitrary expandable content sections */
  sections?: ExpandableListItemSection[];
  actions?: ComponentAction[];
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableListItem({
  title,
  description,
  status,
  sections,
  actions,
  defaultExpanded = false,
  className,
}: ExpandableListItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasExpandableContent = (sections && sections.length > 0) || (actions && actions.length > 0);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className={cn('border-b border-border py-3', className)}>
      <button
        type="button"
        className="flex w-full items-start gap-2 text-left"
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
        disabled={!hasExpandableContent}
        aria-expanded={hasExpandableContent ? expanded : undefined}
      >
        {hasExpandableContent && (
          <Chevron className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        {!hasExpandableContent && <span className="w-4 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Badge variant={status.variant} size="sm" shape="pill" className="shrink-0">
          {status.label}
        </Badge>
      </button>

      {expanded && hasExpandableContent && (
        <div className="ml-6 mt-3 space-y-3">
          {sections?.map((section, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-semibold text-foreground">{section.label}</p>
              <div className="text-xs text-muted-foreground">{section.content}</div>
            </div>
          ))}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={action.onClick}
                  icon={action.icon}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExpandableListItem;
