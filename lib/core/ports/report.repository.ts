/**
 * Report port — mirrors GAB Core's SPA report contract verbatim.
 *
 * Source of truth: apps/web/src/api/queries/reports.ts and
 * apps/web/src/features/report-builder/* in GAB Core.
 *
 * Reports are saved configurations that read from the standard table records
 * API and render via one of five viewer types. There is no dedicated `/run`
 * endpoint in practice — the viewers fetch records directly using the existing
 * data port. The GAB V2 backend may not yet implement these endpoints; the
 * adapter surfaces 404/501 unchanged through `ActionResult<T>` so the UI can
 * show empty/error states (Phase 4/5/6 pattern).
 */

export type ReportType =
  | 'datatable'
  | 'chart'
  | 'calendar'
  | 'gantt'
  | 'pivot';

export type ChartKind = 'bar' | 'line' | 'pie' | 'area';

export type PivotAggregator = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface ChartReportConfig {
  chartType?: ChartKind;
  xAxis?: string;
  yAxis?: string;
  series?: string;
}

export interface CalendarReportConfig {
  dateField?: string;
  endDateField?: string;
  titleField?: string;
}

export interface GanttReportConfig {
  taskField?: string;
  startDateField?: string;
  endDateField?: string;
  progressField?: string;
}

export interface PivotReportConfig {
  rows?: string[];
  cols?: string[];
  vals?: string[];
  aggregatorName?: PivotAggregator;
}

/**
 * `config` is intentionally a loose record on the wire (matching the SPA), but
 * downstream UI narrows it to one of the per-type interfaces above based on
 * `type`.
 */
export type ReportConfig =
  | ChartReportConfig
  | CalendarReportConfig
  | GanttReportConfig
  | PivotReportConfig
  | Record<string, unknown>;

export interface Report {
  id: string;
  key: string;
  name: string;
  type?: ReportType;
  tableId?: string;
  appId: string;
  config?: Record<string, unknown>;
  createdAt?: string;
}

export interface CreateReportPayload {
  name: string;
  type?: ReportType;
  tableId?: string;
  config?: Record<string, unknown>;
}

export type UpdateReportPayload = Partial<CreateReportPayload>;

export interface IGabReportRepository {
  listReports(appId: string): Promise<Report[]>;
  getReport(appId: string, reportId: string): Promise<Report>;
  createReport(appId: string, payload: CreateReportPayload): Promise<Report>;
  updateReport(
    appId: string,
    reportId: string,
    patch: UpdateReportPayload,
  ): Promise<Report>;
  deleteReport(appId: string, reportId: string): Promise<{ ok: boolean }>;
}
