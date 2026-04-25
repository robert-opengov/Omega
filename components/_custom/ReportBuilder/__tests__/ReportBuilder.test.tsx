import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReportBuilder } from '../ReportBuilder';
import type { Report } from '@/lib/core/ports/report.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import type { GabField } from '@/lib/core/ports/field.repository';

const updateReportActionMock = vi.fn();

vi.mock('@/app/actions/reports', () => ({
  updateReportAction: (...args: unknown[]) => updateReportActionMock(...args),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('../_components/viewers', () => ({
  ViewerEmptyState: ({ title }: { title: string }) => (
    <div data-testid="viewer-empty-stub">{title}</div>
  ),
  DataTableReportViewer: () => <div data-testid="datatable-viewer-stub" />,
  CalendarReportViewer: () => <div data-testid="calendar-viewer-stub" />,
  GanttReportViewer: () => <div data-testid="gantt-viewer-stub" />,
  ChartReportViewer: () => <div data-testid="chart-viewer-stub" />,
  PivotReportViewer: () => <div data-testid="pivot-viewer-stub" />,
}));

const TABLES: GabTable[] = [
  { id: 't1', key: 'tasks', name: 'Tasks', appId: 'app_1' },
  { id: 't2', key: 'projects', name: 'Projects', appId: 'app_1' },
];

const FIELDS: GabField[] = [
  {
    id: 'f1',
    tableId: 't1',
    key: 'status',
    name: 'Status',
    type: 'text',
    required: false,
    sortOrder: 0,
    isSystem: false,
    createdAt: '2026-01-01',
  },
  {
    id: 'f2',
    tableId: 't1',
    key: 'amount',
    name: 'Amount',
    type: 'number',
    required: false,
    sortOrder: 1,
    isSystem: false,
    createdAt: '2026-01-01',
  },
  {
    id: 'f3',
    tableId: 't1',
    key: 'due_date',
    name: 'Due date',
    type: 'date',
    required: false,
    sortOrder: 2,
    isSystem: false,
    createdAt: '2026-01-01',
  },
];

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'rep_1',
    key: 'rep_1',
    appId: 'app_1',
    name: 'My report',
    type: 'datatable',
    tableId: 't1',
    config: {},
    ...overrides,
  };
}

describe('ReportBuilder', () => {
  beforeEach(() => {
    updateReportActionMock.mockReset();
  });

  it('shows the type label and renders datatable copy by default', () => {
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport()}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    expect(screen.getAllByText('Data table').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Data table reports show every column/i),
    ).toBeInTheDocument();
  });

  it('renders the chart config editor for chart reports', () => {
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport({ type: 'chart' })}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    expect(screen.getByLabelText('Chart type')).toBeInTheDocument();
    expect(screen.getByLabelText('Chart x axis')).toBeInTheDocument();
    expect(screen.getByLabelText('Chart y axis')).toBeInTheDocument();
  });

  it('renders the calendar config editor for calendar reports', () => {
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport({ type: 'calendar' })}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    expect(screen.getByLabelText('Calendar date field')).toBeInTheDocument();
    expect(screen.getByLabelText('Calendar title field')).toBeInTheDocument();
  });

  it('renders the gantt config editor for gantt reports', () => {
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport({ type: 'gantt' })}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    expect(screen.getByLabelText('Gantt task field')).toBeInTheDocument();
    expect(screen.getByLabelText('Gantt start date')).toBeInTheDocument();
    expect(screen.getByLabelText('Gantt end date')).toBeInTheDocument();
  });

  it('renders the pivot config editor for pivot reports', () => {
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport({ type: 'pivot' })}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    expect(screen.getByLabelText('Pivot rows')).toBeInTheDocument();
    expect(screen.getByLabelText('Pivot aggregator')).toBeInTheDocument();
    expect(screen.getByLabelText('Pivot value field')).toBeInTheDocument();
  });

  it('keeps Save disabled until the user makes a change', () => {
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport()}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toBeDisabled();
  });

  it('calls updateReportAction with the latest config when saved', async () => {
    updateReportActionMock.mockResolvedValue({
      success: true,
      data: { id: 'rep_1', key: 'rep_1', appId: 'app_1', name: 'Renamed' },
    });
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport({ type: 'chart' })}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );

    const nameInput = screen.getByLabelText('Report name');
    fireEvent.change(nameInput, { target: { value: 'Renamed' } });

    const chartType = screen.getByLabelText('Chart type') as HTMLSelectElement;
    fireEvent.change(chartType, { target: { value: 'line' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updateReportActionMock).toHaveBeenCalledTimes(1);
    });
    const [appIdArg, reportIdArg, payload] = updateReportActionMock.mock.calls[0];
    expect(appIdArg).toBe('app_1');
    expect(reportIdArg).toBe('rep_1');
    expect(payload.name).toBe('Renamed');
    expect(payload.tableId).toBe('t1');
    expect((payload.config as Record<string, unknown>).chartType).toBe('line');
  });

  it('surfaces a save error from the action', async () => {
    updateReportActionMock.mockResolvedValue({
      success: false,
      error: 'Conflict',
    });
    render(
      <ReportBuilder
        appId="app_1"
        appKey="app_1"
        report={makeReport()}
        tables={TABLES}
        fields={FIELDS}
        rows={[]}
      />,
    );
    const nameInput = screen.getByLabelText('Report name');
    fireEvent.change(nameInput, { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Conflict')).toBeInTheDocument();
    });
  });
});
