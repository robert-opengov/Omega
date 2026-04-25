'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  DataTable,
  EmptyState,
  type Column,
} from '@/components/ui/molecules';
import type { WorkflowInstance } from '@/lib/core/ports/workflow.repository';

interface InstancesTableProps {
  appId: string;
  instances: WorkflowInstance[];
  workflowNameById: Record<string, string>;
}

function statusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'cancelled':
      return 'warning';
    case 'running':
      return 'inProgress';
    default:
      return 'default';
  }
}

export function InstancesTable({
  appId,
  instances,
  workflowNameById,
}: Readonly<InstancesTableProps>) {
  const columns: Column<WorkflowInstance & Record<string, unknown>>[] = [
    {
      key: 'workflow',
      header: 'Workflow',
      render: (row) => (
        <Link
          href={`/apps/${appId}/workflows/instances/${row.id}`}
          className="text-sm text-primary hover:underline"
        >
          {workflowNameById[row.workflowId] ?? row.workflowId}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant(row.status) as never} size="sm">
          {row.status || 'unknown'}
        </Badge>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.startedAt ? new Date(row.startedAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.completedAt ? new Date(row.completedAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'error',
      header: 'Error',
      sortable: false,
      render: (row) =>
        row.error ? (
          <span className="text-xs text-destructive line-clamp-1">{row.error}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  if (instances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            title="No runs yet"
            description="Workflow runs will appear here once a trigger fires."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable
          data={instances as (WorkflowInstance & Record<string, unknown>)[]}
          columns={columns}
          keyExtractor={(row) => row.id}
          density="compact"
          emptyMessage="No runs"
          tableLabel="Workflow runs"
        />
      </CardContent>
    </Card>
  );
}
