'use client';

import type { ReactNode, KeyboardEvent } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Avatar, Tooltip } from '@/components/ui/atoms';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type GanttEventVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'inProgress'
  | 'muted';

export interface GanttEvent {
  id: string;
  /** 0-based column index where the event starts. Supports fractions (1.5 = mid-column). */
  start: number;
  /** 0-based column index where the event ends. */
  end: number;
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: GanttEventVariant;
  /** Shown in a Tooltip on hover. */
  tooltip?: ReactNode;
  className?: string;
}

export interface GanttRow {
  id: string;
  label: ReactNode;
  sublabel?: ReactNode;
  avatar?: { src?: string; fallback?: ReactNode };
  events: GanttEvent[];
}

export interface GanttChartProps {
  /** Column header labels for the time axis. */
  columns: ReactNode[];
  rows: GanttRow[];

  /** Width of each time column in px. @default 120 */
  columnWidth?: number;
  /** Width of the sticky resource column in px. @default 200 */
  resourceWidth?: number;
  /** Row height / density. @default 'md' */
  size?: 'sm' | 'md' | 'lg';

  /** Fractional column position for a "now" indicator line. */
  nowIndicator?: number;
  /** Alternate row backgrounds for readability. @default true */
  striped?: boolean;
  /** Label for the resource column header. @default 'Resource' */
  resourceLabel?: ReactNode;

  /** Override the default event block rendering. */
  renderEvent?: (event: GanttEvent, row: GanttRow) => ReactNode;
  /** Override the default resource cell rendering. */
  renderResource?: (row: GanttRow) => ReactNode;
  /** Override how each column header renders. */
  renderColumnHeader?: (column: ReactNode, index: number) => ReactNode;

  onEventClick?: (event: GanttEvent, row: GanttRow) => void;
  onRowClick?: (row: GanttRow) => void;

