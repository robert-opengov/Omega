'use client';

import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { GanttChart, type GanttRow } from '@/components/ui/organisms/GanttChart';
import type { GanttReportConfig } from '@/lib/core/ports/report.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';
import { ViewerEmptyState } from './EmptyState';

export interface GanttReportViewerProps {
  config: GanttReportConfig;
  rows: GabRow[];
}

interface ParsedTask {
  id: string;
  title: string;
  start: Dayjs;
  end: Dayjs;
  progress: number | null;
}

/** Maximum number of day columns we'll render. Past this we render weeks. */
const DAY_COL_THRESHOLD = 30;

function toDayjs(raw: unknown): Dayjs | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const d = dayjs(raw as string | number | Date);
  return d.isValid() ? d.startOf('day') : null;
}

function parseTasks(
  rows: GabRow[],
  config: GanttReportConfig,
): ParsedTask[] {
  if (!config.startDateField || !config.endDateField) return [];
  const parsed: ParsedTask[] = [];
  rows.forEach((row, idx) => {
    const start = toDayjs(row?.[config.startDateField as string]);
    const end = toDayjs(row?.[config.endDateField as string]);
    if (!start || !end || end.isBefore(start)) return;
    const titleRaw = config.taskField
      ? row?.[config.taskField]
      : (row?.name ?? row?.id);
    const title =
      titleRaw === null || titleRaw === undefined || titleRaw === ''
        ? `Task ${idx + 1}`
        : String(titleRaw);
    let progress: number | null = null;
    if (config.progressField) {
      const raw = row?.[config.progressField as string];
      const num = typeof raw === 'number' ? raw : Number(raw);
      progress = Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : null;
    }
    parsed.push({
      id: String(row?.id ?? `row-${idx}`),
      title,
      start,
      end,
      progress,
    });
  });
  return parsed;
}

interface DerivedSchedule {
  rows: GanttRow[];
  columns: string[];
  unit: 'day' | 'week';
}

function buildSchedule(tasks: ParsedTask[]): DerivedSchedule | null {
  if (tasks.length === 0) return null;
  const earliest = tasks.reduce(
    (min, t) => (t.start.isBefore(min) ? t.start : min),
    tasks[0].start,
  );
  const latest = tasks.reduce(
    (max, t) => (t.end.isAfter(max) ? t.end : max),
    tasks[0].end,
  );
  const dayCount = latest.diff(earliest, 'day') + 1;
  const useWeeks = dayCount > DAY_COL_THRESHOLD;
  const unit: 'day' | 'week' = useWeeks ? 'week' : 'day';
  const colCount = useWeeks
    ? Math.max(1, latest.diff(earliest.startOf('week'), 'week') + 1)
    : dayCount;

  const columns: string[] = [];
  for (let i = 0; i < colCount; i++) {
    const colDate = useWeeks
      ? earliest.startOf('week').add(i, 'week')
      : earliest.add(i, 'day');
    columns.push(useWeeks ? `Wk of ${colDate.format('MMM D')}` : colDate.format('MMM D'));
  }

  const origin = useWeeks ? earliest.startOf('week') : earliest;

  const rows: GanttRow[] = tasks.map((task) => {
    const startCol = useWeeks
      ? task.start.diff(origin, 'week', true)
      : task.start.diff(origin, 'day');
    const endCol = useWeeks
      ? task.end.diff(origin, 'week', true) + 1 / 7
      : task.end.diff(origin, 'day') + 1;
    const subtitle =
      task.progress !== null
        ? `${task.progress.toFixed(0)}% complete`
        : `${task.start.format('MMM D')} → ${task.end.format('MMM D')}`;
    return {
      id: task.id,
      label: task.title,
      sublabel: subtitle,
      events: [
        {
          id: `${task.id}-event`,
          start: Math.max(0, startCol),
          end: Math.min(colCount, endCol),
          title: task.title,
          subtitle,
          variant:
            task.progress === null
              ? 'primary'
              : task.progress >= 100
                ? 'success'
                : task.progress >= 50
                  ? 'inProgress'
                  : 'warning',
          tooltip: `${task.start.format('MMM D, YYYY')} → ${task.end.format('MMM D, YYYY')}`,
        },
      ],
    };
  });

  return { rows, columns, unit };
}

export function GanttReportViewer({
  config,
  rows,
}: Readonly<GanttReportViewerProps>) {
  const tasks = useMemo(() => parseTasks(rows, config), [rows, config]);
  const schedule = useMemo(() => buildSchedule(tasks), [tasks]);

  if (!config.startDateField || !config.endDateField) {
    return (
      <ViewerEmptyState
        title="Pick start + end date fields"
        description="Both a start and end date are required to draw the Gantt bars."
      />
    );
  }

  if (!schedule) {
    return (
      <ViewerEmptyState
        title="No tasks to schedule"
        description="No records have valid start/end dates yet."
      />
    );
  }

  return (
    <div data-testid="gantt-report-viewer">
      <GanttChart
        columns={schedule.columns}
        rows={schedule.rows}
        size="sm"
        ariaLabel="Report schedule"
      />
    </div>
  );
}

export { parseTasks, buildSchedule };
