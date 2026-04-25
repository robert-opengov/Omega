'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  DataTable,
  Pagination,
  type Column,
} from '@/components/ui/molecules';
import type { NotificationLogEntry } from '@/lib/core/ports/notification.repository';

interface NotificationLogsTableProps {
  appId: string;
  items: NotificationLogEntry[];
  total: number;
  offset: number;
  limit: number;
}

const STATUS_OPTIONS = ['', 'sent', 'failed', 'queued', 'bounced'] as const;

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'sent':
      return 'success';
    case 'failed':
      return 'danger';
    case 'bounced':
      return 'warning';
    case 'queued':
      return 'info';
    default:
      return 'default';
  }
}

export function NotificationLogsTable({
  items,
  total,
  offset,
  limit,
}: NotificationLogsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') sp.delete(key);
    else sp.set(key, value);
    router.replace(`?${sp.toString()}`);
  };

  const onPage = (page: number) => {
    const newOffset = (page - 1) * limit;
    setParam('offset', String(newOffset));
  };

  const onPageSize = (size: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('limit', String(size));
    sp.set('offset', '0');
    router.replace(`?${sp.toString()}`);
  };

  const status = searchParams.get('status') ?? '';
  const notificationId = searchParams.get('notificationId') ?? '';

  const columns: Column<NotificationLogEntry & Record<string, unknown>>[] = [
    {
      key: 'createdAt',
      header: 'Sent at',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant(row.status)} size="sm">{row.status}</Badge>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => row.channel ?? '—',
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (row) => row.recipient ?? '—',
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (row) => row.attempts ?? '—',
    },
    {
      key: 'error',
      header: 'Error',
      render: (row) => row.error ? (
        <Text size="xs" className="text-danger-text truncate max-w-xs block">{row.error}</Text>
      ) : '—',
    },
  ];

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Status</label>
            <select
              className="rounded border border-border bg-background px-3 py-1.5 text-sm"
              value={status}
              onChange={(e) => setParam('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s || 'all'} value={s}>{s || 'All'}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Notification ID</label>
            <input
              className="rounded border border-border bg-background px-3 py-1.5 text-sm"
              value={notificationId}
              onChange={(e) => setParam('notificationId', e.target.value)}
              placeholder="filter by id"
            />
          </div>
          <Text size="sm" color="muted" className="ml-auto">
            {total} log{total === 1 ? '' : 's'}
          </Text>
        </div>

        <DataTable
          data={items as Array<NotificationLogEntry & Record<string, unknown>>}
          columns={columns}
          keyExtractor={(r) => r.id}
          density="compact"
          emptyMessage="No log entries match the current filters."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          onPageChange={onPage}
          onPageSizeChange={onPageSize}
          itemLabel="log"
        />
      </CardContent>
    </Card>
  );
}
