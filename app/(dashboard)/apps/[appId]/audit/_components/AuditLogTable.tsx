'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, Button, Input, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  DataTable,
  Pagination,
  type Column,
} from '@/components/ui/molecules';
import type { AuditLogEntry } from '@/lib/core/ports/audit-log.repository';

const ACTION_OPTIONS = [
  '',
  'create',
  'update',
  'delete',
  'login',
  'role.assign',
  'role.unassign',
  'schema.update',
] as const;

function actionVariant(action: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  if (action.endsWith('create') || action.endsWith('assign')) return 'success';
  if (action.endsWith('delete') || action.endsWith('unassign')) return 'danger';
  if (action.endsWith('update')) return 'info';
  if (action.startsWith('schema')) return 'warning';
  return 'default';
}

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  tables: { id: string; name: string }[];
}

export function AuditLogTable({ entries, total, page, pageSize, tables }: AuditLogTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') sp.delete(key);
    else sp.set(key, value);
    sp.set('page', '1');
    router.replace(`?${sp.toString()}`);
  };

  const onPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('page', String(next));
    router.replace(`?${sp.toString()}`);
  };

  const onPageSize = (size: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('pageSize', String(size));
    sp.set('page', '1');
    router.replace(`?${sp.toString()}`);
  };

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const action = searchParams.get('action') ?? '';
  const tableId = searchParams.get('tableId') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const tableNameById = new Map(tables.map((t) => [t.id, t.name]));

  type Row = AuditLogEntry & Record<string, unknown>;

  const columns: Column<Row>[] = [
    {
      key: 'expand',
      header: '',
      sortable: false,
      className: 'w-8',
      render: (row) => (
        <button
          aria-label={expanded.has(row.id) ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            toggle(row.id);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded.has(row.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Time',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
    },
    {
      key: 'userEmail',
      header: 'User',
      render: (row) => (
        <span>
          {row.userEmail ?? row.userId ?? 'system'}
          {row.impersonating && (
            <Badge variant="warning" size="sm" className="ml-1.5">impersonated</Badge>
          )}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Badge variant={actionVariant(row.action)} size="sm">{row.action || '—'}</Badge>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (row) => row.entityType ?? '—',
    },
    {
      key: 'tableId',
      header: 'Table',
      render: (row) => row.tableId
        ? <span className="font-mono text-xs">{tableNameById.get(row.tableId) ?? row.tableId}</span>
        : '—',
    },
    {
      key: 'recordId',
      header: 'Record',
      render: (row) => row.recordId
        ? <span className="font-mono text-xs">{row.recordId.slice(0, 8)}…</span>
        : '—',
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Action</label>
            <select
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              value={action}
              onChange={(e) => setParam('action', e.target.value)}
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a || 'all'} value={a}>{a || 'All'}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Table</label>
            <select
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              value={tableId}
              onChange={(e) => setParam('tableId', e.target.value)}
            >
              <option value="">All</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="audit-from">From</label>
            <Input
              id="audit-from"
              type="datetime-local"
              value={from ? from.slice(0, 16) : ''}
              onChange={(e) => setParam('from', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="audit-to">To</label>
            <Input
              id="audit-to"
              type="datetime-local"
              value={to ? to.slice(0, 16) : ''}
              onChange={(e) => setParam('to', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Text size="sm" color="muted">{total} entr{total === 1 ? 'y' : 'ies'}</Text>
          {(action || tableId || from || to) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const sp = new URLSearchParams();
                sp.set('page', '1');
                router.replace(`?${sp.toString()}`);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div>
          <DataTable
            data={entries as Row[]}
            columns={columns}
            keyExtractor={(r) => r.id}
            density="compact"
            emptyMessage="No audit entries match the current filters."
          />
          {entries
            .filter((e) => expanded.has(e.id))
            .map((entry) => (
              <pre
                key={`${entry.id}-changes`}
                className="mt-2 ml-8 max-h-72 overflow-auto rounded bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all"
              >
                {JSON.stringify({
                  changes: entry.changes,
                  ipAddress: entry.ipAddress,
                  entityType: entry.entityType,
                  entityId: entry.entityId,
                }, null, 2)}
              </pre>
            ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={onPage}
          onPageSizeChange={onPageSize}
          itemLabel="entry"
        />
      </CardContent>
    </Card>
  );
}
