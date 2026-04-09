'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  ChildTableColumn,
  ChildTableConfig,
  ChildTableRow,
  SelectOption,
} from './core/models';
import { buildFieldKeyMap } from './core/field-mapper';
import type { ChildTableDataAdapter, SyncItem, Relation, ReportColumn } from './data';
import { ChildTable } from './ChildTable';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChildTableEmbeddedProps {
  readonly tableKey?: string;
  readonly reportKey?: string;
  readonly parentRecordId?: string;
  readonly referenceFieldKey?: string;
  readonly parentTableKey?: string;
  readonly applicationKey?: string;
  readonly editable?: boolean;
  readonly tableTitle?: string;
  readonly dataAdapter: ChildTableDataAdapter;
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Internal metadata state
// ---------------------------------------------------------------------------

interface ResolvedMeta {
  childTableKey: string;
  childReportKey: string;
  columns: ChildTableColumn[];
  payloadColumns: Array<{
    data: string;
    name: string;
    searchable: boolean;
    orderable: boolean;
    search: { value: string; regex: boolean };
  }>;
  fieldKeyMap: Map<string, string>;
  referenceFieldKey: string | undefined;
}

type Phase = 'idle' | 'discovering' | 'loading' | 'ready' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stringifyValue(val: unknown): string {
  if (val == null) return '';
  switch (typeof val) {
    case 'object':
      return JSON.stringify(val);
    case 'string':
      return val;
    case 'number':
    case 'boolean':
      return `${val}`;
    default:
      return `${val as string | number}`;
  }
}

async function resolveChildTableKey(
  adapter: ChildTableDataAdapter,
  tableKey: string | undefined,
  parentTableKey: string | undefined,
  referenceFieldKey: string | undefined,
): Promise<{ childTableKey: string; refFieldKey: string | undefined }> {
  if (tableKey) return { childTableKey: tableKey, refFieldKey: referenceFieldKey };

  if (!parentTableKey) throw new Error('Could not resolve child table key');

  const relations: Relation[] = await adapter.getRelations(parentTableKey);
  const hasMany = relations.find((r) => r.RelationType === 'Has many');
  if (!hasMany) throw new Error('No "Has many" relation found for parent table');

  return {
    childTableKey: hasMany.ApplicationTableKey,
    refFieldKey: referenceFieldKey ?? hasMany.ReferenceFieldKey,
  };
}

async function resolveReportKey(
  adapter: ChildTableDataAdapter,
  reportKey: string | undefined,
  childTableKey: string,
): Promise<string> {
  if (reportKey) return reportKey;
  const reports = (await adapter.getReports(childTableKey)) as Array<{ Key?: string; DefaultReport?: number }>;
  if (!reports.length) throw new Error('No reports found for child table');
  const first = reports.find((r) => r.DefaultReport === 1) ?? reports[0];
  return first.Key ?? '';
}

function enrichColumnsWithOptions(
  columns: ChildTableColumn[],
  dropdowns: Record<string, Array<Record<string, unknown>>>,
  users: Array<Record<string, unknown>>,
): void {
  for (const col of columns) {
    const fieldName = col.fieldName ?? col.key;

    if (
      (col.type === 'select' || col.type === 'multiselect') &&
      dropdowns[fieldName]
    ) {
      col.selectOptions = dropdowns[fieldName]
        .filter((o) => o['IsActive'] !== false)
        .map(
          (o): SelectOption => ({
            value: (o['Value'] as string) ?? '',
            label: (o['Name'] as string) ?? (o['Value'] as string) ?? '',
          }),
        );
    }

    if (col.type === 'user' && users.length > 0) {
      col.selectOptions = users.map(
        (u): SelectOption => ({
          value: (u['UserKey'] as string) ?? (u['Id'] as string) ?? '',
          label: (u['FullName'] as string) ?? (u['Email'] as string) ?? '',
        }),
      );
      col.type = 'select';
    }
  }
}

function buildSyncFieldsList(
  data: Record<string, unknown>,
): Array<{ Name: string; Value: string }> {
  return Object.entries(data)
    .filter(([key]) => key !== 'Rid' && key !== 'rid' && key !== 'id')
    .map(([key, val]) => ({ Name: key, Value: stringifyValue(val) }));
}

function isTemporaryId(id: string): boolean {
  return id.startsWith('row_') || id.startsWith('temp_');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChildTableEmbedded({
  tableKey,
  reportKey,
  parentRecordId,
  referenceFieldKey,
  parentTableKey,
  applicationKey,
  editable = true,
  tableTitle,
  dataAdapter,
  className,
}: ChildTableEmbeddedProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ResolvedMeta | null>(null);

  const [rows, setRows] = useState<ChildTableRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  const [pendingNewRows, setPendingNewRows] = useState<ChildTableRow[]>([]);
  const [saving, setSaving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const hasMounted = useRef(false);

  // -----------------------------------------------------------------------
  // Discovery: resolve table, report, columns, dropdowns, etc.
  // -----------------------------------------------------------------------

  const discover = useCallback(async () => {
    setPhase('discovering');
    setError(null);

    try {
      const { childTableKey, refFieldKey } = await resolveChildTableKey(
        dataAdapter,
        tableKey,
        parentTableKey,
        referenceFieldKey,
      );
      const childReportKey = await resolveReportKey(
        dataAdapter,
        reportKey,
        childTableKey,
      );

      const reportColumns: ReportColumn[] = await dataAdapter.getReportColumns(
        childReportKey,
        childTableKey,
      );

      const selectFieldKeys = reportColumns
        .filter((c) =>
          ['enum', 'enum2', 'select', 'dropdown', 'multiselect', 'multi_select'].includes(
            (c.FieldType ?? '').toLowerCase(),
          ),
        )
        .map((f) => f.FieldKey ?? f.Key ?? '');

      const hasUserFields = reportColumns.some(
        (c) => (c.FieldType ?? '').toLowerCase() === 'user',
      );

      const [dropdowns, users] = await Promise.all([
        selectFieldKeys.length > 0
          ? dataAdapter.fetchAllDropdownValues(selectFieldKeys)
          : Promise.resolve({} as Record<string, Array<Record<string, unknown>>>),
        hasUserFields && applicationKey
          ? dataAdapter.fetchUsers(childTableKey, applicationKey).catch(() => [])
          : Promise.resolve([]),
      ]);

      const samplePayload = dataAdapter.buildPayloadColumns(reportColumns);
      let fieldKeyMap = new Map<string, string>();

      try {
        const preview = await dataAdapter.loadRows({
          tableKey: childTableKey,
          reportKey: childReportKey,
          columns: samplePayload,
          start: 0,
          length: 1,
          lookupFieldValue: parentRecordId,
          referenceFieldKey: refFieldKey,
          isEmbedded: !!parentRecordId,
        });
        if (preview.data.length > 0) {
          fieldKeyMap = buildFieldKeyMap(
            preview.data[0],
            reportColumns.map((c) => c.FieldName),
          );
        }
      } catch {
        // field-key map is best-effort; columns fall back to DataKey
      }

      const columns = dataAdapter.buildChildTableColumns(reportColumns, fieldKeyMap);
      enrichColumnsWithOptions(
        columns,
        dropdowns as Record<string, Array<Record<string, unknown>>>,
        users as Array<Record<string, unknown>>,
      );

      const resolvedMeta: ResolvedMeta = {
        childTableKey,
        childReportKey,
        columns,
        payloadColumns: samplePayload,
        fieldKeyMap,
        referenceFieldKey: refFieldKey,
      };

      setMeta(resolvedMeta);
      return resolvedMeta;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Discovery failed';
      setError(msg);
      setPhase('error');
      return null;
    }
  }, [
    tableKey,
    reportKey,
    parentRecordId,
    referenceFieldKey,
    parentTableKey,
    applicationKey,
    dataAdapter,
  ]);

  // -----------------------------------------------------------------------
  // Load data
  // -----------------------------------------------------------------------

  const loadData = useCallback(
    async (resolved: ResolvedMeta, page: number, search: string) => {
      setPhase('loading');
      try {
        const result = await dataAdapter.loadRows({
          tableKey: resolved.childTableKey,
          reportKey: resolved.childReportKey,
          columns: resolved.payloadColumns,
          start: page * pageSize,
          length: pageSize,
          searchValue: search,
          lookupFieldValue: parentRecordId,
          referenceFieldKey: resolved.referenceFieldKey,
          isEmbedded: !!parentRecordId,
        });

        const mapped: ChildTableRow[] = result.data.map((raw, idx) => {
          const rid = raw['Rid'] ?? raw['rid'] ?? raw['id'];
          let id: string;
          if (typeof rid === 'string') id = rid;
          else if (typeof rid === 'number') id = `${rid}`;
          else id = `row_${idx}`;
          return { id, data: raw };
        });

        setRows(mapped);
        setTotalRecords(result.recordsFiltered ?? 0);
        setPhase('ready');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to load data';
        setError(msg);
        setPhase('error');
      }
    },
    [dataAdapter, pageSize, parentRecordId],
  );

  // -----------------------------------------------------------------------
  // Init on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    (async () => {
      const resolved = await discover();
      if (resolved) await loadData(resolved, 0, '');
    })();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Sync pending rows when parentRecordId becomes available
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!parentRecordId || pendingNewRows.length === 0 || !meta) return;

    const syncPending = async () => {
      const items: SyncItem[] = pendingNewRows.map((row) => ({
        ApplicationTableKey: meta.childTableKey,
        ActionType: 'new' as const,
        ChildTempId: row.id,
        FieldsList: buildSyncFieldsList(row.data),
        LogTransaction: true,
      }));

      if (meta.referenceFieldKey) {
        for (const item of items) {
          item.FieldsList?.push({
            Name: meta.referenceFieldKey,
            Value: parentRecordId,
          });
        }
      }

      try {
        await dataAdapter.syncChanges(items);
        setPendingNewRows([]);
        await loadData(meta, currentPage, searchTerm);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      }
    };

    void syncPending();
  }, [
    parentRecordId,
    pendingNewRows,
    meta,
    dataAdapter,
    loadData,
    currentPage,
    searchTerm,
  ]);

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleCellChange = useCallback(
    (rowId: string, columnKey: string, newValue: unknown) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            data: { ...row.data, [columnKey]: newValue },
            dirty: true,
            originalData: row.originalData ?? { ...row.data },
          };
        }),
      );
    },
    [],
  );

  const handleSave = useCallback(
    async (dirtyRows: ChildTableRow[]) => {
      if (!meta || saving) return;
      setSaving(true);
      setError(null);

      try {
        const items: (SyncItem | null)[] = dirtyRows.map((row) => {
          const fields = buildSyncFieldsList(row.data);

          if (isTemporaryId(row.id)) {
            if (!parentRecordId) {
              setPendingNewRows((prev) => [...prev, row]);
              return null;
            }
            if (meta.referenceFieldKey) {
              fields.push({
                Name: meta.referenceFieldKey,
                Value: parentRecordId,
              });
            }
            return {
              ApplicationTableKey: meta.childTableKey,
              ActionType: 'new' as const,
              ChildTempId: row.id,
              FieldsList: fields,
              LogTransaction: true,
            };
          }

          return {
            ApplicationTableKey: meta.childTableKey,
            ActionType: 'update' as const,
            Where: { Rid: Number(row.id) },
            FieldsList: fields,
            LogTransaction: true,
          };
        });

        const validItems = items.filter((i): i is SyncItem => i !== null);
        if (validItems.length === 0) return;

        const result = await dataAdapter.syncChanges(validItems);
        if (result.errors > 0 && result.error_msg?.length) {
          setError(result.error_msg.join('; '));
        }

        const hasNewIds =
          result.added_recs && Object.keys(result.added_recs).length > 0;
        setRows((prev) =>
          prev.map((row) => {
            const newId = hasNewIds ? result.added_recs[row.id] : undefined;
            return {
              ...row,
              ...(newId && { id: newId }),
              dirty: false,
              originalData: undefined,
            };
          }),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setSaving(false);
      }
    },
    [meta, saving, parentRecordId, dataAdapter],
  );

  const handleRowDelete = useCallback(
    async (rowIds: string[]) => {
      if (!meta) return;

      const numericIds = rowIds
        .filter((id) => !isTemporaryId(id))
        .map(Number)
        .filter((n) => !Number.isNaN(n));

      setRows((prev) => prev.filter((r) => !rowIds.includes(r.id)));

      if (numericIds.length > 0) {
        try {
          await dataAdapter.deleteRows(meta.childTableKey, numericIds);
          setTotalRecords((prev) => Math.max(0, prev - numericIds.length));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Delete failed');
          await loadData(meta, currentPage, searchTerm);
        }
      }
    },
    [meta, dataAdapter, loadData, currentPage, searchTerm],
  );

  // -----------------------------------------------------------------------
  // Pagination / search
  // -----------------------------------------------------------------------

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (meta) void loadData(meta, page, searchTerm);
    },
    [meta, loadData, searchTerm],
  );

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setCurrentPage(0);
      if (meta) void loadData(meta, 0, term);
    },
    [meta, loadData],
  );

  // -----------------------------------------------------------------------
  // Build config
  // -----------------------------------------------------------------------

  const config: ChildTableConfig | null = useMemo(() => {
    if (!meta) return null;
    return {
      columns: meta.columns,
      editable,
      selectable: true,
      selectionMode: 'multi' as const,
      sortable: true,
      filterable: true,
      showRowNumbers: true,
      showRowActions: editable,
      serverSidePagination: true,
      totalRecords,
      title: tableTitle,
      loading: phase === 'loading',
      idField: 'Rid',
    };
  }, [meta, editable, totalRecords, tableTitle, phase]);

  // -----------------------------------------------------------------------
  // Convert ChildTableRow[] to raw data T[] for the ChildTable data prop
  // -----------------------------------------------------------------------

  const rowData = useMemo(() => rows.map((r) => r.data), [rows]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (phase === 'idle' || phase === 'discovering') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 py-16 text-muted-foreground',
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading child table…</span>
      </div>
    );
  }

  if (phase === 'error' && !meta) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-12',
          className,
        )}
      >
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error ?? 'An error occurred'}</p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => {
            hasMounted.current = false;
            void discover().then((resolved) => {
              if (resolved) void loadData(resolved, 0, '');
            });
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!config || !meta) return null;

  return (
    <div className={cn('relative', className)}>
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="text-xs font-medium underline-offset-2 hover:underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <ChildTable
        config={config}
        data={rowData}
        title={tableTitle}
        totalRecords={totalRecords}
        onCellChange={handleCellChange}
        onSave={handleSave}
        onRowDelete={handleRowDelete}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}
