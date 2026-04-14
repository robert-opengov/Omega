'use client';

import type { ReactNode, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/atoms';
import { MessageSquare, ArrowRightLeft, UserCheck, Bell, StickyNote } from 'lucide-react';

export type ActivityVariant = 'comment' | 'status' | 'assignment' | 'system' | 'note';

export interface ActivityItem {
  id: string;
  variant?: ActivityVariant;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  avatar?: { src?: string; fallback?: ReactNode };
  icon?: ElementType;
  children?: ReactNode;
}

const iconCircleVariants = cva(
  'flex items-center justify-center rounded-full shrink-0 z-content',
  {
    variants: {
      variant: {
        comment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        status: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        assignment: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        system: 'bg-muted text-muted-foreground',
        note: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      },
      size: {
        sm: 'h-7 w-7',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'system', size: 'md' },
  },
);

const iconSizeMap = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

const defaultIcons: Record<ActivityVariant, ElementType> = {
  comment: MessageSquare,
  status: ArrowRightLeft,
  assignment: UserCheck,
  system: Bell,
  note: StickyNote,
};

export interface ActivityFeedProps {
  items: ActivityItem[];
  size?: VariantProps<typeof iconCircleVariants>['size'];
  emptyMessage?: ReactNode;
  renderItem?: (item: ActivityItem, index: number) => ReactNode;
  className?: string;
}

/**
 * Vertical activity feed with left-side avatar/icon column, connecting
 * lines between items, and variant-based styling.
 */
export function ActivityFeed({
  items,
  size = 'md',
  emptyMessage = 'No activity yet.',
  renderItem,
  className,
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8 text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} role="feed" aria-label="Activity feed">
      {items.map((item, index) => {
        if (renderItem) return renderItem(item, index);

        const variant = item.variant ?? 'system';
        const Icon = item.icon ?? defaultIcons[variant];
        const isLast = index === items.length - 1;

        return (
          <article key={item.id} className="relative flex gap-3" aria-posinset={index + 1} aria-setsize={items.length}>
            {/* Icon column with connector line */}
            <div className="flex flex-col items-center">
              {item.avatar ? (
                <Avatar
                  src={item.avatar.src}
                  fallback={typeof item.avatar.fallback === 'string' ? item.avatar.fallback : '?'}
                  size={size === 'lg' ? 'md' : 'sm'}
                  className="shrink-0 z-content"
                />
              ) : (
                <div className={iconCircleVariants({ variant, size })}>
                  <Icon className={iconSizeMap[size ?? 'md']} aria-hidden="true" />
                </div>
              )}
              {!isLast && (
                <div className="w-px flex-1 bg-border self-stretch min-h-4" />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 min-w-0 pb-6', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground font-medium">{item.title}</p>
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{item.timestamp}</span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
              )}
              {item.children && (
                <div className="mt-2">{item.children}</div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default ActivityFeed;