  /** Accessible label for the grid. @default 'Schedule chart' */
  ariaLabel?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  CVA Variants                                                       */
/* ------------------------------------------------------------------ */

const ganttEventVariants = cva(
  'absolute top-1/2 -translate-y-1/2 rounded-md px-2.5 overflow-hidden transition-shadow duration-200 min-w-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary-light border border-primary-light-border text-primary-text',
        success: 'bg-success-light border border-success-light-border text-success-text',
        warning: 'bg-warning-light border border-warning-light-border text-warning-text',
        danger: 'bg-danger-light border border-danger-light-border text-danger-text',
        info: 'bg-info-light border border-info-light-border text-info-text',
        inProgress: 'bg-in-progress-light border border-in-progress-light-border text-in-progress-text',
        muted: 'bg-muted border border-border text-muted-foreground',
      },
      size: {
        sm: 'py-0.5 text-[11px] leading-tight',
        md: 'py-1.5 text-xs leading-snug',
        lg: 'py-2 text-sm leading-snug',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

const ROW_HEIGHT: Record<string, string> = {
  sm: 'h-12',
  md: 'h-[72px]',
  lg: 'h-24',
};

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

function DefaultResource({ row }: { row: GanttRow }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {row.avatar && (
        <Avatar
          src={row.avatar.src}
          fallback={row.avatar.fallback}
          size="sm"
          className="shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{row.label}</p>
        {row.sublabel && (
          <p className="text-xs text-muted-foreground truncate">{row.sublabel}</p>
        )}
      </div>
    </div>
  );
}

interface EventBlockProps {
  event: GanttEvent;
  row: GanttRow;
  colCount: number;
  size: NonNullable<VariantProps<typeof ganttEventVariants>['size']>;
  onClick?: (event: GanttEvent, row: GanttRow) => void;
  renderEvent?: (event: GanttEvent, row: GanttRow) => ReactNode;
}

function EventBlock({ event, row, colCount, size, onClick, renderEvent }: EventBlockProps) {
  const leftPct = (event.start / colCount) * 100;
  const widthPct = ((event.end - event.start) / colCount) * 100;
  const insetPx = 3;

  const isClickable = !!onClick;

  const content = renderEvent ? (
    renderEvent(event, row)
  ) : (
    <>
      <p className="font-semibold truncate">{event.title}</p>
      {event.subtitle && <p className="opacity-80 truncate">{event.subtitle}</p>}
    </>
  );

  const sharedStyle = {
    left: `calc(${leftPct}% + ${insetPx}px)`,
    width: `calc(${widthPct}% - ${insetPx * 2}px)`,
  };

  const sharedClassName = cn(
    ganttEventVariants({ variant: event.variant, size }),
    isClickable && 'cursor-pointer hover:shadow-md',
    event.className,
  );

  const block = isClickable ? (
    <button
      type="button"
      className={sharedClassName}
      style={sharedStyle}
      onClick={() => onClick(event, row)}
      aria-label={typeof event.title === 'string' ? event.title : undefined}
    >
      {content}
    </button>
  ) : (
    <div className={sharedClassName} style={sharedStyle}>
      {content}
    </div>
  );

  if (event.tooltip) {
    return (
      <Tooltip content={event.tooltip} side="top">
        {block}
      </Tooltip>
    );
  }

  return block;
}

/* ------------------------------------------------------------------ */
/*  GanttChart                                                         */
/* ------------------------------------------------------------------ */

export function GanttChart({
  columns,
  rows,
  columnWidth = 120,
  resourceWidth = 200,
  size = 'md',
  nowIndicator,
  striped = true,
  resourceLabel = 'Resource',
  renderEvent,
  renderResource,
  renderColumnHeader,
  onEventClick,
  onRowClick,
  ariaLabel = 'Schedule chart',
  className,
}: GanttChartProps) {
  const colCount = columns.length;
  const gridWidth = colCount * columnWidth;

  return (
    <div
      className={cn('overflow-x-auto rounded-lg border border-border', className)}
      role="grid"
      aria-label={ariaLabel}
    >
      <div
        className="relative"
        style={{ minWidth: resourceWidth + gridWidth }}
      >
        {/* ---- Header Row ---- */}
        <div
          role="row"
          className="flex border-b border-border bg-card"
          style={{ minWidth: resourceWidth + gridWidth }}
        >
          {/* Resource header */}
          <div
            role="columnheader"
            className="sticky left-0 z-[var(--z-content)] flex items-center bg-card px-4 border-r border-border shrink-0"
            style={{ width: resourceWidth, minWidth: resourceWidth }}
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {resourceLabel}
            </span>
          </div>

          {/* Time axis headers */}
          <div className="flex" style={{ width: gridWidth }}>
            {columns.map((col, i) => (
              <div
                key={i}
                role="columnheader"
                className="flex items-center justify-center border-r border-border/30 py-3 text-xs font-medium text-muted-foreground last:border-r-0"
                style={{ width: columnWidth, minWidth: columnWidth }}
              >
                {renderColumnHeader ? renderColumnHeader(col, i) : col}
              </div>
            ))}
          </div>
        </div>

        {/* ---- Body Rows ---- */}
        {rows.map((row, rowIdx) => {
          const isRowClickable = !!onRowClick;
          const handleRowKeyDown = (e: KeyboardEvent) => {
            if (isRowClickable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onRowClick(row);
            }
          };
          return (
            <div
              key={row.id}
              role="row"
              tabIndex={isRowClickable ? 0 : undefined}
              className={cn(
                'flex border-b border-border last:border-b-0',
                ROW_HEIGHT[size],
                striped && rowIdx % 2 === 1 ? 'bg-muted/30' : 'bg-background',
                isRowClickable && 'cursor-pointer hover:bg-muted/50 transition-colors duration-150',
              )}
              style={{ minWidth: resourceWidth + gridWidth }}
              onClick={isRowClickable ? () => onRowClick(row) : undefined}
              onKeyDown={isRowClickable ? handleRowKeyDown : undefined}
            >
              {/* Resource cell */}
              <div
                role="gridcell"
                className={cn(
                  'sticky left-0 z-[var(--z-content)] flex items-center px-4 border-r border-border shrink-0',
                  striped && rowIdx % 2 === 1 ? 'bg-muted/30' : 'bg-background',
                )}
                style={{ width: resourceWidth, minWidth: resourceWidth }}
              >
                {renderResource ? renderResource(row) : <DefaultResource row={row} />}
              </div>

              {/* Events area */}
              <div
                role="gridcell"
                className="relative"
                style={{ width: gridWidth, minWidth: gridWidth }}
              >
                {/* Column gridlines */}
                <div className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
                  {columns.map((_, i) => (
                    <div
                      key={i}
                      className="border-r border-border/30 last:border-r-0"
                      style={{ width: columnWidth, minWidth: columnWidth }}
                    />
                  ))}
                </div>

                {/* Event blocks */}
                {row.events.map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    row={row}
                    colCount={colCount}
                    size={size}
                    onClick={onEventClick}
                    renderEvent={renderEvent}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ---- Now Indicator ---- */}
        {nowIndicator != null && nowIndicator >= 0 && nowIndicator <= colCount && (
          <div
            className="absolute top-0 bottom-0 z-[var(--z-editable)] pointer-events-none"
            style={{ left: resourceWidth + (nowIndicator / colCount) * gridWidth }}
            aria-hidden="true"
          >
            <div className="relative h-full">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-danger border-2 border-background" />
              <div className="w-px h-full bg-danger/70 mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GanttChart;
