'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Badge, Button, Input, Select, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Modal,
  type Column,
} from '@/components/ui/molecules';
import {
  createReportAction,
  deleteReportAction,
  type ActionResult,
} from '@/app/actions/reports';
import type {
  Report,
  ReportType,
} from '@/lib/core/ports/report.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';

interface ReportsPanelProps {
  appId: string;
  initialReports: Report[];
  tables: GabTable[];
  initialError?: string | null;
}

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'datatable', label: 'Data table' },
  { value: 'chart', label: 'Chart' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'gantt', label: 'Gantt' },
  { value: 'pivot', label: 'Pivot' },
];

const REPORT_TYPE_LABEL: Record<ReportType, string> = Object.fromEntries(
  REPORT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ReportType, string>;

export function ReportsPanel({
  appId,
  initialReports,
  tables,
  initialError = null,
}: Readonly<ReportsPanelProps>) {
  const [reports, setReports] = useState(initialReports);
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ReportType>('datatable');
  const [tableId, setTableId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Report | null>(null);
  const [isPending, startTransition] = useTransition();

  const tableNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tables) m.set(t.id, t.name);
    return m;
  }, [tables]);

  const handleMutation = <T,>(
    result: ActionResult<T>,
    onSuccess: (data: T) => void,
  ) => {
    if (!result.success || result.data === undefined) {
      setError(result.error ?? 'Request failed');
      return;
    }
    setError(null);
    onSuccess(result.data);
  };

  const onCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createReportAction(appId, {
        name,
        type,
        tableId: tableId || undefined,
      });
      handleMutation(res, (created) => {
        setReports((prev) => [created, ...prev]);
        setCreateOpen(false);
        setName('');
        setType('datatable');
        setTableId('');
      });
    });
  };

  const onDelete = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setError(null);
    startTransition(async () => {
      const res = await deleteReportAction(appId, id);
      handleMutation(res, () => {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setConfirmDelete(null);
      });
    });
  };

  const reportColumns: Column<Report & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Link
          href={`/apps/${appId}/reports/${row.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.name || '(untitled)'}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: false,
      render: (row) => (
        <Badge variant="default" size="sm">
          {row.type ? REPORT_TYPE_LABEL[row.type] : 'Data table'}
        </Badge>
      ),
    },
    {
      key: 'table',
      header: 'Table',
      sortable: false,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.tableId ? tableNameById.get(row.tableId) ?? row.tableId : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/apps/${appId}/reports/${row.id}`}
            className="inline-flex h-7 items-center rounded border border-border px-2 text-xs font-semibold text-foreground hover:bg-action-hover-primary"
          >
            Open
          </Link>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setConfirmDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New report
        </Button>
      </div>
      {error ? (
        <Text size="sm" className="text-destructive">
          {error}
        </Text>
      ) : null}
      <Card>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No reports yet"
                description="Create your first report to visualize data from a table."
              />
            </div>
          ) : (
            <DataTable
              data={reports as (Report & Record<string, unknown>)[]}
              columns={reportColumns}
              keyExtractor={(row) => row.id}
              density="compact"
              emptyMessage="No reports"
              tableLabel="Reports"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create report"
        description="Pick a viewer type and a source table. You can edit the configuration in the builder."
      >
        <div className="space-y-3">
          <Input
            placeholder="Report name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Report name"
          />
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            aria-label="Report type"
          >
            {REPORT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            aria-label="Source table"
          >
            <option value="">Select source table…</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending || !name.trim()}
              onClick={onCreate}
            >
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete report?"
        description={
          confirmDelete
            ? `“${confirmDelete.name}” will no longer be accessible from this app.`
            : ''
        }
        variant="danger"
        confirmLabel="Delete"
        loading={isPending}
        onConfirm={onDelete}
      />
    </div>
  );
}
