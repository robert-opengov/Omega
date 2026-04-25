import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  GanttReportViewer,
  parseTasks,
  buildSchedule,
} from '../_components/viewers/GanttReportViewer';

vi.mock('@/components/ui/organisms/GanttChart', () => ({
  GanttChart: ({
    columns,
    rows,
  }: {
    columns: React.ReactNode[];
    rows: Array<{ id: string; label: React.ReactNode; events: unknown[] }>;
  }) => (
    <div data-testid="gantt-chart-stub">
      <div data-testid="gantt-cols">{columns.length}</div>
      <ul>
        {rows.map((r) => (
          <li key={r.id} data-testid="gantt-row">
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

describe('parseTasks', () => {
  it('drops rows missing start or end dates', () => {
    const tasks = parseTasks(
      [
        { id: 1, name: 'Good', start: '2026-04-01', end: '2026-04-05' },
        { id: 2, name: 'Bad start', start: '', end: '2026-04-05' },
        { id: 3, name: 'Bad end', start: '2026-04-01', end: '' },
      ],
      {
        taskField: 'name',
        startDateField: 'start',
        endDateField: 'end',
      },
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Good');
  });

  it('drops rows whose end is before start', () => {
    const tasks = parseTasks(
      [{ id: 1, name: 'Reversed', start: '2026-04-10', end: '2026-04-05' }],
      { taskField: 'name', startDateField: 'start', endDateField: 'end' },
    );
    expect(tasks).toHaveLength(0);
  });

  it('clamps progress between 0 and 100', () => {
    const tasks = parseTasks(
      [
        { id: 1, name: 'Over', start: '2026-04-01', end: '2026-04-02', pct: 150 },
        { id: 2, name: 'Under', start: '2026-04-01', end: '2026-04-02', pct: -10 },
      ],
      {
        taskField: 'name',
        startDateField: 'start',
        endDateField: 'end',
        progressField: 'pct',
      },
    );
    expect(tasks[0].progress).toBe(100);
    expect(tasks[1].progress).toBe(0);
  });
});

describe('buildSchedule', () => {
  it('returns null for an empty list', () => {
    expect(buildSchedule([])).toBeNull();
  });

  it('uses day units for short ranges', () => {
    const tasks = parseTasks(
      [{ id: 1, name: 'A', start: '2026-04-01', end: '2026-04-03' }],
      { taskField: 'name', startDateField: 'start', endDateField: 'end' },
    );
    const schedule = buildSchedule(tasks)!;
    expect(schedule.unit).toBe('day');
    expect(schedule.columns).toHaveLength(3);
    expect(schedule.rows).toHaveLength(1);
    const event = schedule.rows[0].events[0];
    expect(event.start).toBe(0);
    expect(event.end).toBe(3);
  });

  it('switches to weekly columns for long ranges', () => {
    const tasks = parseTasks(
      [{ id: 1, name: 'Long', start: '2026-04-01', end: '2026-08-15' }],
      { taskField: 'name', startDateField: 'start', endDateField: 'end' },
    );
    const schedule = buildSchedule(tasks)!;
    expect(schedule.unit).toBe('week');
    expect(schedule.columns.length).toBeLessThanOrEqual(25);
    expect(schedule.columns[0]).toMatch(/Wk of/);
  });
});

describe('GanttReportViewer', () => {
  it('renders an empty state without start + end date fields', () => {
    render(
      <GanttReportViewer
        config={{ startDateField: 'start' }}
        rows={[{ start: '2026-04-01', end: '2026-04-05' }]}
      />,
    );
    expect(screen.getByText('Pick start + end date fields')).toBeInTheDocument();
  });

  it('renders an empty state when no rows produce valid tasks', () => {
    render(
      <GanttReportViewer
        config={{ startDateField: 'start', endDateField: 'end' }}
        rows={[{ start: '', end: '' }]}
      />,
    );
    expect(screen.getByText('No tasks to schedule')).toBeInTheDocument();
  });

  it('renders the gantt chart with derived rows', () => {
    render(
      <GanttReportViewer
        config={{
          taskField: 'name',
          startDateField: 'start',
          endDateField: 'end',
        }}
        rows={[
          { id: 1, name: 'Plan', start: '2026-04-01', end: '2026-04-03' },
          { id: 2, name: 'Build', start: '2026-04-04', end: '2026-04-07' },
        ]}
      />,
    );
    expect(screen.getByTestId('gantt-chart-stub')).toBeInTheDocument();
    expect(screen.getAllByTestId('gantt-row')).toHaveLength(2);
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
  });
});
