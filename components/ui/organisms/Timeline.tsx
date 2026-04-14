'use client';

import type { ElementType, ReactNode } from 'react';
import { Circle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/atoms';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TimelineVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'inProgress'
  | 'muted';

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Date/time label rendered beside the title. */
  date?: ReactNode;
  /** Icon displayed inside the circle on the line. */
  icon?: ElementType;
  /** Semantic color for the icon circle. @default 'default' */
  variant?: TimelineVariant;
  /** Optional avatar rendered below the card content. */
  avatar?: { src?: string; fallback?: ReactNode; label?: ReactNode };
  /** Arbitrary content rendered below description. */
  children?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];

  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Alternate cards left/right (vertical) or above/below (horizontal). @default true */
  alternating?: boolean;
  /** Controls spacing, circle size, and card width. @default 'md' */
  size?: 'sm' | 'md' | 'lg';

  /** Custom renderer for each item's card content. */
  renderItem?: (item: TimelineItem, index: number) => ReactNode;
  /** Click handler for timeline items. */
  onItemClick?: (item: TimelineItem, index: number) => void;

  /** Custom class for the connecting line. */
  lineClassName?: string;
  /** Accessible label. @default 'Timeline' */
  ariaLabel?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  CVA Variants                                                       */
/* ------------------------------------------------------------------ */

const iconCircleVariants = cva(
  'relative flex items-center justify-center rounded-full shrink-0 z-content bg-background',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        success: 'bg-success-light border border-success-light-border text-success-text',
        warning: 'bg-warning-light border border-warning-light-border text-warning-text',
        danger: 'bg-danger-light border border-danger-light-border text-danger-text',
        info: 'bg-info-light border border-info-light-border text-info-text',
        inProgress: 'bg-in-progress-light border border-in-progress-light-border text-in-progress-text',
        muted: 'bg-muted border border-border text-muted-foreground',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

const ICON_SIZE: Record<string, string> = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };

const CARD_WIDTH: Record<string, string> = { sm: 'max-w-[200px]', md: 'max-w-[320px]', lg: 'max-w-[420px]' };

const HORIZ_CARD_WIDTH: Record<string, string> = { sm: 'w-44', md: 'w-56', lg: 'w-72' };

/* ------------------------------------------------------------------ */
/*  Shared Card                                                        */
/* ------------------------------------------------------------------ */

interface ItemCardProps {
  item: TimelineItem;
  index: number;
  size: string;
  onClick?: (item: TimelineItem, index: number) => void;
  renderItem?: (item: TimelineItem, index: number) => ReactNode;
  className?: string;
}

