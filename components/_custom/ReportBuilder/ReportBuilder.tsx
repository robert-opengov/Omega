'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Undo2 } from 'lucide-react';
import { Badge, Button, Input, Select, Text } from '@/components/ui/atoms';
import { Alert, Card, CardContent, FormField } from '@/components/ui/molecules';
import { updateReportAction } from '@/app/actions/reports';
import type {
  CalendarReportConfig,
  ChartReportConfig,
  GanttReportConfig,
  PivotReportConfig,
  Report,
  ReportType,
} from '@/lib/core/ports/report.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';
import { ChartConfigEditor } from './_components/configs/ChartConfigEditor';
import { CalendarConfigEditor } from './_components/configs/CalendarConfigEditor';
import { GanttConfigEditor } from './_components/configs/GanttConfigEditor';
import { PivotConfigEditor } from './_components/configs/PivotConfigEditor';
import {
  CalendarReportViewer,
  ChartReportViewer,
  DataTableReportViewer,
  GanttReportViewer,
  PivotReportViewer,
} from './_components/viewers';

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  datatable: 'Data table',
  chart: 'Chart',
  calendar: 'Calendar',
  gantt: 'Gantt',
  pivot: 'Pivot',
};

export interface ReportBuilderProps {
  appId: string;
  appKey: string;
  report: Report;
  tables: GabTable[];
  fields: GabField[];
  rows: GabRow[];
  rowsError?: string | null;
}

export function ReportBuilder({
  appId,
  appKey,
  report,
  tables,
  fields,
  rows,
  rowsError = null,
}: Readonly<ReportBuilderProps>) {
  const reportType: ReportType = report.type ?? 'datatable';

  const [name, setName] = useState(report.name ?? '');
  const [tableId, setTableId] = useState(report.tableId ?? '');
  const [config, setConfig] = useState<Record<string, unknown>>(
    report.config ?? {},
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [savedAt]);

  const markDirty = useCallback(() => setDirty(true), []);

  const onConfigChange = useCallback(
    (next: Record<string, unknown>) => {
      setConfig(next);
      markDirty();
    },
    [markDirty],
  );

  const sourceTable = useMemo(
    () => tables.find((t) => t.id === tableId),
    [tables, tableId],
  );
  const tableKey = sourceTable?.key ?? tableId;

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateReportAction(appId, report.id, {
        name,
        tableId: tableId || undefined,
        config,
      });
      if (!res.success) {
        setError(res.error ?? 'Failed to save report.');
        return;
      }
      setDirty(false);
      setSavedAt(Date.now());
    });
  };

  const onDiscard = () => {
    setName(report.name ?? '');
    setTableId(report.tableId ?? '');
    setConfig(report.config ?? {});
    setError(null);
    setDirty(false);
  };

  const renderConfigEditor = (): ReactNode => {
    switch (reportType) {
      case 'chart':
        return (
          <ChartConfigEditor
            config={config as ChartReportConfig}
            onChange={(next) => onConfigChange(next as Record<string, unknown>)}
            fields={fields}
            disabled={isPending}
          />
        );
      case 'calendar':
        return (
          <CalendarConfigEditor
            config={config as CalendarReportConfig}
            onChange={(next) => onConfigChange(next as Record<string, unknown>)}
            fields={fields}
            disabled={isPending}
          />
        );
      case 'gantt':
        return (
          <GanttConfigEditor
            config={config as GanttReportConfig}
            onChange={(next) => onConfigChange(next as Record<string, unknown>)}
            fields={fields}
            disabled={isPending}
          />
        );
      case 'pivot':
        return (
          <PivotConfigEditor
            config={config as PivotReportConfig}
            onChange={(next) => onConfigChange(next as Record<string, unknown>)}
            fields={fields}
            disabled={isPending}
          />
        );
      case 'datatable':
      default:
        return (
          <Text size="sm" color="muted">
            Data table reports show every column from the source table. There is no
            extra configuration.
          </Text>
        );
    }
  };

  const renderViewer = (): ReactNode => {
    switch (reportType) {
      case 'chart':
        return (
          <ChartReportViewer
            config={config as ChartReportConfig}
            rows={rows}
          />
        );
      case 'calendar':
        return (
          <CalendarReportViewer
            config={config as CalendarReportConfig}
            rows={rows}
          />
        );
      case 'gantt':
        return (
          <GanttReportViewer
            config={config as GanttReportConfig}
            rows={rows}
          />
        );
      case 'pivot':
        return (
          <PivotReportViewer
            config={config as PivotReportConfig}
            rows={rows}
            fields={fields}
          />
        );
      case 'datatable':
      default:
        return (
          <DataTableReportViewer
            appId={appId}
            appKey={appKey}
            tableId={tableId || undefined}
            tableKey={tableKey || undefined}
            fields={fields}
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded border border-border bg-card px-4 py-3">
        <Link
          href={`/apps/${appId}/reports`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="h-6 w-px bg-border" />
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            markDirty();
          }}
          placeholder="Report name"
          aria-label="Report name"
          className="w-56 font-semibold"
        />
        <Badge variant="default" size="sm">
          {REPORT_TYPE_LABEL[reportType]}
        </Badge>
        <Select
          value={tableId}
          onChange={(e) => {
            setTableId(e.target.value);
            markDirty();
          }}
          aria-label="Source table"
          className="w-48"
        >
          <option value="">Select source table…</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {savedAt ? (
            <Text size="xs" color="muted">
              Saved
            </Text>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={!dirty || isPending}
          >
            <Undo2 className="h-4 w-4" />
            Discard
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={!dirty || isPending || !name.trim()}
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="error" title="Could not save report">
          {error}
        </Alert>
      ) : null}
      {rowsError ? (
        <Alert variant="warning" title="Source records could not be loaded">
          {rowsError}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <FormField label="Type">
                <Text size="sm" className="text-foreground">
                  {REPORT_TYPE_LABEL[reportType]}
                </Text>
              </FormField>
              <div className="border-t border-border pt-3">
                {renderConfigEditor()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">{renderViewer()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
