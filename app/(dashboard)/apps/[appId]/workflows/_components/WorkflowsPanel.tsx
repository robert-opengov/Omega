'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Inbox, Play, Workflow as WorkflowIcon } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  RadioGroup,
  Select,
  Switch,
  Text,
} from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Modal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type Column,
} from '@/components/ui/molecules';
import {
  createWorkflowAction,
  deleteWorkflowAction,
  updateWorkflowAction,
  type ActionResult,
} from '@/app/actions/workflows';
import type {
  Workflow,
  WorkflowInstance,
  WorkflowTask,
  WorkflowTriggerOn,
} from '@/lib/core/ports/workflow.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import { TaskInboxPanel } from './TaskInboxPanel';
import { InstancesTable } from './InstancesTable';

interface WorkflowsPanelProps {
  appId: string;
  initialWorkflows: Workflow[];
  initialInstances: WorkflowInstance[];
  initialTasks: WorkflowTask[];
  tables: GabTable[];
  initialError?: string | null;
}

const TRIGGER_OPTIONS: { value: WorkflowTriggerOn; label: string }[] = [
  { value: 'create', label: 'On create' },
  { value: 'update', label: 'On update' },
  { value: 'delete', label: 'On delete' },
  { value: 'any', label: 'Any change' },
];

export function WorkflowsPanel({
  appId,
  initialWorkflows,
  initialInstances,
  initialTasks,
  tables,
  initialError = null,
}: Readonly<WorkflowsPanelProps>) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(initialError);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [triggerTableId, setTriggerTableId] = useState('');
  const [triggerOn, setTriggerOn] = useState<WorkflowTriggerOn>('create');
  const [confirmDelete, setConfirmDelete] = useState<Workflow | null>(null);
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
      const res = await createWorkflowAction(appId, {
        name,
        config: {
          triggerTableId: triggerTableId || undefined,
          triggerOn,
          steps: [],
        },
        active: false,
      });
      handleMutation(res, (created) => {
        setWorkflows((prev) => [created, ...prev]);
        setCreateOpen(false);
        setName('');
        setTriggerTableId('');
        setTriggerOn('create');
      });
    });
  };

  const onToggleActive = (wf: Workflow, next: boolean) => {
    setError(null);
    startTransition(async () => {
      const res = await updateWorkflowAction(appId, wf.id, { active: next });
      handleMutation(res, (updated) => {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === wf.id ? { ...w, ...updated } : w)),
        );
      });
    });
  };

  const onDelete = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setError(null);
    startTransition(async () => {
      const res = await deleteWorkflowAction(appId, id);
      handleMutation(res, () => {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        setConfirmDelete(null);
      });
    });
  };

  const workflowColumns: Column<Workflow & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Link
          href={`/apps/${appId}/workflows/${row.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.name || '(untitled)'}
        </Link>
      ),
    },
    {
      key: 'trigger',
      header: 'Trigger',
      sortable: false,
      render: (row) => {
        const tableId = row.config?.triggerTableId;
        const tableName = tableId ? tableNameById.get(tableId) ?? tableId : '—';
        const on = row.config?.triggerOn ?? 'create';
        return (
          <span className="text-xs text-muted-foreground">
            {tableName} · {on}
          </span>
        );
      },
    },
    {
      key: 'active',
      header: 'Active',
      sortable: false,
      render: (row) => (
        <Switch
          checked={Boolean(row.active)}
          onCheckedChange={(next) => onToggleActive(row, next)}
          aria-label={row.active ? 'Deactivate workflow' : 'Activate workflow'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/apps/${appId}/workflows/${row.id}`}
            className="inline-flex h-7 items-center rounded border border-border px-2 text-xs font-semibold text-foreground hover:bg-action-hover-primary"
          >
            Edit
          </Link>
          <Link
            href={`/apps/${appId}/workflows/${row.id}/runs`}
            className="inline-flex h-7 items-center rounded border border-border px-2 text-xs font-semibold text-foreground hover:bg-action-hover-primary"
          >
            Runs
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
        <h1 className="text-xl font-semibold text-foreground">Workflows</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New workflow
        </Button>
      </div>
      {error ? (
        <Text size="sm" className="text-destructive">
          {error}
        </Text>
      ) : null}
      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows" className="gap-2">
            <WorkflowIcon className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="instances" className="gap-2">
            <Play className="h-4 w-4" />
            Instances
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {tasks.length > 0 ? (
              <Badge variant="primary" size="sm">
                {tasks.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <Card>
            <CardContent className="p-0">
              {workflows.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No workflows yet"
                    description="Create your first workflow for this app."
                  />
                </div>
              ) : (
                <DataTable
                  data={workflows as (Workflow & Record<string, unknown>)[]}
                  columns={workflowColumns}
                  keyExtractor={(row) => row.id}
                  density="compact"
                  emptyMessage="No workflows"
                  tableLabel="Workflows"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances">
          <InstancesTable
            appId={appId}
            instances={initialInstances}
            workflowNameById={Object.fromEntries(
              workflows.map((w) => [w.id, w.name]),
            )}
          />
        </TabsContent>

        <TabsContent value="inbox">
          <TaskInboxPanel
            appId={appId}
            initialTasks={tasks}
            workflowNameById={Object.fromEntries(
              workflows.map((w) => [w.id, w.name]),
            )}
            onTasksChange={setTasks}
          />
        </TabsContent>
      </Tabs>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create workflow"
        description="Pick a trigger table and event to start. You can edit the steps in the builder."
      >
        <div className="space-y-3">
          <Input
            placeholder="Workflow name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Workflow name"
          />
          <Select
            value={triggerTableId}
            onChange={(e) => setTriggerTableId(e.target.value)}
            aria-label="Trigger table"
          >
            <option value="">Select trigger table…</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </Select>
          <RadioGroup
            value={triggerOn}
            onValueChange={(v) => setTriggerOn(v as WorkflowTriggerOn)}
            items={TRIGGER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
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
        title="Delete workflow?"
        description={
          confirmDelete
            ? `“${confirmDelete.name}” and its run history will no longer be accessible from this app.`
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