function ItemCard({ item, index, size, onClick, renderItem, className }: ItemCardProps) {
  const isClickable = !!onClick;

  const content = renderItem ? (
    renderItem(item, index)
  ) : (
    <>
      {item.date && (
        <p className="text-xs font-medium text-muted-foreground mb-1">{item.date}</p>
      )}
      <p className={cn('font-semibold text-foreground', size === 'sm' ? 'text-sm' : 'text-base')}>
        {item.title}
      </p>
      {item.description && (
        <div className={cn('mt-1.5 text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {item.description}
        </div>
      )}
      {item.children && <div className="mt-2">{item.children}</div>}
      {item.avatar && (
        <div className="flex items-center gap-1.5 mt-3">
          <Avatar
            src={item.avatar.src}
            fallback={item.avatar.fallback}
            size="sm"
            className="shrink-0"
          />
          {item.avatar.label && (
            <span className="text-xs text-muted-foreground truncate">{item.avatar.label}</span>
          )}
        </div>
      )}
    </>
  );

  const cardClassName = cn(
    'rounded-lg border border-border bg-card p-4 shadow-soft text-left transition-colors duration-200',
    isClickable && 'cursor-pointer hover:border-primary/40 hover:shadow-medium',
    className,
  );

  if (isClickable) {
    return (
      <button
        type="button"
        className={cardClassName}
        onClick={() => onClick(item, index)}
        aria-label={typeof item.title === 'string' ? item.title : undefined}
      >
        {content}
      </button>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

/* ------------------------------------------------------------------ */
/*  Icon Circle                                                        */
/* ------------------------------------------------------------------ */

function IconCircle({
  item,
  size,
}: {
  item: TimelineItem;
  size: NonNullable<VariantProps<typeof iconCircleVariants>['size']>;
}) {
  const Icon = item.icon ?? Circle;
  return (
    <div className={iconCircleVariants({ variant: item.variant, size })} aria-hidden="true">
      <Icon className={ICON_SIZE[size]} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vertical Timeline                                                  */
/* ------------------------------------------------------------------ */

function VerticalTimeline({
  items,
  alternating = true,
  size = 'md',
  renderItem,
  onItemClick,
  lineClassName,
}: Omit<TimelineProps, 'orientation' | 'ariaLabel' | 'className'>) {
  return (
    <div className="relative">
      {items.map((item, i) => {
        const isRight = alternating ? i % 2 !== 0 : true;

        return (
          <div key={item.id} className="relative flex">
            {/* ---- Alternating layout (md+ screens) ---- */}
            <div className="hidden md:flex items-start w-full">
              {alternating ? (
                <>
                  {/* Left side */}
                  <div className="flex-1 flex justify-end pr-6">
                    {!isRight && (
                      <ItemCard
                        item={item}
                        index={i}
                        size={size}
                        onClick={onItemClick}
                        renderItem={renderItem}
                        className={CARD_WIDTH[size]}
                      />
                    )}
                  </div>

                  {/* Center column: line + icon */}
                  <div className="relative flex flex-col items-center self-stretch">
                    <IconCircle item={item} size={size} />
                    {i < items.length - 1 && (
                      <div className={cn('w-px flex-1 min-h-8', lineClassName ?? 'bg-border')} />
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex-1 pl-6 pb-8">
                    {isRight && (
                      <ItemCard
                        item={item}
                        index={i}
                        size={size}
                        onClick={onItemClick}
                        renderItem={renderItem}
                        className={CARD_WIDTH[size]}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Left-aligned: icon column + card */}
                  <div className="relative flex flex-col items-center self-stretch shrink-0">
                    <IconCircle item={item} size={size} />
                    {i < items.length - 1 && (
                      <div className={cn('w-px flex-1 min-h-8', lineClassName ?? 'bg-border')} />
                    )}
                  </div>
                  <div className="pl-4 pb-8">
                    <ItemCard
                      item={item}
                      index={i}
                      size={size}
                      onClick={onItemClick}
                      renderItem={renderItem}
                      className={CARD_WIDTH[size]}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ---- Mobile: always left-aligned ---- */}
            <div className="flex md:hidden items-start">
              <div className="relative flex flex-col items-center self-stretch mr-4">
                <IconCircle item={item} size={size} />
                {i < items.length - 1 && (
                  <div className={cn('w-px flex-1 min-h-8', lineClassName ?? 'bg-border')} />
                )}
              </div>
              <div className="pb-6 flex-1 min-w-0">
                <ItemCard
                  item={item}
                  index={i}
                  size={size}
                  onClick={onItemClick}
                  renderItem={renderItem}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal Timeline                                                */
/* ------------------------------------------------------------------ */

const ICON_HEIGHTS: Record<string, number> = { sm: 32, md: 40, lg: 48 };
const CONNECTOR_GAP = 12;

function HorizontalTimelineInner({
  items,
  size = 'md',
  renderItem,
  onItemClick,
  lineClassName,
}: Omit<TimelineProps, 'orientation' | 'alternating' | 'ariaLabel' | 'className'>) {
  const iconH = ICON_HEIGHTS[size];
  const colCount = items.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="grid px-4"
        style={{
          minWidth: Math.max(600, colCount * 200),
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gridTemplateRows: `1fr ${iconH}px 1fr`,
          columnGap: 24,
        }}
      >
        {/* Spine line: real grid item spanning all columns in the icon row */}
        <div
          className="relative flex items-center"
          style={{ gridRow: 2, gridColumn: `1 / -1` }}
        >
          <div className={cn('absolute inset-x-0 h-px', lineClassName ?? 'bg-border')} />
        </div>

        {items.map((item, i) => {
          const isAbove = i % 2 === 0;

          return (
            <div key={item.id} className="contents">
              {/* Row 1: top card area */}
              <div
                className="flex flex-col items-center justify-end"
                style={{ gridRow: 1, gridColumn: i + 1 }}
              >
                {isAbove && (
                  <>
                    <ItemCard
                      item={item}
                      index={i}
                      size={size}
                      onClick={onItemClick}
                      renderItem={renderItem}
                      className={HORIZ_CARD_WIDTH[size]}
                    />
                    <div
                      className={cn('w-px shrink-0', lineClassName ?? 'bg-border')}
                      style={{ height: CONNECTOR_GAP }}
                    />
                  </>
                )}
              </div>

              {/* Row 2: icon on the spine */}
              <div
                className="relative flex items-center justify-center"
                style={{ gridRow: 2, gridColumn: i + 1 }}
              >
                <IconCircle item={item} size={size} />
              </div>

              {/* Row 3: bottom card area */}
              <div
                className="flex flex-col items-center justify-start"
                style={{ gridRow: 3, gridColumn: i + 1 }}
              >
                {!isAbove && (
                  <>
                    <div
                      className={cn('w-px shrink-0', lineClassName ?? 'bg-border')}
                      style={{ height: CONNECTOR_GAP }}
                    />
                    <ItemCard
                      item={item}
                      index={i}
                      size={size}
                      onClick={onItemClick}
                      renderItem={renderItem}
                      className={HORIZ_CARD_WIDTH[size]}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline (public API)                                              */
/* ------------------------------------------------------------------ */

export function Timeline({
  items,
  orientation = 'vertical',
  alternating = true,
  size = 'md',
  renderItem,
  onItemClick,
  lineClassName,
  ariaLabel = 'Timeline',
  className,
}: TimelineProps) {
  return (
    <div className={className} role="list" aria-label={ariaLabel}>
      {orientation === 'vertical' ? (
        <VerticalTimeline
          items={items}
          alternating={alternating}
          size={size}
          renderItem={renderItem}
          onItemClick={onItemClick}
          lineClassName={lineClassName}
        />
      ) : (
        <HorizontalTimelineInner
          items={items}
          size={size}
          renderItem={renderItem}
          onItemClick={onItemClick}
          lineClassName={lineClassName}
        />
      )}
    </div>
  );
}

export default Timeline;
